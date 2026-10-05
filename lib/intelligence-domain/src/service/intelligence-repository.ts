import {
  ForensicRelationshipData,
  IntelligenceObservationData,
  IntelligenceLeadData,
  LinkAnalysisData,
  CaseLinkData,
  PersonResolutionCandidateData,
} from "../types.js";

export interface IIntelligenceRepository {
  // Forensic Relationships
  saveRelationship(relationship: ForensicRelationshipData): Promise<ForensicRelationshipData>;
  findRelationshipById(id: string): Promise<ForensicRelationshipData | null>;
  listRelationships(filter?: {
    entityType?: string;
    entityId?: string;
    relationshipClass?: string;
  }): Promise<ForensicRelationshipData[]>;

  // Intelligence Observations
  saveObservation(observation: IntelligenceObservationData): Promise<IntelligenceObservationData>;
  findObservationById(id: string): Promise<IntelligenceObservationData | null>;
  listObservations(): Promise<IntelligenceObservationData[]>;

  // Intelligence Leads
  saveLead(lead: IntelligenceLeadData): Promise<IntelligenceLeadData>;
  findLeadById(id: string): Promise<IntelligenceLeadData | null>;
  listLeads(filter?: { assignedOrgId?: string; status?: string }): Promise<IntelligenceLeadData[]>;

  // Link Analyses
  saveLinkAnalysis(analysis: LinkAnalysisData): Promise<LinkAnalysisData>;
  findLinkAnalysisById(id: string): Promise<LinkAnalysisData | null>;
  listLinkAnalyses(): Promise<LinkAnalysisData[]>;

  // Case Links
  saveCaseLink(caseLink: CaseLinkData): Promise<CaseLinkData>;
  findCaseLinkById(id: string): Promise<CaseLinkData | null>;
  listCaseLinks(caseId?: string): Promise<CaseLinkData[]>;

  // Person Entity Resolution Candidates
  savePersonResolutionCandidate(
    candidate: PersonResolutionCandidateData
  ): Promise<PersonResolutionCandidateData>;
  findPersonResolutionCandidateById(id: string): Promise<PersonResolutionCandidateData | null>;
  listPersonResolutionCandidates(status?: string): Promise<PersonResolutionCandidateData[]>;
}

export class InMemoryIntelligenceRepository implements IIntelligenceRepository {
  private relationships = new Map<string, ForensicRelationshipData>();
  private observations = new Map<string, IntelligenceObservationData>();
  private leads = new Map<string, IntelligenceLeadData>();
  private linkAnalyses = new Map<string, LinkAnalysisData>();
  private caseLinks = new Map<string, CaseLinkData>();
  private personCandidates = new Map<string, PersonResolutionCandidateData>();

  // Forensic Relationships
  public async saveRelationship(
    relationship: ForensicRelationshipData
  ): Promise<ForensicRelationshipData> {
    this.relationships.set(relationship.id, JSON.parse(JSON.stringify(relationship)));
    return JSON.parse(JSON.stringify(relationship));
  }

  public async findRelationshipById(id: string): Promise<ForensicRelationshipData | null> {
    const item = this.relationships.get(id);
    return item ? JSON.parse(JSON.stringify(item)) : null;
  }

  public async listRelationships(filter?: {
    entityType?: string;
    entityId?: string;
    relationshipClass?: string;
  }): Promise<ForensicRelationshipData[]> {
    let list = Array.from(this.relationships.values()).map((r) => JSON.parse(JSON.stringify(r)));
    if (filter?.entityType && filter?.entityId) {
      list = list.filter(
        (r) =>
          (r.sourceEntityType === filter.entityType && r.sourceEntityId === filter.entityId) ||
          (r.targetEntityType === filter.entityType && r.targetEntityId === filter.entityId)
      );
    }
    if (filter?.relationshipClass) {
      list = list.filter((r) => r.relationshipClass === filter.relationshipClass);
    }
    return list;
  }

