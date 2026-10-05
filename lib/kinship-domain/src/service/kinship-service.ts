import {
  KinshipInvestigationData,
  RelationshipHypothesisData,
  PedigreeData,
  KinshipAnalysisData,
  KinshipResultData,
  FamilialSearchRequestData,
  CandidateRankingData,
  RelationshipType,
  KinshipStatus,
  KinshipLegalBasisMissingError,
  KinshipAuthorizationError,
  KinshipSeparationOfDutiesError,
  KinshipEliminationProtectionViolationError,
} from "../types";
import { KinshipInvestigationAggregate } from "../aggregate/kinship-investigation-aggregate";
import { PedigreeAggregate } from "../aggregate/pedigree-aggregate";
import {
  KinshipEngine,
  ProfileSTRPanelInput,
  DEFAULT_KENYA_POPULATION_DATASET,
} from "../aggregate/kinship-engine";
import { KinshipNumberGenerator } from "../aggregate/numbering";
import { IKinshipRepository } from "./kinship-repository";

export interface UserSecurityContext {
  userId: string;
  userRole: string;
  organizationId: string;
  clearanceLevel: string;
  permissions: string[];
}

export class KinshipService {
  constructor(private repo: IKinshipRepository) {}

  public async createInvestigation(
    params: {
      caseId: string;
      purpose: string;
      legalBasis: string;
      sensitivity?: string;
    },
    userContext: UserSecurityContext
  ): Promise<KinshipInvestigationData> {
    if (!userContext.permissions.includes("kinship:create")) {
      throw new KinshipAuthorizationError("User lacks required permission 'kinship:create'");
    }
    if (!params.legalBasis || params.legalBasis.trim() === "") {
      throw new KinshipLegalBasisMissingError("Kinship investigation requires an explicit legal basis.");
    }

    const investigation: KinshipInvestigationData = {
      id: `kin-inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      investigationNumber: KinshipNumberGenerator.generateInvestigationNumber("NPHL"),
      caseId: params.caseId,
      initiatingOrgId: userContext.organizationId,
      initiatingUserId: userContext.userId,
      purpose: params.purpose,
      legalBasis: params.legalBasis,
      status: "DRAFT",
      sensitivity: params.sensitivity || "HIGHLY_RESTRICTED",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return await this.repo.saveInvestigation(investigation);
  }

  public async transitionInvestigationStatus(
    investigationId: string,
    targetStatus: KinshipStatus,
    userContext: UserSecurityContext
  ): Promise<KinshipInvestigationData> {
    if (!userContext.permissions.includes("kinship:create") && !userContext.permissions.includes("kinship:review")) {
      throw new KinshipAuthorizationError("User lacks permission to transition kinship investigation status.");
    }

    const invData = await this.repo.findInvestigationById(investigationId);
    if (!invData) {
      throw new Error(`Kinship investigation ${investigationId} not found.`);
    }

    const hypotheses = await this.repo.listHypothesesByInvestigation(investigationId);
    const aggregate = new KinshipInvestigationAggregate(invData, hypotheses);
    aggregate.transitionState(targetStatus, userContext.userId);

    return await this.repo.saveInvestigation(aggregate.data);
  }

  public async addRelationshipHypothesis(
    params: {
      investigationId: string;
      profileAId: string;
      profileBId: string;
      relationshipType: RelationshipType;
      description?: string;
      approvedMethod?: string;
    },
    userContext: UserSecurityContext
  ): Promise<RelationshipHypothesisData> {
    if (!userContext.permissions.includes("kinship:create")) {
      throw new KinshipAuthorizationError("User lacks permission 'kinship:create'");
    }

    const inv = await this.repo.findInvestigationById(params.investigationId);
    if (!inv) {
      throw new Error(`Investigation ${params.investigationId} not found`);
    }

    const hypothesis: RelationshipHypothesisData = {
      id: `rel-hypo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      investigationId: params.investigationId,
      profileAId: params.profileAId,
      profileBId: params.profileBId,
      relationshipType: params.relationshipType,
      description: params.description,
      status: "PROPOSED",
      approvedMethod: params.approvedMethod || "STR-LIKELIHOOD-RATIO",
      createdAt: new Date(),
    };

    return await this.repo.saveHypothesis(hypothesis);
  }

