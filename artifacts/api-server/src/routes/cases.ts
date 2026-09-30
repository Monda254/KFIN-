import { Router, type IRouter, type Request, type Response } from "express";
import crypto from "node:crypto";
import { pool } from "@workspace/db";
import { authenticate, type Subject } from "@workspace/security";
import {
  CaseService,
  CaseRepository,
  CaseNotFoundError,
  InvalidStateTransitionError,
  PreconditionFailedError,
  ConcurrencyConflictError,
  UnauthorizedCaseActionError,
} from "@workspace/case-domain";

const router: IRouter = Router();
const SIGNING_SECRET =
  process.env.JWT_SIGNING_SECRET ||
  "kfin_canonical_jwt_secret_development_minimum_32_chars!";

const caseRepo = new CaseRepository();
const caseService = new CaseService(caseRepo);

// Apply authenticate middleware to all /cases routes
router.use("/cases", authenticate(SIGNING_SECRET, pool) as any);

interface AuthRequest extends Request {
  user?: Subject;
  correlationId?: string;
}

function getAuthSubject(req: AuthRequest): Subject {
  if (!req.user) {
    throw new UnauthorizedCaseActionError("AUTH", "Authentication required");
  }
  return req.user;
}

function getContext(req: AuthRequest) {
  return {
    ipAddress: req.ip || req.socket.remoteAddress || "127.0.0.1",
    correlationId: req.correlationId || crypto.randomUUID(),
  };
}

function getParam(param: unknown): string {
  if (Array.isArray(param)) return String(param[0]);
  return String(param ?? "");
}

function handleDomainError(res: Response, err: any): void {
  if (err instanceof CaseNotFoundError) {
    res.status(404).json({ error: "CASE_NOT_FOUND", message: err.message });
    return;
  }
  if (err instanceof UnauthorizedCaseActionError) {
    res.status(403).json({ error: "FORBIDDEN", message: err.message });
    return;
  }
  if (err instanceof InvalidStateTransitionError) {
    res.status(400).json({ error: "INVALID_STATE_TRANSITION", message: err.message });
    return;
  }
  if (err instanceof PreconditionFailedError) {
    res.status(412).json({ error: "PRECONDITION_FAILED", message: err.message });
    return;
  }
  if (err instanceof ConcurrencyConflictError) {
    res.status(409).json({ error: "CONCURRENCY_CONFLICT", message: err.message });
    return;
  }

  console.error("Unhandled Case Error:", err);
  res.status(500).json({
    error: "INTERNAL_ERROR",
    message: err.message || "An unexpected error occurred processing case operation",
  });
}

// -----------------------------------------------------------------------------
// 1. POST /api/cases — Create Case
// -----------------------------------------------------------------------------
router.post("/cases", async (req: AuthRequest, res: Response) => {
  try {
    const subject = getAuthSubject(req);
    const context = getContext(req);
    const {
      title,
      description,
      originatingOrgId,
      leadInvestigatorId,
      caseType,
      priority,
      incidentDate,
      incidentCounty,
      incidentLocationCoords,
      dataClassification,
    } = req.body ?? {};

    if (!title || !description || !originatingOrgId || !leadInvestigatorId || !incidentDate || !incidentCounty) {
      res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "Missing required fields: title, description, originatingOrgId, leadInvestigatorId, incidentDate, incidentCounty",
      });
      return;
    }

    const created = await caseService.createCase(
      subject,
      {
        title,
        description,
        originatingOrgId,
        leadInvestigatorId,
        caseType,
        priority,
        incidentDate,
        incidentCounty,
        incidentLocationCoords,
        dataClassification,
      },
      context
    );

    res.status(201).json(created);
  } catch (err: any) {
    handleDomainError(res, err);
  }
});