  // Intelligence Observations
  public async saveObservation(
    observation: IntelligenceObservationData
  ): Promise<IntelligenceObservationData> {
    this.observations.set(observation.id, JSON.parse(JSON.stringify(observation)));
    return JSON.parse(JSON.stringify(observation));
  }

  public async findObservationById(id: string): Promise<IntelligenceObservationData | null> {
    const item = this.observations.get(id);
    return item ? JSON.parse(JSON.stringify(item)) : null;
  }

  public async listObservations(): Promise<IntelligenceObservationData[]> {
    return Array.from(this.observations.values()).map((o) => JSON.parse(JSON.stringify(o)));
  }

  // Intelligence Leads
  public async saveLead(lead: IntelligenceLeadData): Promise<IntelligenceLeadData> {
    this.leads.set(lead.id, JSON.parse(JSON.stringify(lead)));
    return JSON.parse(JSON.stringify(lead));
  }

  public async findLeadById(id: string): Promise<IntelligenceLeadData | null> {
    const item = this.leads.get(id);
    return item ? JSON.parse(JSON.stringify(item)) : null;
  }

  public async listLeads(filter?: {
    assignedOrgId?: string;
    status?: string;
  }): Promise<IntelligenceLeadData[]> {
    let list = Array.from(this.leads.values()).map((l) => JSON.parse(JSON.stringify(l)));
    if (filter?.assignedOrgId) {
      list = list.filter((l) => l.assignedOrgId === filter.assignedOrgId);
    }
    if (filter?.status) {
      list = list.filter((l) => l.status === filter.status);
    }
    return list;
  }

  // Link Analyses
  public async saveLinkAnalysis(analysis: LinkAnalysisData): Promise<LinkAnalysisData> {
    this.linkAnalyses.set(analysis.id, JSON.parse(JSON.stringify(analysis)));
    return JSON.parse(JSON.stringify(analysis));
  }

  public async findLinkAnalysisById(id: string): Promise<LinkAnalysisData | null> {
    const item = this.linkAnalyses.get(id);
    return item ? JSON.parse(JSON.stringify(item)) : null;
  }

  public async listLinkAnalyses(): Promise<LinkAnalysisData[]> {
    return Array.from(this.linkAnalyses.values()).map((a) => JSON.parse(JSON.stringify(a)));
  }

  // Case Links
  public async saveCaseLink(caseLink: CaseLinkData): Promise<CaseLinkData> {
    this.caseLinks.set(caseLink.id, JSON.parse(JSON.stringify(caseLink)));
    return JSON.parse(JSON.stringify(caseLink));
  }

  public async findCaseLinkById(id: string): Promise<CaseLinkData | null> {
    const item = this.caseLinks.get(id);
    return item ? JSON.parse(JSON.stringify(item)) : null;
  }

  public async listCaseLinks(caseId?: string): Promise<CaseLinkData[]> {
    let list = Array.from(this.caseLinks.values()).map((c) => JSON.parse(JSON.stringify(c)));
    if (caseId) {
      list = list.filter((c) => c.sourceCaseId === caseId || c.targetCaseId === caseId);
    }
    return list;
  }

  // Person Entity Resolution Candidates
  public async savePersonResolutionCandidate(
    candidate: PersonResolutionCandidateData
  ): Promise<PersonResolutionCandidateData> {
    this.personCandidates.set(candidate.id, JSON.parse(JSON.stringify(candidate)));
    return JSON.parse(JSON.stringify(candidate));
  }

  public async findPersonResolutionCandidateById(
    id: string
  ): Promise<PersonResolutionCandidateData | null> {
    const item = this.personCandidates.get(id);
    return item ? JSON.parse(JSON.stringify(item)) : null;
  }

  public async listPersonResolutionCandidates(
    status?: string
  ): Promise<PersonResolutionCandidateData[]> {
    let list = Array.from(this.personCandidates.values()).map((c) =>
      JSON.parse(JSON.stringify(c))
    );
    if (status) {
      list = list.filter((c) => c.status === status);
    }
    return list;
  }
}
