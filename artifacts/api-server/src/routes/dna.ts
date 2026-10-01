import { Router, type Request, type Response, type IRouter } from "express";
import {
  DnaService,
  InMemoryDnaRepository,
  UnauthorizedDnaActionError,
  DnaProfileNotFoundError,
  DnaConcurrencyConflictError,
  DnaLegalHoldViolationError,
} from "@workspace/dna-domain";
import type { Subject } from "@workspace/security";

const router: IRouter = Router();
export const dnaRepo = new InMemoryDnaRepository();
export const dnaService = new DnaService(dnaRepo);

function getSubjectFromReq(req: Request): Subject {
  const user = (req as any).user;
  if (!user) {
    return {
      userId: "usr_lab_analyst_01",
      email: "analyst@nphl.go.ke",
      badgeNumber: "NPHL-9912",
      fullName: "Dr. Mutua",
      organizationId: "org_nphl_lab",
      organizationCode: "NPHL",
      clearanceLevel: 4,
      clearanceCode: "CONFIDENTIAL",
      accountStatus: "ACTIVE",
      roles: ["LAB_ANALYST"],
      permissions: [
        "dna:create",
        "dna:read",
        "dna:approve",
        "dna:search",
        "dna:review_match",
        "index:access_restricted",
        "search:restricted_index",
      ],
      isServiceIdentity: false,
    };
  }

  return {
    userId: user.id || user.userId || "usr_anon",
    email: user.email || "anon@kfin.go.ke",
    badgeNumber: user.badgeNumber || "BADGE-000",
    fullName: user.fullName || "Anonymous Officer",
    organizationId: user.organizationId || "org_nphl_lab",
    organizationCode: user.organizationCode || "NPHL",
    clearanceLevel: user.clearanceLevel || 4,
    clearanceCode: user.clearanceCode || "CONFIDENTIAL",
    accountStatus: user.accountStatus || "ACTIVE",
    roles: user.roles || ["LAB_ANALYST"],
    permissions: user.permissions || [
      "dna:create",
      "dna:read",
      "dna:approve",
      "dna:search",
      "dna:review_match",
    ],
    isServiceIdentity: Boolean(user.isServiceIdentity),
  };
}