// -----------------------------------------------------------------------------
// 2. GET /api/cases — Search / List Cases
// -----------------------------------------------------------------------------
router.get("/cases", async (req: AuthRequest, res: Response) => {
  try {
    const subject = getAuthSubject(req);
    const context = getContext(req);
    const {
      query,
      status,
      caseType,
      priority,
      organizationId,
      county,
      limit,
      offset,
    } = req.query;

    const result = await caseService.searchCases(
      subject,
      {
        query: query ? String(query) : undefined,
        status: status ? (String(status) as any) : undefined,
        caseType: caseType ? (String(caseType) as any) : undefined,
        priority: priority ? (String(priority) as any) : undefined,
        organizationId: organizationId ? String(organizationId) : undefined,
        county: county ? String(county) : undefined,
        limit: limit ? parseInt(String(limit), 10) : undefined,
        offset: offset ? parseInt(String(offset), 10) : undefined,
      },
      context
    );

    res.json(result);
  } catch (err: any) {
    handleDomainError(res, err);
  }
});

// -----------------------------------------------------------------------------
// 3. GET /api/cases/:id — Get Case Details
// -----------------------------------------------------------------------------
router.get("/cases/:id", async (req: AuthRequest, res: Response) => {
  try {
    const subject = getAuthSubject(req);
    const context = getContext(req);
    const caseId = getParam(req.params.id);
    const caseRecord = await caseService.getCaseById(subject, caseId, context);
    res.json(caseRecord);
  } catch (err: any) {
    handleDomainError(res, err);
  }
});

// -----------------------------------------------------------------------------
// 4. PATCH /api/cases/:id — Update Case Details
// -----------------------------------------------------------------------------
router.patch("/cases/:id", async (req: AuthRequest, res: Response) => {
  try {
    const subject = getAuthSubject(req);
    const context = getContext(req);
    const caseId = getParam(req.params.id);
    const {
      title,
      description,
      priority,
      incidentCounty,
      incidentLocationCoords,
      dataClassification,
      expectedVersion,
    } = req.body ?? {};

    if (expectedVersion === undefined) {
      res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "expectedVersion is required for optimistic concurrency check",
      });
      return;
    }

    const updated = await caseService.updateCase(
      subject,
      caseId,
      {
        title,
        description,
        priority,
        incidentCounty,
        incidentLocationCoords,
        dataClassification,
        expectedVersion: parseInt(expectedVersion, 10),
      },
      context
    );

    res.json(updated);
  } catch (err: any) {
    handleDomainError(res, err);
  }
});

// -----------------------------------------------------------------------------
// 5. POST /api/cases/:id/status — Transition Case Status
// -----------------------------------------------------------------------------
router.post("/cases/:id/status", async (req: AuthRequest, res: Response) => {
  try {
    const subject = getAuthSubject(req);
    const context = getContext(req);
    const caseId = getParam(req.params.id);
    const { newStatus, reason, expectedVersion } = req.body ?? {};

    if (!newStatus || !reason || expectedVersion === undefined) {
      res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "newStatus, reason, and expectedVersion are required",
      });
      return;
    }

    const transitioned = await caseService.transitionCaseStatus(
      subject,
      caseId,
      {
        newStatus,
        reason,
        expectedVersion: parseInt(expectedVersion, 10),
      },
      context
    );

    res.json(transitioned);
  } catch (err: any) {
    handleDomainError(res, err);
  }
});

// -----------------------------------------------------------------------------
// 6. POST /api/cases/:id/assignments — Assign Personnel
// -----------------------------------------------------------------------------
router.post("/cases/:id/assignments", async (req: AuthRequest, res: Response) => {
  try {
    const subject = getAuthSubject(req);
    const context = getContext(req);
    const caseId = getParam(req.params.id);
    const { userId, organizationId, caseRole, accessScope } = req.body ?? {};

    if (!userId || !organizationId || !caseRole) {
      res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "userId, organizationId, and caseRole are required",
      });
      return;
    }

    const assignment = await caseService.assignPersonnel(
      subject,
      caseId,
      {
        userId,
        organizationId,
        caseRole,
        accessScope,
      },
      context
    );

    res.status(201).json(assignment);
  } catch (err: any) {
    handleDomainError(res, err);
  }
});

// -----------------------------------------------------------------------------
// 7. DELETE /api/cases/:id/assignments/:assignmentId — Revoke Assignment
// -----------------------------------------------------------------------------
router.delete("/cases/:id/assignments/:assignmentId", async (req: AuthRequest, res: Response) => {
  try {
    const subject = getAuthSubject(req);
    const context = getContext(req);
    const caseId = getParam(req.params.id);
    const assignmentId = getParam(req.params.assignmentId);
    const { reason } = req.body ?? {};

    if (!reason) {
      res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "Revocation reason is required to preserve audit history",
      });
      return;
    }

    await caseService.revokeAssignment(
      subject,
      caseId,
      assignmentId,
      reason,
      context
    );

    res.json({ success: true, message: "Case assignment revoked and archived" });
  } catch (err: any) {
    handleDomainError(res, err);
  }
});

