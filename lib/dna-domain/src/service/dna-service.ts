import type { Subject } from "@workspace/security";
import type {
  BiologicalSampleRecord,
  DnaIndexCode,
  DnaProfileState,
  StrAllele,
  ProfileQuality,
  CandidateMatchStatus,
  DnaMatchingRequestRecord,
  DnaMatchingResultRecord,
} from "../types";
import {
  UnauthorizedDnaActionError,
  DnaProfileNotFoundError,
} from "../types";
import { DnaProfileAggregate } from "../aggregate/dna-aggregate";
import { DnaNumberGenerator } from "../aggregate/numbering";
import { DnaMatchingEngine } from "../aggregate/matching-engine";
import { IDnaRepository } from "./dna-repository";

export class DnaService {
  constructor(private readonly repository: IDnaRepository) {}

  /**
   * Registers a biological sample recovered from evidence or reference donor.
   */
  public async createBiologicalSample(
    subject: Subject,
    params: {
      id?: string;
      sampleNumber?: string;
      evidenceId?: string;
      caseId?: string;
      sampleType: any;
      donorType: any;
      donorPseudonym?: string;
      collectionDate?: string;
      storageFreezerLocation: string;
      concentrationNgUl?: string;
      notes?: string;
    }
  ): Promise<BiologicalSampleRecord> {
    if (!subject.permissions.includes("dna:create") && subject.clearanceLevel < 3) {
      throw new UnauthorizedDnaActionError("Subject unauthorized to register biological samples");
    }

    const sampleId = params.id || `smp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const sampleNumber = params.sampleNumber || DnaNumberGenerator.generateSampleNumber();

    const sample: BiologicalSampleRecord = {
      id: sampleId,
      sampleNumber,
      evidenceId: params.evidenceId,
      caseId: params.caseId,
      sampleType: params.sampleType,
      donorType: params.donorType,
      donorPseudonym: params.donorPseudonym,
      collectionDate: params.collectionDate || new Date().toISOString(),
      collectedById: subject.userId,
      storageFreezerLocation: params.storageFreezerLocation,
      concentrationNgUl: params.concentrationNgUl,
      notes: params.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.repository.saveSample(sample);
    return sample;
  }

  /**
   * Registers a new DNA Profile with STR locus alleles.
   */
  public async createProfile(
    subject: Subject,
    params: {
      id?: string;
      sampleId: string;
      indexCode: DnaIndexCode;
      profileIdentifier?: string;
      profileQuality?: ProfileQuality;
      extractionMethod?: string;
      quantificationKit?: string;
      amplificationKit?: string;
      electrophoresisInstrument?: string;
      classification?: any;
      alleles: StrAllele[];
      notes?: string;
    }
  ): Promise<DnaProfileAggregate> {
    if (!subject.permissions.includes("dna:create") && subject.clearanceLevel < 4) {
      throw new UnauthorizedDnaActionError("Subject unauthorized to create DNA profiles");
    }

    const sample = await this.repository.getSampleById(params.sampleId);
    if (!sample) {
      throw new Error(`Biological sample '${params.sampleId}' not found`);
    }

    const indexRecord = await this.repository.getIndexByCode(params.indexCode);
    if (!indexRecord) {
      throw new Error(`DNA Index '${params.indexCode}' not found`);
    }

    // Check restricted index access permission
    if (indexRecord.isRestricted && !subject.permissions.includes("index:access_restricted") && subject.clearanceLevel < 4) {
      throw new UnauthorizedDnaActionError(`Subject lacks permission to insert profiles into restricted index '${params.indexCode}'`);
    }

    const id = params.id || `dna_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const profileIdentifier = params.profileIdentifier || DnaNumberGenerator.generateProfileIdentifier();

    const state: DnaProfileState = {
      id,
      sampleId: params.sampleId,
      indexId: indexRecord.id,
      indexCode: params.indexCode,
      profileIdentifier,
      profileQuality: params.profileQuality || "HIGH",
      lociCount: params.alleles.length,
      profileStatus: "DRAFT",
      extractionMethod: params.extractionMethod || "ORGANIC_PHENOL_CHLOROFORM",
      quantificationKit: params.quantificationKit || "QUANTIFILER_TRIO",
      amplificationKit: params.amplificationKit || "GLOBALFILER_PCR",
      electrophoresisInstrument: params.electrophoresisInstrument || "ABI_3500XL_GENETIC_ANALYZER",
      analystId: subject.userId,
      classification: params.classification || "RESTRICTED",
      version: 1,
      isLegalHold: false,
      notes: params.notes,
      alleles: [...params.alleles],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const aggregate = new DnaProfileAggregate(state);
    await this.repository.saveProfile(aggregate);
    return aggregate;
  }

  /**
   * Approves a DNA profile after quality review.
   */
  public async approveProfile(
    subject: Subject,
    profileId: string,
    expectedVersion?: number
  ): Promise<DnaProfileAggregate> {
    if (!subject.permissions.includes("dna:approve") && subject.clearanceLevel < 4) {
      throw new UnauthorizedDnaActionError("Subject unauthorized to approve DNA profiles");
    }

    const aggregate = await this.repository.getProfileById(profileId);
    if (!aggregate) {
      throw new DnaProfileNotFoundError(`DNA Profile '${profileId}' not found`);
    }

    aggregate.approve(subject.userId, expectedVersion);
    await this.repository.saveProfile(aggregate);
    return aggregate;
  }

  /**
   * Withdraws a DNA profile from active use.
   */
  public async withdrawProfile(
    subject: Subject,
    profileId: string,
    reason: string,
    expectedVersion?: number
  ): Promise<DnaProfileAggregate> {
    if (!subject.permissions.includes("dna:withdraw") && subject.clearanceLevel < 4) {
      throw new UnauthorizedDnaActionError("Subject unauthorized to withdraw DNA profiles");
    }

    const aggregate = await this.repository.getProfileById(profileId);
    if (!aggregate) {
      throw new DnaProfileNotFoundError(`DNA Profile '${profileId}' not found`);
    }

    aggregate.withdraw(reason, expectedVersion);
    await this.repository.saveProfile(aggregate);
    return aggregate;
  }

  /**
   * Initiates and executes an authorized forensic DNA search.
   */
  public async executeSearch(
    subject: Subject,
    params: {
      targetProfileId: string;
      targetIndices: DnaIndexCode[];
      minMatchingLoci?: number;
      searchPurpose: string;
    }
  ): Promise<{
    request: DnaMatchingRequestRecord;
    results: DnaMatchingResultRecord[];
  }> {
    if (!subject.permissions.includes("dna:search") && subject.clearanceLevel < 3) {
      throw new UnauthorizedDnaActionError("Subject unauthorized to execute DNA searches");
    }

    const targetAgg = await this.repository.getProfileById(params.targetProfileId);
    if (!targetAgg) {
      throw new DnaProfileNotFoundError(`Target DNA Profile '${params.targetProfileId}' not found`);
    }

    // Verify index permissions for each target index
    for (const code of params.targetIndices) {
      const idxRecord = await this.repository.getIndexByCode(code);
      if (idxRecord && idxRecord.isRestricted) {
        if (!subject.permissions.includes("search:restricted_index") && subject.clearanceLevel < 4) {
          throw new UnauthorizedDnaActionError(
            `Unauthorized search attempt against restricted index '${code}'`
          );
        }
      }
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const request: DnaMatchingRequestRecord = {
      id: requestId,
      targetProfileId: params.targetProfileId,
      requestedById: subject.userId,
      targetIndices: [...params.targetIndices],
      minMatchingLoci: params.minMatchingLoci || 13,
      searchPurpose: params.searchPurpose,
      algorithmVersion: `${DnaMatchingEngine.ALGORITHM_NAME} v${DnaMatchingEngine.ALGORITHM_VERSION}`,
      status: "RUNNING",
      createdAt: new Date().toISOString(),
    };

    await this.repository.saveMatchingRequest(request);

    // Perform candidate comparison across target indices
    const results: DnaMatchingResultRecord[] = [];
    const minLoci = params.minMatchingLoci || 13;

    for (const code of params.targetIndices) {
      const candidates = await this.repository.searchProfiles({
        indexCode: code,
        status: "ACTIVE",
      });

      for (const candAgg of candidates) {
        if (candAgg.getId() === targetAgg.getId()) continue;

        const comp = DnaMatchingEngine.compareProfiles(
          targetAgg.getState(),
          candAgg.getState()
        );

        if (comp && comp.matchingLociCount >= minLoci) {
          const resId = `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          results.push({
            id: resId,
            requestId,
            candidateProfileId: candAgg.getId(),
            matchingLociCount: comp.matchingLociCount,
            stringencyLevel: comp.stringencyLevel,
            likelihoodRatioScore: comp.likelihoodRatioScore,
            status: "CANDIDATE",
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    request.status = "COMPLETED";
    request.completedAt = new Date().toISOString();
    await this.repository.saveMatchingRequest(request);
    await this.repository.saveMatchingResults(results);

    return { request, results };
  }

  /**
   * Performs scientific review on a candidate DNA match.
   */
  public async reviewCandidateMatch(
    subject: Subject,
    resultId: string,
    decision: CandidateMatchStatus,
    reviewNotes: string
  ): Promise<DnaMatchingResultRecord> {
    if (!subject.permissions.includes("dna:review_match") && subject.clearanceLevel < 4) {
      throw new UnauthorizedDnaActionError("Subject unauthorized to perform scientific match review");
    }

    const matchRes = await this.repository.getMatchingResultById(resultId);
    if (!matchRes) {
      throw new Error(`Candidate match result '${resultId}' not found`);
    }

    matchRes.status = decision;
    matchRes.reviewedById = subject.userId;
    matchRes.reviewNotes = reviewNotes;
    if (decision === "TECHNICALLY_CONFIRMED") {
      matchRes.confirmedAt = new Date().toISOString();
    }

    await this.repository.updateMatchingResult(matchRes);
    return matchRes;
  }

  /**
   * Reconstructs complete forensic provenance for a DNA profile (Profile -> Sample -> Evidence -> Case).
   */
  public async getProvenance(subject: Subject, profileId: string) {
    const aggregate = await this.repository.getProfileById(profileId);
    if (!aggregate) {
      throw new DnaProfileNotFoundError(`DNA Profile '${profileId}' not found`);
    }

    const sample = await this.repository.getSampleById(aggregate.getState().sampleId);

    return {
      profile: aggregate.getState(),
      sample,
      provenanceTrace: {
        profileId: aggregate.getId(),
        profileIdentifier: aggregate.getProfileIdentifier(),
        sampleId: sample?.id || null,
        sampleNumber: sample?.sampleNumber || null,
        evidenceId: sample?.evidenceId || null,
        caseId: sample?.caseId || null,
        analystId: aggregate.getState().analystId,
        indexCode: aggregate.getIndexCode(),
      },
    };
  }

  public async getProfileById(subject: Subject, profileId: string): Promise<DnaProfileAggregate> {
    const aggregate = await this.repository.getProfileById(profileId);
    if (!aggregate) {
      throw new DnaProfileNotFoundError(`DNA Profile '${profileId}' not found`);
    }
    return aggregate;
  }
}
