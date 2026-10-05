import crypto from "node:crypto";
import { IIntelligenceRepository } from "./intelligence-repository.js";
import {
  ForensicRelationshipData,
  IntelligenceObservationData,
  IntelligenceLeadData,
  LinkAnalysisData,
  CaseLinkData,
  PersonResolutionCandidateData,
  IntelligenceUserContext,
  RelationshipClass,
  IntelligenceAuthorizationError,
} from "../types.js";
import { IntelligenceNumberGenerator } from "../aggregate/numbering.js";
import {
  IntelligenceLeadAggregate,
  CaseLinkAggregate,
} from "../aggregate/intelligence-lead-aggregate.js";
import {
  IntelligenceGraphEngine,
  GraphTraversalOptions,
  GraphTraversalResult,
} from "../aggregate/graph-engine.js";

export class IntelligenceService {
  constructor(private repository: IIntelligenceRepository) {}

  private checkPermission(userContext: IntelligenceUserContext, requiredPermission: string) {
    if (
      !userContext.permissions.includes(requiredPermission) &&
      userContext.userRole !== "SYSTEM_ADMINISTRATOR" &&
      userContext.userRole !== "SECURITY_ADMINISTRATOR"
    ) {
      throw new IntelligenceAuthorizationError(
        `User ${userContext.userId} lacks required permission: ${requiredPermission}`
      );
    }
  }

