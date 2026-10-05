import {
  KinshipInvestigationData,
  RelationshipHypothesisData,
  PedigreeData,
  PedigreeVersionSnapshot,
  KinshipAnalysisData,
  KinshipResultData,
  FamilialSearchRequestData,
  CandidateRankingData,
} from "../types";

export interface IKinshipRepository {
  // Kinship Investigations
  saveInvestigation(investigation: KinshipInvestigationData): Promise<KinshipInvestigationData>;
  findInvestigationById(id: string): Promise<KinshipInvestigationData | null>;
  findInvestigationByNumber(num: string): Promise<KinshipInvestigationData | null>;
  listInvestigations(caseId?: string): Promise<KinshipInvestigationData[]>;

  // Relationship Hypotheses
  saveHypothesis(hypothesis: RelationshipHypothesisData): Promise<RelationshipHypothesisData>;
  findHypothesisById(id: string): Promise<RelationshipHypothesisData | null>;
  listHypothesesByInvestigation(investigationId: string): Promise<RelationshipHypothesisData[]>;

  // Pedigrees
  savePedigree(pedigree: PedigreeData): Promise<PedigreeData>;
  findPedigreeById(id: string): Promise<PedigreeData | null>;
  findPedigreeByInvestigation(investigationId: string): Promise<PedigreeData | null>;
  savePedigreeVersion(version: PedigreeVersionSnapshot): Promise<PedigreeVersionSnapshot>;
  listPedigreeVersions(pedigreeId: string): Promise<PedigreeVersionSnapshot[]>;

  // Kinship Analyses & Results
  saveAnalysis(analysis: KinshipAnalysisData): Promise<KinshipAnalysisData>;
  findAnalysisById(id: string): Promise<KinshipAnalysisData | null>;
  saveResult(result: KinshipResultData): Promise<KinshipResultData>;
  findResultByAnalysisId(analysisId: string): Promise<KinshipResultData | null>;

  // Familial Searching
  saveFamilialSearchRequest(request: FamilialSearchRequestData): Promise<FamilialSearchRequestData>;
  findFamilialSearchById(id: string): Promise<FamilialSearchRequestData | null>;
  saveCandidateRankings(requestId: string, candidates: CandidateRankingData[]): Promise<CandidateRankingData[]>;
  listCandidateRankings(requestId: string): Promise<CandidateRankingData[]>;
}

export class InMemoryKinshipRepository implements IKinshipRepository {
  private investigations = new Map<string, KinshipInvestigationData>();
  private hypotheses = new Map<string, RelationshipHypothesisData>();
  private pedigrees = new Map<string, PedigreeData>();
  private pedigreeVersions: PedigreeVersionSnapshot[] = [];
  private analyses = new Map<string, KinshipAnalysisData>();
  private results = new Map<string, KinshipResultData>();
  private familialSearches = new Map<string, FamilialSearchRequestData>();
  private candidateRankings: CandidateRankingData[] = [];

  // Investigations
  public async saveInvestigation(investigation: KinshipInvestigationData): Promise<KinshipInvestigationData> {
    this.investigations.set(investigation.id, { ...investigation });
    return { ...investigation };
  }

  public async findInvestigationById(id: string): Promise<KinshipInvestigationData | null> {
    const item = this.investigations.get(id);
    return item ? { ...item } : null;
  }

  public async findInvestigationByNumber(num: string): Promise<KinshipInvestigationData | null> {
    for (const inv of this.investigations.values()) {
      if (inv.investigationNumber === num) return { ...inv };
    }
    return null;
  }

  public async listInvestigations(caseId?: string): Promise<KinshipInvestigationData[]> {
    const list = Array.from(this.investigations.values());
    if (caseId) {
      return list.filter((i) => i.caseId === caseId);
    }
    return list;
  }

  // Hypotheses
  public async saveHypothesis(hypothesis: RelationshipHypothesisData): Promise<RelationshipHypothesisData> {
    this.hypotheses.set(hypothesis.id, { ...hypothesis });
    return { ...hypothesis };
  }

  public async findHypothesisById(id: string): Promise<RelationshipHypothesisData | null> {
    const item = this.hypotheses.get(id);
    return item ? { ...item } : null;
  }

  public async listHypothesesByInvestigation(investigationId: string): Promise<RelationshipHypothesisData[]> {
    return Array.from(this.hypotheses.values()).filter((h) => h.investigationId === investigationId);
  }

  // Pedigrees
  public async savePedigree(pedigree: PedigreeData): Promise<PedigreeData> {
    this.pedigrees.set(pedigree.id, JSON.parse(JSON.stringify(pedigree)));
    return JSON.parse(JSON.stringify(pedigree));
  }

  public async findPedigreeById(id: string): Promise<PedigreeData | null> {
    const item = this.pedigrees.get(id);
    return item ? JSON.parse(JSON.stringify(item)) : null;
  }

  public async findPedigreeByInvestigation(investigationId: string): Promise<PedigreeData | null> {
    for (const p of this.pedigrees.values()) {
      if (p.investigationId === investigationId) return JSON.parse(JSON.stringify(p));
    }
    return null;
  }

  public async savePedigreeVersion(version: PedigreeVersionSnapshot): Promise<PedigreeVersionSnapshot> {
    this.pedigreeVersions.push(JSON.parse(JSON.stringify(version)));
    return JSON.parse(JSON.stringify(version));
  }

  public async listPedigreeVersions(pedigreeId: string): Promise<PedigreeVersionSnapshot[]> {
    return this.pedigreeVersions
      .filter((v) => v.pedigreeId === pedigreeId)
      .map((v) => JSON.parse(JSON.stringify(v)));
  }

  // Analyses & Results
  public async saveAnalysis(analysis: KinshipAnalysisData): Promise<KinshipAnalysisData> {
    this.analyses.set(analysis.id, { ...analysis });
    return { ...analysis };
  }

  public async findAnalysisById(id: string): Promise<KinshipAnalysisData | null> {
    const item = this.analyses.get(id);
    return item ? { ...item } : null;
  }

  public async saveResult(result: KinshipResultData): Promise<KinshipResultData> {
    this.results.set(result.id, JSON.parse(JSON.stringify(result)));
    return JSON.parse(JSON.stringify(result));
  }

  public async findResultByAnalysisId(analysisId: string): Promise<KinshipResultData | null> {
    for (const r of this.results.values()) {
      if (r.analysisId === analysisId) return JSON.parse(JSON.stringify(r));
    }
    return null;
  }

  // Familial Searching
  public async saveFamilialSearchRequest(request: FamilialSearchRequestData): Promise<FamilialSearchRequestData> {
    this.familialSearches.set(request.id, { ...request });
    return { ...request };
  }

  public async findFamilialSearchById(id: string): Promise<FamilialSearchRequestData | null> {
    const item = this.familialSearches.get(id);
    return item ? { ...item } : null;
  }

  public async saveCandidateRankings(
    requestId: string,
    candidates: CandidateRankingData[]
  ): Promise<CandidateRankingData[]> {
    this.candidateRankings = this.candidateRankings.filter((c) => c.requestId !== requestId);
    const saved = candidates.map((c) => ({ ...c }));
    this.candidateRankings.push(...saved);
    return saved;
  }

  public async listCandidateRankings(requestId: string): Promise<CandidateRankingData[]> {
    return this.candidateRankings.filter((c) => c.requestId === requestId);
  }
}
