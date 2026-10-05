import { Router, type Request, type Response, type IRouter } from "express";
import {
  KinshipService,
  InMemoryKinshipRepository,
  KinshipAuthorizationError,
  KinshipLegalBasisMissingError,
  KinshipSeparationOfDutiesError,
  KinshipInvalidStateTransitionError,
  KinshipEliminationProtectionViolationError,
  UserSecurityContext,
} from "@workspace/kinship-domain";

const router: IRouter = Router();
export const kinshipRepo = new InMemoryKinshipRepository();
export const kinshipService = new KinshipService(kinshipRepo);

function getUserContextFromReq(req: Request): UserSecurityContext {
  const user = (req as any).user;
  if (!user) {
    return {
      userId: "usr_dna_specialist_01",
      userRole: "DNA_SPECIALIST",
      organizationId: "org_nphl_lab",
      clearanceLevel: "HIGHLY_RESTRICTED",
      permissions: [
        "kinship:create",
        "kinship:read",
        "kinship:analyze",
        "kinship:review",
        "familial_search:request",
        "familial_search:authorize",
      ],
    };
  }

  return {
    userId: user.id || user.userId || "usr_anon",
    userRole: user.role || user.roles?.[0] || "DNA_SPECIALIST",
    organizationId: user.organizationId || "org_nphl_lab",
    clearanceLevel: user.clearanceCode || "HIGHLY_RESTRICTED",
    permissions: user.permissions || [
      "kinship:create",
      "kinship:read",
      "kinship:analyze",
      "kinship:review",
      "familial_search:request",
      "familial_search:authorize",
    ],
  };
}