  // 1. Forensic Relationships
  public async createRelationship(
    params: {
      sourceEntityType: string;
      sourceEntityId: string;
      targetEntityType: string;
      targetEntityId: string;
      relationshipType: string;
      relationshipClass: RelationshipClass;
      provenanceSource: string;
      confidenceScore?: string;
      organizationId?: string;
    },
    userContext: IntelligenceUserContext
  ): Promise<ForensicRelationshipData> {
    this.checkPermission(userContext, "intelligence:create");

    const relationshipNumber = IntelligenceNumberGenerator.generateRelationshipNumber({
      organizationPrefix: params.organizationId || userContext.organizationId,
    });

    const data: ForensicRelationshipData = {
      id: crypto.randomUUID(),
      relationshipNumber,
      sourceEntityType: params.sourceEntityType.toUpperCase(),
      sourceEntityId: params.sourceEntityId,
      targetEntityType: params.targetEntityType.toUpperCase(),
      targetEntityId: params.targetEntityId,
      relationshipType: params.relationshipType,
      relationshipClass: params.relationshipClass,
      confidenceScore: params.confidenceScore || null,
      provenanceSource: params.provenanceSource,
      organizationId: params.organizationId || userContext.organizationId,
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return await this.repository.saveRelationship(data);
  }

  public async getRelationship(
    id: string,
    userContext: IntelligenceUserContext
  ): Promise<ForensicRelationshipData | null> {
    this.checkPermission(userContext, "intelligence:read");
    return await this.repository.findRelationshipById(id);
  }

  public async listRelationships(
    filter: { entityType?: string; entityId?: string; relationshipClass?: string },
    userContext: IntelligenceUserContext
  ): Promise<ForensicRelationshipData[]> {
    this.checkPermission(userContext, "intelligence:read");
    return await this.repository.listRelationships(filter);
  }

  // 2. Intelligence Observations
  public async recordObservation(
    params: {
      title: string;
      description: string;
      rationale: string;
      originatingAnalysisId?: string;
      relatedEntities: { entityType: string; entityId: string; label?: string }[];
      sensitivityLevel?: string;
    },
    userContext: IntelligenceUserContext
  ): Promise<IntelligenceObservationData> {
    this.checkPermission(userContext, "intelligence:create");

    const observationNumber = IntelligenceNumberGenerator.generateObservationNumber({
      organizationPrefix: userContext.organizationId,
    });

    const data: IntelligenceObservationData = {
      id: crypto.randomUUID(),
      observationNumber,
      title: params.title,
      description: params.description,
      rationale: params.rationale,
      originatingAnalysisId: params.originatingAnalysisId || null,
      relatedEntities: params.relatedEntities,
      sensitivityLevel: params.sensitivityLevel || "CONFIDENTIAL",
      createdAt: new Date(),
    };

    return await this.repository.saveObservation(data);
  }

  public async listObservations(
    userContext: IntelligenceUserContext
  ): Promise<IntelligenceObservationData[]> {
    this.checkPermission(userContext, "intelligence:read");
    return await this.repository.listObservations();
  }

  // 3. Intelligence Leads
  public async createLead(
    params: {
      observationId?: string;
      title: string;
      rationale: string;
      priority: "ROUTINE" | "PRIORITY" | "EXPEDITED" | "CRITICAL";
      assignedOrgId?: string;
    },
    userContext: IntelligenceUserContext
  ): Promise<IntelligenceLeadData> {
    this.checkPermission(userContext, "intelligence:lead_manage");

    const leadNumber = IntelligenceNumberGenerator.generateLeadNumber({
      organizationPrefix: params.assignedOrgId || userContext.organizationId,
    });

    const data: IntelligenceLeadData = {
      id: crypto.randomUUID(),
      leadNumber,
      observationId: params.observationId || null,
      title: params.title,
      rationale: params.rationale,
      priority: params.priority,
      status: "NEW",
      assignedOrgId: params.assignedOrgId || userContext.organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return await this.repository.saveLead(data);
  }

  public async assignLead(
    leadId: string,
    investigatorId: string,
    assignedOrgId: string,
    userContext: IntelligenceUserContext
  ): Promise<IntelligenceLeadData> {
    this.checkPermission(userContext, "intelligence:lead_manage");

    const existing = await this.repository.findLeadById(leadId);
    if (!existing) {
      throw new Error(`Intelligence lead ${leadId} not found`);
    }

    const aggregate = new IntelligenceLeadAggregate(existing);
    const updated = aggregate.assignInvestigator(investigatorId, assignedOrgId, userContext);
    return await this.repository.saveLead(updated);
  }

  public async reviewLead(
    leadId: string,
    decision: "CONFIRMED" | "REJECTED" | "INCONCLUSIVE",
    reviewNotes: string,
    userContext: IntelligenceUserContext
  ): Promise<IntelligenceLeadData> {
    this.checkPermission(userContext, "intelligence:lead_manage");

    const existing = await this.repository.findLeadById(leadId);
    if (!existing) {
      throw new Error(`Intelligence lead ${leadId} not found`);
    }

    const aggregate = new IntelligenceLeadAggregate(existing);
    const updated = aggregate.resolveReview(decision, reviewNotes, userContext);
    return await this.repository.saveLead(updated);
  }

  public async listLeads(
    filter: { assignedOrgId?: string; status?: string },
    userContext: IntelligenceUserContext
  ): Promise<IntelligenceLeadData[]> {
    this.checkPermission(userContext, "intelligence:read");
    return await this.repository.listLeads(filter);
  }

  // 4. Link Analysis Graph Execution
  public async executeLinkAnalysis(
    params: {
      rootEntityType: string;
      rootEntityId: string;
      maxDepth?: number;
      allowedClasses?: RelationshipClass[];
      allowedTypes?: string[];
    },
    userContext: IntelligenceUserContext
  ): Promise<LinkAnalysisData> {
    this.checkPermission(userContext, "intelligence:graph_traverse");

    const allRelationships = await this.repository.listRelationships({});

    const traversalResult: GraphTraversalResult = IntelligenceGraphEngine.traverse(
      {
        rootEntityType: params.rootEntityType,
        rootEntityId: params.rootEntityId,
        maxDepth: params.maxDepth || 2,
        allowedClasses: params.allowedClasses,
        allowedTypes: params.allowedTypes,
      },
      userContext,
      allRelationships
    );

    const analysisNumber = IntelligenceNumberGenerator.generateAnalysisNumber({
      organizationPrefix: userContext.organizationId,
    });

    const analysisData: LinkAnalysisData = {
      id: crypto.randomUUID(),
      analysisNumber,
      requestedById: userContext.userId,
      scope: {
        rootEntityType: params.rootEntityType,
        rootEntityId: params.rootEntityId,
      },
      maxDepth: params.maxDepth || 2,
      filters: {
        allowedClasses: params.allowedClasses,
        allowedTypes: params.allowedTypes,
      },
      resultSummary: {
        nodes: traversalResult.nodes,
        edges: traversalResult.edges,
        totalNodes: traversalResult.totalNodes,
        totalEdges: traversalResult.totalEdges,
      },
      executedAt: new Date(),
    };

    return await this.repository.saveLinkAnalysis(analysisData);
  }

  // 5. Case Link Operations
  public async proposeCaseLink(
    params: {
      sourceCaseId: string;
      targetCaseId: string;
      linkType: string;
      rationale: string;
    },
    userContext: IntelligenceUserContext
  ): Promise<CaseLinkData> {
    this.checkPermission(userContext, "intelligence:case_link");

    const data: CaseLinkData = {
      id: crypto.randomUUID(),
      sourceCaseId: params.sourceCaseId,
      targetCaseId: params.targetCaseId,
      linkType: params.linkType,
      rationale: params.rationale,
      status: "PROPOSED",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Also register a ForensicRelationship for the link
    await this.createRelationship(
      {
        sourceEntityType: "CASE",
        sourceEntityId: params.sourceCaseId,
        targetEntityType: "CASE",
        targetEntityId: params.targetCaseId,
        relationshipType: params.linkType,
        relationshipClass: "HYPOTHESIS",
        provenanceSource: "CASE_LINK_PROPOSAL",
      },
      userContext
    );

    return await this.repository.saveCaseLink(data);
  }

  public async reviewCaseLink(
    caseLinkId: string,
    decision: "CONFIRMED" | "REJECTED",
    proposedById: string,
    userContext: IntelligenceUserContext
  ): Promise<CaseLinkData> {
    this.checkPermission(userContext, "intelligence:case_link");

    const existing = await this.repository.findCaseLinkById(caseLinkId);
    if (!existing) {
      throw new Error(`Case link ${caseLinkId} not found`);
    }

    const aggregate = new CaseLinkAggregate(existing);
    const updated = aggregate.reviewCaseLink(decision, proposedById, userContext);

    // If confirmed, update the forensic relationship to CONFIRMED_FORENSIC_RELATIONSHIP
    if (decision === "CONFIRMED") {
      const rels = await this.repository.listRelationships({
        entityType: "CASE",
        entityId: updated.sourceCaseId,
      });
      const match = rels.find(
        (r) =>
          (r.sourceEntityId === updated.sourceCaseId && r.targetEntityId === updated.targetCaseId) ||
          (r.sourceEntityId === updated.targetCaseId && r.targetEntityId === updated.sourceCaseId)
      );
      if (match) {
        match.relationshipClass = "CONFIRMED_FORENSIC_RELATIONSHIP";
        match.reviewedById = userContext.userId;
        match.reviewedAt = new Date();
        match.updatedAt = new Date();
        await this.repository.saveRelationship(match);
      }
    }

    return await this.repository.saveCaseLink(updated);
  }

  public async listCaseLinks(
    caseId?: string,
    userContext?: IntelligenceUserContext
  ): Promise<CaseLinkData[]> {
    if (userContext) {
      this.checkPermission(userContext, "intelligence:read");
    }
    return await this.repository.listCaseLinks(caseId);
  }

  // 6. Person Resolution Candidates
  public async evaluatePersonResolutionCandidate(
    params: {
      personAId: string;
      personBId: string;
      similarityScore: string;
      matchingFactors: { factorName: string; matchDetail: string }[];
    },
    userContext: IntelligenceUserContext
  ): Promise<PersonResolutionCandidateData> {
    this.checkPermission(userContext, "intelligence:create");

    const data: PersonResolutionCandidateData = {
      id: crypto.randomUUID(),
      personAId: params.personAId,
      personBId: params.personBId,
      similarityScore: params.similarityScore,
      matchingFactors: params.matchingFactors,
      status: "CANDIDATE",
      createdAt: new Date(),
    };

    return await this.repository.savePersonResolutionCandidate(data);
  }

  public async resolvePersonCandidate(
    candidateId: string,
    decision: "MERGED" | "SEPARATE",
    userContext: IntelligenceUserContext
  ): Promise<PersonResolutionCandidateData> {
    this.checkPermission(userContext, "intelligence:create");

    const existing = await this.repository.findPersonResolutionCandidateById(candidateId);
    if (!existing) {
      throw new Error(`Person resolution candidate ${candidateId} not found`);
    }

    existing.status = decision;
    existing.reviewedById = userContext.userId;
    existing.reviewedAt = new Date();

    return await this.repository.savePersonResolutionCandidate(existing);
  }

  public async listPersonResolutionCandidates(
    status?: string,
    userContext?: IntelligenceUserContext
  ): Promise<PersonResolutionCandidateData[]> {
    if (userContext) {
      this.checkPermission(userContext, "intelligence:read");
    }
    return await this.repository.listPersonResolutionCandidates(status);
  }
}
