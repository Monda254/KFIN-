import { Router, type Request, type Response, type IRouter } from "express";
import {
  IntelligenceService,
  InMemoryIntelligenceRepository,
  IntelligenceAuthorizationError,
  IntelligenceInvalidStateTransitionError,
  IntelligenceSeparationOfDutiesError,
  IntelligenceUserContext,
} from "@workspace/intelligence-domain";

const router: IRouter = Router();
export const intelligenceRepo = new InMemoryIntelligenceRepository();
export const intelligenceService = new IntelligenceService(intelligenceRepo);

function getUserContextFromReq(req: Request): IntelligenceUserContext {
  const user = (req as any).user;
  if (!user) {
    return {
      userId: "usr_intel_analyst_01",
      userRole: "INVESTIGATOR",
      organizationId: "org_nphl_lab",
      clearanceLevel: "HIGHLY_RESTRICTED",
      permissions: [
        "intelligence:read",
        "intelligence:create",
        "intelligence:lead_manage",
        "intelligence:graph_traverse",
        "intelligence:case_link",
        "intelligence:export",
      ],
    };
  }

  return {
    userId: user.id || user.userId || "usr_anon",
    userRole: user.role || user.roles?.[0] || "INVESTIGATOR",
    organizationId: user.organizationId || "org_nphl_lab",
    clearanceLevel: user.clearanceCode || "HIGHLY_RESTRICTED",
    permissions: user.permissions || [
      "intelligence:read",
      "intelligence:create",
      "intelligence:lead_manage",
      "intelligence:graph_traverse",
      "intelligence:case_link",
      "intelligence:export",
    ],
  };
}