// -----------------------------------------------------------------------------
// 8. GET /api/cases/:id/assignments — Get Assignments
// -----------------------------------------------------------------------------
router.get("/cases/:id/assignments", async (req: AuthRequest, res: Response) => {
  try {
    const subject = getAuthSubject(req);
    const context = getContext(req);
    const caseId = getParam(req.params.id);
    await caseService.getCaseById(subject, caseId, context);
    const assignments = await caseRepo.getAssignments(caseId);
    res.json(assignments);
  } catch (err: any) {
    handleDomainError(res, err);
  }
});

// -----------------------------------------------------------------------------
// 9. POST /api/cases/:id/transfers — Transfer Case
// -----------------------------------------------------------------------------
router.post("/cases/:id/transfers", async (req: AuthRequest, res: Response) => {
  try {
    const subject = getAuthSubject(req);
    const context = getContext(req);
    const caseId = getParam(req.params.id);
    const { toOrgId, toInvestigatorId, transferReason, authorizationReference, notes, expectedVersion } = req.body ?? {};

    if (!toOrgId || !toInvestigatorId || !transferReason || expectedVersion === undefined) {
      res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "toOrgId, toInvestigatorId, transferReason, and expectedVersion are required",
      });
      return;
    }

    const transfer = await caseService.transferCase(
      subject,
      caseId,
      {
        toOrgId,
        toInvestigatorId,
        transferReason,
        authorizationReference,
        notes,
        expectedVersion: parseInt(expectedVersion, 10),
      },
      context
    );

    res.status(201).json(transfer);
  } catch (err: any) {
    handleDomainError(res, err);
  }
});

// -----------------------------------------------------------------------------
// 10. GET /api/cases/:id/transfers — Get Transfers
// -----------------------------------------------------------------------------
router.get("/cases/:id/transfers", async (req: AuthRequest, res: Response) => {
  try {
    const subject = getAuthSubject(req);
    const context = getContext(req);
    const caseId = getParam(req.params.id);
    await caseService.getCaseById(subject, caseId, context);
    const transfers = await caseRepo.getTransfers(caseId);
    res.json(transfers);
  } catch (err: any) {
    handleDomainError(res, err);
  }
});

// -----------------------------------------------------------------------------
// 11. GET /api/cases/:id/timeline — Chronological Case Timeline
// -----------------------------------------------------------------------------
router.get("/cases/:id/timeline", async (req: AuthRequest, res: Response) => {
  try {
    const subject = getAuthSubject(req);
    const context = getContext(req);
    const caseId = getParam(req.params.id);
    const timeline = await caseService.getTimeline(subject, caseId, context);
    res.json(timeline);
  } catch (err: any) {
    handleDomainError(res, err);
  }
});

// -----------------------------------------------------------------------------
// 12. GET /api/cases/:id/history — Case Status History
// -----------------------------------------------------------------------------
router.get("/cases/:id/history", async (req: AuthRequest, res: Response) => {
  try {
    const subject = getAuthSubject(req);
    const context = getContext(req);
    const caseId = getParam(req.params.id);
    await caseService.getCaseById(subject, caseId, context);
    const history = await caseRepo.getStatusHistory(caseId);
    res.json(history);
  } catch (err: any) {
    handleDomainError(res, err);
  }
});

// -----------------------------------------------------------------------------
// 13. POST /api/cases/:id/participants — Add Participant
// -----------------------------------------------------------------------------
router.post("/cases/:id/participants", async (req: AuthRequest, res: Response) => {
  try {
    const subject = getAuthSubject(req);
    const context = getContext(req);
    const caseId = getParam(req.params.id);
    const { participantType, pseudonym, idDocumentType, idDocumentNumber, demographics, notes, dataClassification } = req.body ?? {};

    if (!participantType) {
      res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "participantType is required",
      });
      return;
    }

    const participant = await caseService.addParticipant(
      subject,
      caseId,
      {
        participantType,
        pseudonym,
        idDocumentType,
        idDocumentNumber,
        demographics,
        notes,
        dataClassification,
      },
      context
    );

    res.status(201).json(participant);
  } catch (err: any) {
    handleDomainError(res, err);
  }
});

