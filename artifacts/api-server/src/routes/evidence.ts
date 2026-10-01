import { Router, type Request, type Response, type IRouter } from "express";
import {
  EvidenceAggregate,
  EvidenceService,
  InMemoryEvidenceRepository,
  UnauthorizedEvidenceActionError,
  EvidenceNotFoundError,
  ConcurrencyConflictError,
  LegalHoldViolationError,
} from "@workspace/evidence-domain";
import type { Subject } from "@workspace/security";

const router: IRouter = Router();
export const evidenceRepo = new InMemoryEvidenceRepository();
export const evidenceService = new EvidenceService(evidenceRepo);

function getSubjectFromReq(req: Request): Subject {
  const user = (req as any).user;
  if (!user) {
    return {
      userId: "usr_anon",
      email: "anon@kfin.go.ke",
      badgeNumber: "BADGE-000",
      fullName: "Anonymous Officer",
      organizationId: "org_dci_hq",
      organizationCode: "DCIHQ",
      clearanceLevel: 3,
      clearanceCode: "RESTRICTED",
      accountStatus: "ACTIVE",
      roles: ["INVESTIGATOR"],
      permissions: [
        "evidence:create",
        "evidence:read",
        "evidence:update",
        "evidence:transfer",
        "evidence:dispose",
        "vault:manage",
        "legal_hold:manage",
      ],
      isServiceIdentity: false,
    };
  }

  return {
    userId: user.id || user.userId || "usr_anon",
    email: user.email || "anon@kfin.go.ke",
    badgeNumber: user.badgeNumber || "BADGE-000",
    fullName: user.fullName || "Anonymous Officer",
    organizationId: user.organizationId || "org_dci_hq",
    organizationCode: user.organizationCode || "DCIHQ",
    clearanceLevel: user.clearanceLevel || 3,
    clearanceCode: user.clearanceCode || "RESTRICTED",
    accountStatus: user.accountStatus || "ACTIVE",
    roles: user.roles || ["INVESTIGATOR"],
    permissions: user.permissions || [
      "evidence:create",
      "evidence:read",
      "evidence:update",
      "evidence:transfer",
      "evidence:dispose",
      "vault:manage",
    ],
    isServiceIdentity: Boolean(user.isServiceIdentity),
  };
}