// POST /api/intelligence/relationships - Create relationship
router.post("/api/intelligence/relationships", async (req: Request, res: Response): Promise<void> => {
  try {
    const userContext = getUserContextFromReq(req);
    const rel = await intelligenceService.createRelationship(req.body || {}, userContext);
    res.status(201).json({ success: true, data: rel });
  } catch (err: any) {
    if (err instanceof IntelligenceAuthorizationError) {
      res.status(403).json({ success: false, error: err.message });
      return;
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/intelligence/relationships - List relationships
router.get("/api/intelligence/relationships", async (req: Request, res: Response): Promise<void> => {
  try {
    const userContext = getUserContextFromReq(req);
    const filter = {
      entityType: req.query.entityType as string | undefined,
      entityId: req.query.entityId as string | undefined,
      relationshipClass: req.query.relationshipClass as string | undefined,
    };
    const rels = await intelligenceService.listRelationships(filter, userContext);
    res.status(200).json({ success: true, count: rels.length, data: rels });
  } catch (err: any) {
    if (err instanceof IntelligenceAuthorizationError) {
      res.status(403).json({ success: false, error: err.message });
      return;
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/intelligence/observations - Record observation
router.post("/api/intelligence/observations", async (req: Request, res: Response): Promise<void> => {
  try {
    const userContext = getUserContextFromReq(req);
    const obs = await intelligenceService.recordObservation(req.body || {}, userContext);
    res.status(201).json({ success: true, data: obs });
  } catch (err: any) {
    if (err instanceof IntelligenceAuthorizationError) {
      res.status(403).json({ success: false, error: err.message });
      return;
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/intelligence/observations - List observations
router.get("/api/intelligence/observations", async (req: Request, res: Response): Promise<void> => {
  try {
    const userContext = getUserContextFromReq(req);
    const obs = await intelligenceService.listObservations(userContext);
    res.status(200).json({ success: true, count: obs.length, data: obs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/intelligence/leads - Create lead
router.post("/api/intelligence/leads", async (req: Request, res: Response): Promise<void> => {
  try {
    const userContext = getUserContextFromReq(req);
    const lead = await intelligenceService.createLead(req.body || {}, userContext);
    res.status(201).json({ success: true, data: lead });
  } catch (err: any) {
    if (err instanceof IntelligenceAuthorizationError) {
      res.status(403).json({ success: false, error: err.message });
      return;
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/intelligence/leads - List leads
router.get("/api/intelligence/leads", async (req: Request, res: Response): Promise<void> => {
  try {
    const userContext = getUserContextFromReq(req);
    const filter = {
      assignedOrgId: req.query.assignedOrgId as string | undefined,
      status: req.query.status as string | undefined,
    };
    const leads = await intelligenceService.listLeads(filter, userContext);
    res.status(200).json({ success: true, count: leads.length, data: leads });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/intelligence/leads/:id/assign - Assign investigator
router.post("/api/intelligence/leads/:id/assign", async (req: Request, res: Response): Promise<void> => {
  try {
    const userContext = getUserContextFromReq(req);
    const id = req.params.id as string;
    const { investigatorId, assignedOrgId } = req.body || {};
    const updated = await intelligenceService.assignLead(id, investigatorId, assignedOrgId, userContext);
    res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/intelligence/leads/:id/review - Review lead
router.post("/api/intelligence/leads/:id/review", async (req: Request, res: Response): Promise<void> => {
  try {
    const userContext = getUserContextFromReq(req);
    const id = req.params.id as string;
    const { decision, reviewNotes } = req.body || {};
    const updated = await intelligenceService.reviewLead(id, decision, reviewNotes, userContext);
    res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    if (err instanceof IntelligenceSeparationOfDutiesError) {
      res.status(403).json({ success: false, error: err.message });
      return;
    }
    if (err instanceof IntelligenceInvalidStateTransitionError) {
      res.status(409).json({ success: false, error: err.message });
      return;
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/intelligence/graph/search - Graph search / link analysis
router.post("/api/intelligence/graph/search", async (req: Request, res: Response): Promise<void> => {
  try {
    const userContext = getUserContextFromReq(req);
    const result = await intelligenceService.executeLinkAnalysis(req.body || {}, userContext);
    res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    if (err instanceof IntelligenceAuthorizationError) {
      res.status(403).json({ success: false, error: err.message });
      return;
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/intelligence/case-links - Propose case link
router.post("/api/intelligence/case-links", async (req: Request, res: Response): Promise<void> => {
  try {
    const userContext = getUserContextFromReq(req);
    const caseLink = await intelligenceService.proposeCaseLink(req.body || {}, userContext);
    res.status(201).json({ success: true, data: caseLink });
  } catch (err: any) {
    if (err instanceof IntelligenceAuthorizationError) {
      res.status(403).json({ success: false, error: err.message });
      return;
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/intelligence/case-links/:id/review - Review case link
router.post("/api/intelligence/case-links/:id/review", async (req: Request, res: Response): Promise<void> => {
  try {
    const userContext = getUserContextFromReq(req);
    const id = req.params.id as string;
    const { decision, proposedById } = req.body || {};
    const updated = await intelligenceService.reviewCaseLink(id, decision, proposedById, userContext);
    res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    if (err instanceof IntelligenceSeparationOfDutiesError) {
      res.status(403).json({ success: false, error: err.message });
      return;
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/intelligence/case-links - List case links
router.get("/api/intelligence/case-links", async (req: Request, res: Response): Promise<void> => {
  try {
    const userContext = getUserContextFromReq(req);
    const caseId = req.query.caseId as string | undefined;
    const caseLinks = await intelligenceService.listCaseLinks(caseId, userContext);
    res.status(200).json({ success: true, count: caseLinks.length, data: caseLinks });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/intelligence/person-resolution - Evaluate candidate
router.post("/api/intelligence/person-resolution", async (req: Request, res: Response): Promise<void> => {
  try {
    const userContext = getUserContextFromReq(req);
    const candidate = await intelligenceService.evaluatePersonResolutionCandidate(req.body || {}, userContext);
    res.status(201).json({ success: true, data: candidate });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/intelligence/person-resolution/:id/resolve - Resolve candidate
router.post("/api/intelligence/person-resolution/:id/resolve", async (req: Request, res: Response): Promise<void> => {
  try {
    const userContext = getUserContextFromReq(req);
    const id = req.params.id as string;
    const { decision } = req.body || {};
    const updated = await intelligenceService.resolvePersonCandidate(id, decision, userContext);
    res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/intelligence/person-resolution - List candidates
router.get("/api/intelligence/person-resolution", async (req: Request, res: Response): Promise<void> => {
  try {
    const userContext = getUserContextFromReq(req);
    const status = req.query.status as string | undefined;
    const candidates = await intelligenceService.listPersonResolutionCandidates(status, userContext);
    res.status(200).json({ success: true, count: candidates.length, data: candidates });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