// -----------------------------------------------------------------------------
// 14. DELETE /api/cases/:id/participants/:participantId — Remove Participant
// -----------------------------------------------------------------------------
router.delete("/cases/:id/participants/:participantId", async (req: AuthRequest, res: Response) => {
  try {
    const subject = getAuthSubject(req);
    const context = getContext(req);
    const caseId = getParam(req.params.id);
    const participantId = getParam(req.params.participantId);
    const { reason } = req.body ?? {};

    await caseService.removeParticipant(
      subject,
      caseId,
      participantId,
      reason || "Participant removed from case roster",
      context
    );

    res.json({ success: true, message: "Case participant removed" });
  } catch (err: any) {
    handleDomainError(res, err);
  }
});

// -----------------------------------------------------------------------------
// 15. GET /api/cases/:id/participants — Get Participants
// -----------------------------------------------------------------------------
router.get("/cases/:id/participants", async (req: AuthRequest, res: Response) => {
  try {
    const subject = getAuthSubject(req);
    const context = getContext(req);
    const caseId = getParam(req.params.id);
    await caseService.getCaseById(subject, caseId, context);
    const participants = await caseRepo.getParticipants(caseId);
    res.json(participants);
  } catch (err: any) {
    handleDomainError(res, err);
  }
});

// -----------------------------------------------------------------------------
// 16. POST /api/cases/:id/notes — Add Note
// -----------------------------------------------------------------------------
router.post("/cases/:id/notes", async (req: AuthRequest, res: Response) => {
  try {
    const subject = getAuthSubject(req);
    const context = getContext(req);
    const caseId = getParam(req.params.id);
    const { noteText, isConfidential } = req.body ?? {};

    if (!noteText || noteText.trim().length === 0) {
      res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "noteText must not be empty",
      });
      return;
    }

    const note = await caseService.addNote(
      subject,
      caseId,
      {
        noteText,
        isConfidential: Boolean(isConfidential),
      },
      context
    );

    res.status(201).json(note);
  } catch (err: any) {
    handleDomainError(res, err);
  }
});

// -----------------------------------------------------------------------------
// 17. GET /api/cases/:id/notes — Get Notes
// -----------------------------------------------------------------------------
router.get("/cases/:id/notes", async (req: AuthRequest, res: Response) => {
  try {
    const subject = getAuthSubject(req);
    const context = getContext(req);
    const caseId = getParam(req.params.id);
    const notes = await caseService.getNotes(subject, caseId, context);
    res.json(notes);
  } catch (err: any) {
    handleDomainError(res, err);
  }
});

// -----------------------------------------------------------------------------
// 18. POST /api/cases/:id/links — Link Cases
// -----------------------------------------------------------------------------
router.post("/cases/:id/links", async (req: AuthRequest, res: Response) => {
  try {
    const subject = getAuthSubject(req);
    const context = getContext(req);
    const caseId = getParam(req.params.id);
    const { targetCaseId, linkType, notes } = req.body ?? {};

    if (!targetCaseId || !linkType) {
      res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "targetCaseId and linkType are required",
      });
      return;
    }

    const link = await caseService.linkCases(
      subject,
      caseId,
      {
        targetCaseId: String(targetCaseId),
        linkType,
        notes,
      },
      context
    );

    res.status(201).json(link);
  } catch (err: any) {
    handleDomainError(res, err);
  }
});

// -----------------------------------------------------------------------------
// 19. GET /api/cases/:id/links — Get Links
// -----------------------------------------------------------------------------
router.get("/cases/:id/links", async (req: AuthRequest, res: Response) => {
  try {
    const subject = getAuthSubject(req);
    const context = getContext(req);
    const caseId = getParam(req.params.id);
    await caseService.getCaseById(subject, caseId, context);
    const links = await caseRepo.getLinks(caseId);
    res.json(links);
  } catch (err: any) {
    handleDomainError(res, err);
  }
});

export default router;
