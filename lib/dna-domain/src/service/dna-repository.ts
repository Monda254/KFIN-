import type {
  DnaProfileState,
  BiologicalSampleRecord,
  DnaIndexRecord,
  DnaMatchingRequestRecord,
  DnaMatchingResultRecord,
  DnaIndexCode,
} from "../types";
import { DnaProfileAggregate } from "../aggregate/dna-aggregate";

export interface IDnaRepository {
  saveSample(sample: BiologicalSampleRecord): Promise<void>;
  getSampleById(id: string): Promise<BiologicalSampleRecord | null>;

  getIndices(): Promise<DnaIndexRecord[]>;
  getIndexByCode(code: DnaIndexCode): Promise<DnaIndexRecord | null>;

  saveProfile(aggregate: DnaProfileAggregate): Promise<void>;
  getProfileById(id: string): Promise<DnaProfileAggregate | null>;
  getProfileByIdentifier(identifier: string): Promise<DnaProfileAggregate | null>;
  searchProfiles(filters: {
    indexCode?: DnaIndexCode;
    status?: string;
    sampleId?: string;
  }): Promise<DnaProfileAggregate[]>;

  saveMatchingRequest(request: DnaMatchingRequestRecord): Promise<void>;
  getMatchingRequestById(id: string): Promise<DnaMatchingRequestRecord | null>;

  saveMatchingResults(results: DnaMatchingResultRecord[]): Promise<void>;
  getMatchingResultsByRequestId(requestId: string): Promise<DnaMatchingResultRecord[]>;
  getMatchingResultById(id: string): Promise<DnaMatchingResultRecord | null>;
  updateMatchingResult(result: DnaMatchingResultRecord): Promise<void>;
}

export class InMemoryDnaRepository implements IDnaRepository {
  private samples = new Map<string, BiologicalSampleRecord>();
  private indices = new Map<string, DnaIndexRecord>();
  private profiles = new Map<string, DnaProfileAggregate>();
  private matchingRequests = new Map<string, DnaMatchingRequestRecord>();
  private matchingResults = new Map<string, DnaMatchingResultRecord>();

  constructor() {
    this.seedDefaultIndices();
  }

  private seedDefaultIndices(): void {
    const defaultIndices: DnaIndexRecord[] = [
      {
        id: "idx_forensic",
        code: "FORENSIC",
        name: "National Forensic Evidence DNA Index",
        description: "DNA profiles recovered from crime scenes, biological evidence exhibits, and trace materials.",
        legalBasisRegulation: "National Forensic DNA Act § 12(1)",
        retentionYearsDefault: 99,
        isRestricted: false,
      },
      {
        id: "idx_offender",
        code: "OFFENDER",
        name: "National Convicted Offender DNA Index",
        description: "DNA profiles from legally authorized convicted offenders.",
        legalBasisRegulation: "National Forensic DNA Act § 15(3)",
        retentionYearsDefault: 50,
        isRestricted: true,
      },
      {
        id: "idx_missing",
        code: "MISSING_PERSONS",
        name: "Missing Persons & Relatives Index",
        description: "DNA profiles of reported missing persons and consenting family reference donors.",
        legalBasisRegulation: "National Forensic DNA Act § 22(1)",
        retentionYearsDefault: 30,
        isRestricted: false,
      },
      {
        id: "idx_remains",
        code: "UNIDENTIFIED_REMAINS",
        name: "Unidentified Human Remains Index",
        description: "DNA profiles from unidentified deceased remains and disaster victim recovery.",
        legalBasisRegulation: "National Forensic DNA Act § 24(2)",
        retentionYearsDefault: 50,
        isRestricted: false,
      },
      {
        id: "idx_elimination",
        code: "ELIMINATION",
        name: "Laboratory & Crime Scene Elimination Index",
        description: "Controlled DNA profiles of forensic personnel, evidence handlers, and first responders to detect contamination.",
        legalBasisRegulation: "National Forensic Quality Regulations § 4(A)",
        retentionYearsDefault: 10,
        isRestricted: true,
      },
    ];

    for (const idx of defaultIndices) {
      this.indices.set(idx.code, idx);
    }
  }

  public async saveSample(sample: BiologicalSampleRecord): Promise<void> {
    this.samples.set(sample.id, { ...sample });
  }

  public async getSampleById(id: string): Promise<BiologicalSampleRecord | null> {
    const s = this.samples.get(id);
    return s ? { ...s } : null;
  }

  public async getIndices(): Promise<DnaIndexRecord[]> {
    return Array.from(this.indices.values()).map((i) => ({ ...i }));
  }

  public async getIndexByCode(code: DnaIndexCode): Promise<DnaIndexRecord | null> {
    const idx = this.indices.get(code);
    return idx ? { ...idx } : null;
  }

  public async saveProfile(aggregate: DnaProfileAggregate): Promise<void> {
    this.profiles.set(aggregate.getId(), aggregate);
  }

  public async getProfileById(id: string): Promise<DnaProfileAggregate | null> {
    return this.profiles.get(id) || null;
  }

  public async getProfileByIdentifier(identifier: string): Promise<DnaProfileAggregate | null> {
    for (const agg of this.profiles.values()) {
      if (agg.getProfileIdentifier() === identifier) {
        return agg;
      }
    }
    return null;
  }

  public async searchProfiles(filters: {
    indexCode?: DnaIndexCode;
    status?: string;
    sampleId?: string;
  }): Promise<DnaProfileAggregate[]> {
    let list = Array.from(this.profiles.values());

    if (filters.indexCode) {
      list = list.filter((agg) => agg.getIndexCode() === filters.indexCode);
    }
    if (filters.status) {
      list = list.filter((agg) => agg.getStatus() === filters.status);
    }
    if (filters.sampleId) {
      list = list.filter((agg) => agg.getState().sampleId === filters.sampleId);
    }

    return list;
  }

  public async saveMatchingRequest(request: DnaMatchingRequestRecord): Promise<void> {
    this.matchingRequests.set(request.id, { ...request });
  }

  public async getMatchingRequestById(id: string): Promise<DnaMatchingRequestRecord | null> {
    const req = this.matchingRequests.get(id);
    return req ? { ...req } : null;
  }

  public async saveMatchingResults(results: DnaMatchingResultRecord[]): Promise<void> {
    for (const res of results) {
      this.matchingResults.set(res.id, { ...res });
    }
  }

  public async getMatchingResultsByRequestId(requestId: string): Promise<DnaMatchingResultRecord[]> {
    return Array.from(this.matchingResults.values())
      .filter((r) => r.requestId === requestId)
      .map((r) => ({ ...r }));
  }

  public async getMatchingResultById(id: string): Promise<DnaMatchingResultRecord | null> {
    const res = this.matchingResults.get(id);
    return res ? { ...res } : null;
  }

  public async updateMatchingResult(result: DnaMatchingResultRecord): Promise<void> {
    this.matchingResults.set(result.id, { ...result });
  }
}