// POST /api/dna/samples - Register biological sample
router.post("/api/dna/samples", async (req: Request, res: Response): Promise<void> => {
  try {
    const subject = getSubjectFromReq(req);
    const sample = await dnaService.createBiologicalSample(subject, req.body || {});
    res.status(201).json({ success: true, data: sample });
  } catch (err: any) {
    if (err instanceof UnauthorizedDnaActionError) {
      res.status(403).json({ success: false, error: err.message });
      return;
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/dna/profiles - Create DNA profile with STR loci
router.post("/api/dna/profiles", async (req: Request, res: Response): Promise<void> => {
  try {
    const subject = getSubjectFromReq(req);
    const body = req.body || {};

    const aggregate = await dnaService.createProfile(subject, {
      id: body.id,
      sampleId: body.sampleId,
      indexCode: body.indexCode || "FORENSIC",
      profileIdentifier: body.profileIdentifier,
      profileQuality: body.profileQuality,
      extractionMethod: body.extractionMethod,
      quantificationKit: body.quantificationKit,
      amplificationKit: body.amplificationKit,
      electrophoresisInstrument: body.electrophoresisInstrument,
      classification: body.classification,
      alleles: body.alleles || [],
      notes: body.notes,
    });

    res.status(201).json({ success: true, data: aggregate.getState() });
  } catch (err: any) {
    if (err instanceof UnauthorizedDnaActionError) {
      res.status(403).json({ success: false, error: err.message });
      return;
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/dna/profiles - Query DNA profiles
router.get("/api/dna/profiles", async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = {
      indexCode: req.query.indexCode as any,
      status: req.query.status as string,
      sampleId: req.query.sampleId as string,
    };

    const aggregates = await dnaRepo.searchProfiles(filters);
    const results = aggregates.map((agg) => agg.getState());

    res.status(200).json({ success: true, count: results.length, data: results });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/dna/profiles/:id - Detail view of single DNA profile
router.get("/api/dna/profiles/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const subject = getSubjectFromReq(req);
    const id = req.params.id as string;
    const aggregate = await dnaService.getProfileById(subject, id);
    res.status(200).json({ success: true, data: aggregate.getState() });
  } catch (err: any) {
    if (err instanceof DnaProfileNotFoundError) {
      res.status(404).json({ success: false, error: err.message });
      return;
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/dna/profiles/:id/approve - Quality review & approval into active index
router.post("/api/dna/profiles/:id/approve", async (req: Request, res: Response): Promise<void> => {
  try {
    const subject = getSubjectFromReq(req);
    const id = req.params.id as string;
    const { expectedVersion } = req.body || {};

    const aggregate = await dnaService.approveProfile(subject, id, expectedVersion);
    res.status(200).json({ success: true, data: aggregate.getState() });
  } catch (err: any) {
    if (err instanceof DnaConcurrencyConflictError) {
      res.status(409).json({ success: false, error: err.message });
      return;
    }
    if (err instanceof UnauthorizedDnaActionError) {
      res.status(403).json({ success: false, error: err.message });
      return;
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/dna/profiles/:id/withdraw - Withdraw profile from active search
router.post("/api/dna/profiles/:id/withdraw", async (req: Request, res: Response): Promise<void> => {
  try {
    const subject = getSubjectFromReq(req);
    const id = req.params.id as string;
    const { reason, expectedVersion } = req.body || {};

    const aggregate = await dnaService.withdrawProfile(subject, id, reason || "Withdrawn", expectedVersion);
    res.status(200).json({ success: true, data: aggregate.getState() });
  } catch (err: any) {
    if (err instanceof DnaLegalHoldViolationError) {
      res.status(412).json({ success: false, error: err.message });
      return;
    }
    if (err instanceof UnauthorizedDnaActionError) {
      res.status(403).json({ success: false, error: err.message });
      return;
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/dna/indices - List national DNA indices
router.get("/api/dna/indices", async (_req: Request, res: Response): Promise<void> => {
  try {
    const indices = await dnaRepo.getIndices();
    res.status(200).json({ success: true, data: indices });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/dna/searches - Execute authorized DNA search across indices
router.post("/api/dna/searches", async (req: Request, res: Response): Promise<void> => {
  try {
    const subject = getSubjectFromReq(req);
    const body = req.body || {};

    const output = await dnaService.executeSearch(subject, {
      targetProfileId: body.targetProfileId,
      targetIndices: body.targetIndices || ["OFFENDER", "FORENSIC"],
      minMatchingLoci: body.minMatchingLoci || 13,
      searchPurpose: body.searchPurpose || "CRIMINAL_INVESTIGATION",
    });

    res.status(201).json({
      success: true,
      request: output.request,
      results: output.results,
    });
  } catch (err: any) {
    if (err instanceof UnauthorizedDnaActionError) {
      res.status(403).json({ success: false, error: err.message });
      return;
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/dna/searches/:id - Get search request and results
router.get("/api/dna/searches/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const request = await dnaRepo.getMatchingRequestById(id);
    if (!request) {
      res.status(404).json({ success: false, error: "Search request not found" });
      return;
    }

    const results = await dnaRepo.getMatchingResultsByRequestId(id);
    res.status(200).json({ success: true, request, results });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/dna/matches/:id/review - Perform scientific match review
router.post("/api/dna/matches/:id/review", async (req: Request, res: Response): Promise<void> => {
  try {
    const subject = getSubjectFromReq(req);
    const id = req.params.id as string;
    const { decision, reviewNotes } = req.body || {};

    const result = await dnaService.reviewCandidateMatch(
      subject,
      id,
      decision,
      reviewNotes || "Reviewed by forensic scientist"
    );

    res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    if (err instanceof UnauthorizedDnaActionError) {
      res.status(403).json({ success: false, error: err.message });
      return;
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/dna/profiles/:id/provenance - Trace profile provenance
router.get("/api/dna/profiles/:id/provenance", async (req: Request, res: Response): Promise<void> => {
  try {
    const subject = getSubjectFromReq(req);
    const id = req.params.id as string;
    const provenance = await dnaService.getProvenance(subject, id);
    res.status(200).json({ success: true, data: provenance });
  } catch (err: any) {
    if (err instanceof DnaProfileNotFoundError) {
      res.status(404).json({ success: false, error: err.message });
      return;
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