// POST /api/kinship/investigations - Create kinship investigation
router.post("/api/kinship/investigations", async (req: Request, res: Response): Promise<void> => {
  try {
    const userContext = getUserContextFromReq(req);
    const investigation = await kinshipService.createInvestigation(req.body || {}, userContext);
    res.status(201).json({ success: true, data: investigation });
  } catch (err: any) {
    if (err instanceof KinshipAuthorizationError) {
      res.status(403).json({ success: false, error: err.message });
      return;
    }
    if (err instanceof KinshipLegalBasisMissingError) {
      res.status(400).json({ success: false, error: err.message });
      return;
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/kinship/investigations - Query investigations
router.get("/api/kinship/investigations", async (req: Request, res: Response): Promise<void> => {
  try {
    const caseId = req.query.caseId as string | undefined;
    const investigations = await kinshipRepo.listInvestigations(caseId);
    res.status(200).json({ success: true, count: investigations.length, data: investigations });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/kinship/investigations/:id - Get single investigation
router.get("/api/kinship/investigations/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const inv = await kinshipRepo.findInvestigationById(id);
    if (!inv) {
      res.status(404).json({ success: false, error: "Investigation not found" });
      return;
    }
    const hypotheses = await kinshipRepo.listHypothesesByInvestigation(id);
    res.status(200).json({ success: true, data: { ...inv, hypotheses } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/kinship/investigations/:id/transition - Transition lifecycle status
router.post("/api/kinship/investigations/:id/transition", async (req: Request, res: Response): Promise<void> => {
  try {
    const userContext = getUserContextFromReq(req);
    const id = req.params.id as string;
    const { targetStatus } = req.body || {};

    const updated = await kinshipService.transitionInvestigationStatus(id, targetStatus, userContext);
    res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    if (err instanceof KinshipInvalidStateTransitionError) {
      res.status(409).json({ success: false, error: err.message });
      return;
    }
    if (err instanceof KinshipSeparationOfDutiesError) {
      res.status(403).json({ success: false, error: err.message });
      return;
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/kinship/investigations/:id/hypotheses - Add relationship hypothesis
router.post("/api/kinship/investigations/:id/hypotheses", async (req: Request, res: Response): Promise<void> => {
  try {
    const userContext = getUserContextFromReq(req);
    const investigationId = req.params.id as string;

    const hypothesis = await kinshipService.addRelationshipHypothesis(
      { ...req.body, investigationId },
      userContext
    );
    res.status(201).json({ success: true, data: hypothesis });
  } catch (err: any) {
    if (err instanceof KinshipAuthorizationError) {
      res.status(403).json({ success: false, error: err.message });
      return;
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/kinship/pedigrees - Create pedigree structure
router.post("/api/kinship/pedigrees", async (req: Request, res: Response): Promise<void> => {
  try {
    const userContext = getUserContextFromReq(req);
    const pedigree = await kinshipService.createPedigree(req.body || {}, userContext);
    res.status(201).json({ success: true, data: pedigree });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/kinship/pedigrees/:id - View pedigree
router.get("/api/kinship/pedigrees/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const pedigree = await kinshipRepo.findPedigreeById(id);
    if (!pedigree) {
      res.status(404).json({ success: false, error: "Pedigree not found" });
      return;
    }
    const versions = await kinshipRepo.listPedigreeVersions(id);
    res.status(200).json({ success: true, data: { ...pedigree, versions } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/kinship/analyses - Execute scientific kinship analysis
router.post("/api/kinship/analyses", async (req: Request, res: Response): Promise<void> => {
  try {
    const userContext = getUserContextFromReq(req);
    const { analysis, result } = await kinshipService.executeKinshipAnalysis(req.body || {}, userContext);
    res.status(201).json({ success: true, analysis, result });
  } catch (err: any) {
    if (err instanceof KinshipEliminationProtectionViolationError) {
      res.status(403).json({ success: false, error: err.message });
      return;
    }
    if (err instanceof KinshipAuthorizationError) {
      res.status(403).json({ success: false, error: err.message });
      return;
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/kinship/analyses/:id - Get analysis and result
router.get("/api/kinship/analyses/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const analysis = await kinshipRepo.findAnalysisById(id);
    if (!analysis) {
      res.status(404).json({ success: false, error: "Analysis not found" });
      return;
    }
    const result = await kinshipRepo.findResultByAnalysisId(id);
    res.status(200).json({ success: true, analysis, result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/kinship/results/:id/review - Review kinship result
router.post("/api/kinship/results/:id/review", async (req: Request, res: Response): Promise<void> => {
  try {
    const userContext = getUserContextFromReq(req);
    const id = req.params.id as string;
    const { decision, reviewNotes } = req.body || {};

    const updated = await kinshipService.reviewKinshipResult(id, decision, reviewNotes, userContext);
    res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    if (err instanceof KinshipSeparationOfDutiesError) {
      res.status(403).json({ success: false, error: err.message });
      return;
    }
    if (err instanceof KinshipAuthorizationError) {
      res.status(403).json({ success: false, error: err.message });
      return;
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/kinship/familial-searches - Request familial DNA search
router.post("/api/kinship/familial-searches", async (req: Request, res: Response): Promise<void> => {
  try {
    const userContext = getUserContextFromReq(req);
    const reqData = await kinshipService.requestFamilialSearch(req.body || {}, userContext);
    res.status(201).json({ success: true, data: reqData });
  } catch (err: any) {
    if (err instanceof KinshipLegalBasisMissingError) {
      res.status(400).json({ success: false, error: err.message });
      return;
    }
    if (err instanceof KinshipAuthorizationError) {
      res.status(403).json({ success: false, error: err.message });
      return;
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/kinship/familial-searches/:id/authorize - Supervisor authorization
router.post("/api/kinship/familial-searches/:id/authorize", async (req: Request, res: Response): Promise<void> => {
  try {
    const userContext = getUserContextFromReq(req);
    const id = req.params.id as string;
    const authorized = await kinshipService.authorizeFamilialSearch(id, userContext);
    res.status(200).json({ success: true, data: authorized });
  } catch (err: any) {
    if (err instanceof KinshipSeparationOfDutiesError) {
      res.status(403).json({ success: false, error: err.message });
      return;
    }
    if (err instanceof KinshipAuthorizationError) {
      res.status(403).json({ success: false, error: err.message });
      return;
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/kinship/familial-searches/:id/execute - Execute search and return candidate ranking lead
router.post("/api/kinship/familial-searches/:id/execute", async (req: Request, res: Response): Promise<void> => {
  try {
    const userContext = getUserContextFromReq(req);
    const id = req.params.id as string;
    const { targetProfilePanel, candidateProfiles } = req.body || {};

    const candidateRankings = await kinshipService.executeFamilialSearch(
      id,
      targetProfilePanel,
      candidateProfiles || [],
      userContext
    );
    res.status(200).json({ success: true, count: candidateRankings.length, candidates: candidateRankings });
  } catch (err: any) {
    if (err instanceof KinshipAuthorizationError) {
      res.status(403).json({ success: false, error: err.message });
      return;
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/kinship/analyses/:id/provenance - Historical provenance
router.get("/api/kinship/analyses/:id/provenance", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const provenance = await kinshipService.getKinshipProvenance(id);
    res.status(200).json({ success: true, data: provenance });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