// POST /api/evidence - Register new exhibit
router.post("/api/evidence", async (req: Request, res: Response): Promise<void> => {
  try {
    const subject = getSubjectFromReq(req);
    const body = req.body || {};

    const aggregate = await evidenceService.createEvidence(subject, {
      id: body.id || `evd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      caseId: body.caseId,
      itemNumber: body.itemNumber || "EX-01",
      description: body.description || "Evidentiary exhibit",
      evidenceType: body.evidenceType || "PHYSICAL_EXHIBIT",
      classification: body.classification || "RESTRICTED",
      collectionTimestamp: body.collectionTimestamp || new Date().toISOString(),
      collectedById: body.collectedById || subject.userId,
      collectionLocationDesc: body.collectionLocationDesc || "Crime Scene Location",
      currentLocationId: body.currentLocationId || "loc_vault_01",
      currentCustodianId: body.currentCustodianId || subject.userId,
      tamperSealNumber: body.tamperSealNumber || `SEAL-${Date.now()}`,
      integrityHash: body.integrityHash || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      packagingType: body.packagingType || "EVIDENCE_BAG",
      notes: body.notes,
    });

    res.status(201).json({
      success: true,
      data: aggregate.getState(),
      seals: aggregate.getSeals(),
      custodyEvents: aggregate.getCustodyEvents(),
    });
  } catch (err: any) {
    if (err instanceof UnauthorizedEvidenceActionError) {
      res.status(403).json({ success: false, error: err.message });
      return;
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/evidence - Query evidence exhibits
router.get("/api/evidence", async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = {
      caseId: req.query.caseId as string,
      status: req.query.status as string,
      evidenceType: req.query.evidenceType as string,
      currentCustodianId: req.query.currentCustodianId as string,
    };

    const aggregates = await evidenceRepo.search(filters);
    const results = aggregates.map((agg: EvidenceAggregate) => agg.getState());

    res.status(200).json({ success: true, count: results.length, data: results });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/evidence/:id - Retrieve detail view of single exhibit
router.get("/api/evidence/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const subject = getSubjectFromReq(req);
    const id = req.params.id as string;
    const aggregate = await evidenceService.getEvidenceById(subject, id);

    res.status(200).json({
      success: true,
      data: aggregate.getState(),
      custodyEvents: aggregate.getCustodyEvents(),
      seals: aggregate.getSeals(),
      transfers: aggregate.getTransfers(),
      exceptions: aggregate.getExceptions(),
      derivatives: aggregate.getDerivatives(),
      examinations: aggregate.getExaminations(),
      dispositions: aggregate.getDispositions(),
      verifications: aggregate.getVerifications(),
    });
  } catch (err: any) {
    if (err instanceof EvidenceNotFoundError) {
      res.status(404).json({ success: false, error: err.message });
      return;
    }
    if (err instanceof UnauthorizedEvidenceActionError) {
      res.status(403).json({ success: false, error: err.message });
      return;
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/evidence/:id/seal - Seal exhibit
router.post("/api/evidence/:id/seal", async (req: Request, res: Response): Promise<void> => {
  try {
    const subject = getSubjectFromReq(req);
    const id = req.params.id as string;
    const { sealNumber, sealType, expectedVersion } = req.body;

    const aggregate = await evidenceService.sealEvidence(
      subject,
      id,
      sealNumber,
      sealType,
      expectedVersion
    );

    res.status(200).json({ success: true, data: aggregate.getState(), seals: aggregate.getSeals() });
  } catch (err: any) {
    if (err instanceof ConcurrencyConflictError) {
      res.status(409).json({ success: false, error: err.message });
      return;
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/evidence/:id/seal-break - Controlled seal breaking
router.post("/api/evidence/:id/seal-break", async (req: Request, res: Response): Promise<void> => {
  try {
    const subject = getSubjectFromReq(req);
    const id = req.params.id as string;
    const { reason, authorizationReference, expectedVersion } = req.body;

    const aggregate = await evidenceService.breakSeal(
      subject,
      id,
      reason,
      authorizationReference,
      expectedVersion
    );

    res.status(200).json({ success: true, data: aggregate.getState(), seals: aggregate.getSeals() });
  } catch (err: any) {
    if (err instanceof ConcurrencyConflictError) {
      res.status(409).json({ success: false, error: err.message });
      return;
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/evidence/:id/transfer - Initiate custody transfer
router.post("/api/evidence/:id/transfer", async (req: Request, res: Response): Promise<void> => {
  try {
    const subject = getSubjectFromReq(req);
    const id = req.params.id as string;
    const { receivingOfficerId, transferReason, authorizationReference, destinationLocationId, expectedVersion } = req.body;

    const aggregate = await evidenceService.initiateTransfer(
      subject,
      id,
      receivingOfficerId,
      transferReason,
      authorizationReference,
      destinationLocationId,
      expectedVersion
    );

    res.status(200).json({ success: true, data: aggregate.getState(), transfers: aggregate.getTransfers() });
  } catch (err: any) {
    if (err instanceof UnauthorizedEvidenceActionError) {
      res.status(403).json({ success: false, error: err.message });
      return;
    }
    if (err instanceof ConcurrencyConflictError) {
      res.status(409).json({ success: false, error: err.message });
      return;
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/evidence/:id/receive - Accept custody transfer
router.post("/api/evidence/:id/receive", async (req: Request, res: Response): Promise<void> => {
  try {
    const subject = getSubjectFromReq(req);
    const id = req.params.id as string;
    const { destinationLocationId, sealIntact, newSealNumber, notes, expectedVersion } = req.body;

    const aggregate = await evidenceService.receiveTransfer(
      subject,
      id,
      destinationLocationId,
      sealIntact !== false,
      newSealNumber,
      notes,
      expectedVersion
    );

    res.status(200).json({ success: true, data: aggregate.getState(), exceptions: aggregate.getExceptions() });
  } catch (err: any) {
    if (err instanceof ConcurrencyConflictError) {
      res.status(409).json({ success: false, error: err.message });
      return;
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/evidence/:id/retrieve - Retrieve from storage vault
router.post("/api/evidence/:id/retrieve", async (req: Request, res: Response): Promise<void> => {
  try {
    const subject = getSubjectFromReq(req);
    const id = req.params.id as string;
    const { purpose, authorizationReference, expectedVersion } = req.body;

    const aggregate = await evidenceService.retrieveFromStorage(
      subject,
      id,
      purpose,
      authorizationReference,
      expectedVersion
    );

    res.status(200).json({ success: true, data: aggregate.getState() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/evidence/:id/return - Return exhibit to storage vault
router.post("/api/evidence/:id/return", async (req: Request, res: Response): Promise<void> => {
  try {
    const subject = getSubjectFromReq(req);
    const id = req.params.id as string;
    const { destinationLocationId, notes, expectedVersion } = req.body;

    const aggregate = await evidenceService.returnToStorage(
      subject,
      id,
      destinationLocationId,
      notes,
      expectedVersion
    );

    res.status(200).json({ success: true, data: aggregate.getState() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/evidence/:id/derivatives - Create derived exhibit/sub-item
router.post("/api/evidence/:id/derivatives", async (req: Request, res: Response): Promise<void> => {
  try {
    const subject = getSubjectFromReq(req);
    const id = req.params.id as string;
    const { derivedEvidenceId, derivativeType, purpose, amountUsed, remainingAmount, expectedVersion } = req.body;

    const aggregate = await evidenceService.addDerivative(
      subject,
      id,
      derivedEvidenceId,
      derivativeType,
      purpose,
      amountUsed,
      remainingAmount,
      expectedVersion
    );

    res.status(201).json({ success: true, data: aggregate.getState(), derivatives: aggregate.getDerivatives() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/evidence/:id/disposition - Authorized evidence disposal
router.post("/api/evidence/:id/disposition", async (req: Request, res: Response): Promise<void> => {
  try {
    const subject = getSubjectFromReq(req);
    const id = req.params.id as string;
    const { approvedById, dispositionType, authorizationReference, disposalMethod, witnessById, expectedVersion } = req.body;

    const aggregate = await evidenceService.disposeEvidence(
      subject,
      id,
      approvedById,
      dispositionType,
      authorizationReference,
      disposalMethod,
      witnessById,
      expectedVersion
    );

    res.status(200).json({ success: true, data: aggregate.getState(), dispositions: aggregate.getDispositions() });
  } catch (err: any) {
    if (err instanceof LegalHoldViolationError) {
      res.status(412).json({ success: false, error: err.message });
      return;
    }
    if (err instanceof UnauthorizedEvidenceActionError) {
      res.status(403).json({ success: false, error: err.message });
      return;
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/evidence/:id/verify-integrity - Check digital integrity hash
router.post("/api/evidence/:id/verify-integrity", async (req: Request, res: Response): Promise<void> => {
  try {
    const subject = getSubjectFromReq(req);
    const id = req.params.id as string;
    const { observedHash } = req.body;

    const result = await evidenceService.verifyIntegrity(subject, id, observedHash);

    res.status(200).json({
      success: true,
      verification: result.verification,
      data: result.aggregate.getState(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/evidence/:id/custody-history - Complete immutable custody timeline
router.get("/api/evidence/:id/custody-history", async (req: Request, res: Response): Promise<void> => {
  try {
    const subject = getSubjectFromReq(req);
    const id = req.params.id as string;
    const aggregate = await evidenceService.getEvidenceById(subject, id);

    res.status(200).json({
      success: true,
      evidenceId: id,
      reference: aggregate.getState().evidenceReference,
      timeline: aggregate.getCustodyEvents(),
      seals: aggregate.getSeals(),
      transfers: aggregate.getTransfers(),
      exceptions: aggregate.getExceptions(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