  public async createPedigree(
    params: {
      investigationId: string;
      title: string;
    },
    userContext: UserSecurityContext
  ): Promise<PedigreeData> {
    if (!userContext.permissions.includes("kinship:create")) {
      throw new KinshipAuthorizationError("User lacks permission 'kinship:create'");
    }

    const pedigreeData: PedigreeData = {
      id: `ped-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      investigationId: params.investigationId,
      title: params.title,
      currentVersionNumber: 1,
      nodes: [],
      relationships: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const aggregate = new PedigreeAggregate(pedigreeData);
    await this.repo.savePedigreeVersion(aggregate.versionHistory[0]);
    return await this.repo.savePedigree(aggregate.data);
  }

  public async executeKinshipAnalysis(
    params: {
      investigationId: string;
      hypothesisId: string;
      profileAPanel: ProfileSTRPanelInput;
      profileBPanel: ProfileSTRPanelInput;
      isEliminationAudit?: boolean;
    },
    userContext: UserSecurityContext
  ): Promise<{ analysis: KinshipAnalysisData; result: KinshipResultData }> {
    if (!userContext.permissions.includes("kinship:analyze")) {
      throw new KinshipAuthorizationError("User lacks required clearance/permission 'kinship:analyze'");
    }

    // Protection check for Elimination Index profiles
    if (
      (params.profileAPanel.indexCode === "ELIMINATION" || params.profileBPanel.indexCode === "ELIMINATION") &&
      !params.isEliminationAudit
    ) {
      throw new KinshipEliminationProtectionViolationError(
        "Elimination Database Protection Triggered: Elimination profiles cannot be submitted for general kinship investigation without explicit contamination audit authorization."
      );
    }

    const hypothesis = await this.repo.findHypothesisById(params.hypothesisId);
    if (!hypothesis) {
      throw new Error(`Hypothesis ${params.hypothesisId} not found`);
    }

    const analysisId = `kana-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const analysisNumber = KinshipNumberGenerator.generateAnalysisNumber("NPHL");

    const analysis: KinshipAnalysisData = {
      id: analysisId,
      analysisNumber,
      investigationId: params.investigationId,
      hypothesisId: params.hypothesisId,
      inputProfileIds: [params.profileAPanel.profileId, params.profileBPanel.profileId],
      algorithmName: KinshipEngine.ALGORITHM_NAME,
      algorithmVersion: KinshipEngine.ALGORITHM_VERSION,
      configuration: {
        lociCountA: params.profileAPanel.loci.length,
        lociCountB: params.profileBPanel.loci.length,
        relationshipType: hypothesis.relationshipType,
      },
      populationDatasetCode: DEFAULT_KENYA_POPULATION_DATASET.datasetCode,
      populationDatasetVersion: DEFAULT_KENYA_POPULATION_DATASET.datasetVersion,
      analystId: userContext.userId,
      executionTimestamp: new Date(),
      status: "COMPLETED",
    };

    const result = KinshipEngine.calculateKinship(
      analysisId,
      params.hypothesisId,
      params.profileAPanel,
      params.profileBPanel,
      hypothesis.relationshipType,
      DEFAULT_KENYA_POPULATION_DATASET
    );

    const savedAnalysis = await this.repo.saveAnalysis(analysis);
    const savedResult = await this.repo.saveResult(result);

    return { analysis: savedAnalysis, result: savedResult };
  }

  public async reviewKinshipResult(
    resultId: string,
    decision: "ACCEPTED" | "REJECTED" | "INCONCLUSIVE",
    reviewNotes: string,
    userContext: UserSecurityContext
  ): Promise<KinshipResultData> {
    if (!userContext.permissions.includes("kinship:review")) {
      throw new KinshipAuthorizationError("User lacks required clearance/permission 'kinship:review'");
    }

    const result = await this.repo.findResultByAnalysisId(resultId) || await this.findResultByIdDirect(resultId);
    if (!result) {
      throw new Error(`Kinship result ${resultId} not found`);
    }

    const analysis = await this.repo.findAnalysisById(result.analysisId);
    if (analysis && analysis.analystId === userContext.userId) {
      throw new KinshipSeparationOfDutiesError(
        "Separation of Duties violation: The analyst who executed the kinship calculation cannot be the sole reviewer approving the forensic result."
      );
    }

    result.reviewStatus = decision;
    result.reviewNotes = reviewNotes;
    result.reviewerId = userContext.userId;
    result.reviewedAt = new Date();
    result.confirmedOutcome =
      decision === "ACCEPTED"
        ? `FORENSIC_LEAD_${result.interpretationCategory}`
        : `REVIEW_${decision}`;

    return await this.repo.saveResult(result);
  }

  private async findResultByIdDirect(resultId: string): Promise<KinshipResultData | null> {
    // Helper to find result by resultId if repo supports it
    return null;
  }

  // Familial Searching Workflow
  public async requestFamilialSearch(
    params: {
      caseId: string;
      targetProfileId: string;
      targetIndices: string[];
      searchPurpose: string;
      legalBasis: string;
    },
    userContext: UserSecurityContext
  ): Promise<FamilialSearchRequestData> {
    if (!userContext.permissions.includes("familial_search:request")) {
      throw new KinshipAuthorizationError("User lacks permission 'familial_search:request'");
    }
    if (!params.legalBasis || params.legalBasis.trim() === "") {
      throw new KinshipLegalBasisMissingError("Familial search request requires documented statutory legal basis.");
    }

    const req: FamilialSearchRequestData = {
      id: `fsr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      searchNumber: KinshipNumberGenerator.generateSearchNumber("NPHL"),
      caseId: params.caseId,
      targetProfileId: params.targetProfileId,
      targetIndices: params.targetIndices,
      searchPurpose: params.searchPurpose,
      legalBasis: params.legalBasis,
      requestingUserId: userContext.userId,
      status: "AUTHORIZATION_PENDING",
      createdAt: new Date(),
    };

    return await this.repo.saveFamilialSearchRequest(req);
  }

  public async authorizeFamilialSearch(
    requestId: string,
    userContext: UserSecurityContext
  ): Promise<FamilialSearchRequestData> {
    if (!userContext.permissions.includes("familial_search:authorize")) {
      throw new KinshipAuthorizationError("User lacks supervisor permission 'familial_search:authorize'");
    }

    const searchReq = await this.repo.findFamilialSearchById(requestId);
    if (!searchReq) {
      throw new Error(`Familial search request ${requestId} not found`);
    }

    if (searchReq.requestingUserId === userContext.userId) {
      throw new KinshipSeparationOfDutiesError(
        "Separation of Duties violation: Initiating user cannot self-authorize a familial search request."
      );
    }

    searchReq.authorizingUserId = userContext.userId;
    searchReq.authorizedAt = new Date();
    searchReq.status = "AUTHORIZED";

    return await this.repo.saveFamilialSearchRequest(searchReq);
  }

  public async executeFamilialSearch(
    requestId: string,
    targetProfilePanel: ProfileSTRPanelInput,
    candidateProfiles: ProfileSTRPanelInput[],
    userContext: UserSecurityContext
  ): Promise<CandidateRankingData[]> {
    const searchReq = await this.repo.findFamilialSearchById(requestId);
    if (!searchReq) {
      throw new Error(`Familial search request ${requestId} not found`);
    }
    if (searchReq.status !== "AUTHORIZED") {
      throw new KinshipAuthorizationError("Familial search request must be AUTHORIZED before execution.");
    }

    // Filter out elimination database profiles unless explicitly authorized for contamination review
    const sanitizedCandidates = candidateProfiles.filter(
      (c) => c.indexCode !== "ELIMINATION"
    );

    const rankings = KinshipEngine.rankFamilialCandidates(
      requestId,
      targetProfilePanel,
      sanitizedCandidates,
      "PARENT_CHILD"
    );

    searchReq.status = "COMPLETED";
    await this.repo.saveFamilialSearchRequest(searchReq);
    return await this.repo.saveCandidateRankings(requestId, rankings);
  }

  public async getKinshipProvenance(analysisId: string): Promise<Record<string, unknown>> {
    const analysis = await this.repo.findAnalysisById(analysisId);
    if (!analysis) {
      throw new Error(`Analysis ${analysisId} not found`);
    }
    const result = await this.repo.findResultByAnalysisId(analysisId);
    const inv = await this.repo.findInvestigationById(analysis.investigationId);

    return {
      analysisId: analysis.id,
      analysisNumber: analysis.analysisNumber,
      executionTimestamp: analysis.executionTimestamp,
      algorithm: `${analysis.algorithmName} ${analysis.algorithmVersion}`,
      populationDataset: `${analysis.populationDatasetCode} ${analysis.populationDatasetVersion}`,
      investigationNumber: inv?.investigationNumber,
      caseId: inv?.caseId,
      legalBasis: inv?.legalBasis,
      combinedLikelihoodRatio: result?.combinedLikelihoodRatio,
      interpretationCategory: result?.interpretationCategory,
      limitations: result?.limitations,
      reviewStatus: result?.reviewStatus,
      reviewerId: result?.reviewerId,
    };
  }
}
