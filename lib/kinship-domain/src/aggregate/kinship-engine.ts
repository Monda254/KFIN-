import {
  RelationshipType,
  KinshipResultCategory,
  SharedAlleleLocus,
  PopulationAlleleFrequencyMap,
  KinshipResultData,
  KinshipAnalysisData,
  CandidateRankingData,
} from "../types";

export interface STRAlleleLocusInput {
  locusName: string;
  allele1: string;
  allele2?: string | null;
}

export interface ProfileSTRPanelInput {
  profileId: string;
  profileIdentifier: string;
  indexCode?: string;
  loci: STRAlleleLocusInput[];
}

// Versioned population allele frequency reference dataset
export const DEFAULT_KENYA_POPULATION_DATASET: PopulationAlleleFrequencyMap = {
  datasetCode: "KE-STR-FREQ",
  datasetVersion: "v1.0.0",
  description: "Kenyan National Forensic Population STR Allele Frequency Reference v1.0",
  frequencies: {
    D3S1358: { "14": 0.12, "15": 0.35, "16": 0.28, "17": 0.18, "18": 0.07 },
    vWA: { "14": 0.08, "15": 0.12, "16": 0.22, "17": 0.26, "18": 0.20, "19": 0.10, "20": 0.02 },
    FGA: { "20": 0.05, "21": 0.12, "22": 0.21, "23": 0.24, "24": 0.18, "25": 0.12, "26": 0.08 },
    D8S1179: { "10": 0.06, "11": 0.08, "12": 0.15, "13": 0.32, "14": 0.24, "15": 0.12, "16": 0.03 },
    D21S11: { "27": 0.04, "28": 0.16, "29": 0.28, "30": 0.24, "31": 0.18, "32.2": 0.08, "33.2": 0.02 },
    D18S51: { "12": 0.10, "13": 0.14, "14": 0.18, "15": 0.22, "16": 0.16, "17": 0.12, "18": 0.06, "19": 0.02 },
    D5S818: { "10": 0.06, "11": 0.34, "12": 0.38, "13": 0.18, "14": 0.04 },
    D13S317: { "8": 0.08, "9": 0.10, "10": 0.06, "11": 0.32, "12": 0.30, "13": 0.12, "14": 0.02 },
    D7S820: { "8": 0.14, "9": 0.12, "10": 0.26, "11": 0.30, "12": 0.14, "13": 0.04 },
    TH01: { "6": 0.22, "7": 0.28, "8": 0.14, "9": 0.18, "9.3": 0.18 },
    TPOX: { "8": 0.52, "9": 0.12, "10": 0.08, "11": 0.24, "12": 0.04 },
    CSF1PO: { "9": 0.04, "10": 0.22, "11": 0.30, "12": 0.34, "13": 0.08, "14": 0.02 },
    D16S539: { "9": 0.12, "10": 0.10, "11": 0.28, "12": 0.32, "13": 0.14, "14": 0.04 },
  },
};

export class KinshipEngine {
  public static readonly ALGORITHM_NAME = "KFIN-KINSHIP-CALC";
  public static readonly ALGORITHM_VERSION = "v1.6.0";

  /**
   * Executes scientific relationship calculation between Profile A and Profile B for a proposed hypothesis.
   */
  public static calculateKinship(
    analysisId: string,
    hypothesisId: string,
    profileA: ProfileSTRPanelInput,
    profileB: ProfileSTRPanelInput,
    relationshipType: RelationshipType,
    populationDataset: PopulationAlleleFrequencyMap = DEFAULT_KENYA_POPULATION_DATASET
  ): KinshipResultData {
    const lociDetails: SharedAlleleLocus[] = [];
    let ibs2Count = 0;
    let ibs1Count = 0;
    let ibs0Count = 0;
    let combinedLR = 1.0;
    let isConstrained = false;
    let constraintReason: string | undefined;

    // Create lookup map for Profile B loci
    const profileBLociMap = new Map<string, STRAlleleLocusInput>();
    for (const loc of profileB.loci) {
      profileBLociMap.set(loc.locusName.toUpperCase(), loc);
    }

    for (const locA of profileA.loci) {
      const locusName = locA.locusName.toUpperCase();
      if (locusName === "AMEL" || locusName === "AMELOGENIN") continue; // skip sex marker in STR LR calc

      const locB = profileBLociMap.get(locusName);
      if (!locB) continue; // locus not present in both profiles

      const allelesA = [locA.allele1, locA.allele2].filter((a): a is string => Boolean(a && a.trim() !== ""));
      const allelesB = [locB.allele1, locB.allele2].filter((a): a is string => Boolean(a && a.trim() !== ""));

      // Find shared alleles
      const shared = allelesA.filter((a) => allelesB.includes(a));
      const sharedAlleleCount = shared.length;

      let ibsState = 0;
      if (sharedAlleleCount >= 2 || (allelesA.length === 1 && allelesB.length === 1 && allelesA[0] === allelesB[0])) {
        ibsState = 2;
        ibs2Count++;
      } else if (sharedAlleleCount === 1) {
        ibsState = 1;
        ibs1Count++;
      } else {
        ibsState = 0;
        ibs0Count++;
      }

      // Per-locus Likelihood Ratio calculation based on hypothesis
      let locusLR = 1.0;
      const freqTable = populationDataset.frequencies[locusName];

      if (!freqTable) {
        isConstrained = true;
        constraintReason = `Locus ${locusName} is uncalibrated in population dataset ${populationDataset.datasetCode} ${populationDataset.datasetVersion}`;
        locusLR = ibsState === 0 ? 0.01 : ibsState === 1 ? 1.5 : 3.0;
      } else {
        const sharedAlleleVal = shared[0] || allelesA[0];
        const p = freqTable[sharedAlleleVal] || 0.15; // default fallback frequency

        if (relationshipType === "PARENT_CHILD") {
          if (ibsState === 0) {
            // Potential exclusion / mutation factor
            locusLR = 0.0001;
          } else if (ibsState === 2) {
            locusLR = 1.0 / (2.0 * p);
          } else {
            locusLR = 1.0 / (2.0 * p);
          }
        } else if (relationshipType === "FULL_SIBLINGS") {
          if (ibsState === 2) {
            locusLR = (0.25 + 0.5 * (1.0 / (2.0 * p)) + 0.25 * (1.0 / (p * p)));
          } else if (ibsState === 1) {
            locusLR = (0.5 + 0.25 * (1.0 / (2.0 * p)));
          } else {
            locusLR = 0.25;
          }
        } else if (relationshipType === "HALF_SIBLINGS" || relationshipType === "GRANDPARENT_GRANDCHILD" || relationshipType === "AUNT_UNCLE_NIECE_NEPHEW") {
          if (ibsState >= 1) {
            locusLR = 0.5 + 0.5 * (1.0 / (2.0 * p));
          } else {
            locusLR = 0.5;
          }
        } else {
          // General default kinship LR
          locusLR = ibsState === 0 ? 0.05 : ibsState === 1 ? 1.2 : 2.5;
        }
      }

      combinedLR *= locusLR;

      lociDetails.push({
        locusName,
        profileAAlleles: allelesA,
        profileBAlleles: allelesB,
        sharedAlleleCount,
        ibsState,
        locusLR: Math.round(locusLR * 10000) / 10000,
      });
    }

    const totalLociEvaluated = lociDetails.length;
    let interpretationCategory: KinshipResultCategory = "INCONCLUSIVE";

    if (relationshipType === "PARENT_CHILD") {
      if (ibs0Count === 0 && combinedLR > 5.0) {
        interpretationCategory = "SUPPORTED";
      } else if (ibs0Count >= 3 || combinedLR < 0.01) {
        interpretationCategory = "EXCLUDED";
      } else {
        interpretationCategory = "INCONCLUSIVE";
      }
    } else {
      if (combinedLR > 2.0) {
        interpretationCategory = "SUPPORTED";
      } else if (combinedLR < 0.1) {
        interpretationCategory = "EXCLUDED";
      } else {
        interpretationCategory = "INCONCLUSIVE";
      }
    }

    const formattedLR = combinedLR > 1e6 ? combinedLR.toExponential(4) : combinedLR.toFixed(2);

    return {
      id: `kin-res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      analysisId,
      hypothesisId,
      combinedLikelihoodRatio: formattedLR,
      sharedAlleleSummary: {
        totalLociEvaluated,
        ibs2LociCount: ibs2Count,
        ibs1LociCount: ibs1Count,
        ibs0LociCount: ibs0Count,
        lociDetails,
      },
      interpretationCategory,
      confidenceQualityInfo: {
        confidenceLevelPct: combinedLR > 1000 ? 99.9 : combinedLR > 100 ? 95.0 : 50.0,
        scientificallyConstrained: isConstrained,
        constraintReason,
      },
      limitations: isConstrained
        ? `Analysis is scientifically constrained: ${constraintReason}`
        : "Kinship likelihood is a statistical probability based on analyzed STR loci panel and population dataset assumptions. It constitutes an analytical lead requiring authorized human scientific review before final forensic conclusion.",
      reviewStatus: "PENDING",
      createdAt: new Date(),
    };
  }

  /**
   * Ranks candidate profiles from national indices against a target search profile for Familial Searching.
   */
  public static rankFamilialCandidates(
    requestId: string,
    targetProfile: ProfileSTRPanelInput,
    candidateProfiles: ProfileSTRPanelInput[],
    estimatedType: RelationshipType = "PARENT_CHILD"
  ): CandidateRankingData[] {
    const candidateRankings: CandidateRankingData[] = [];

    for (const candidate of candidateProfiles) {
      const result = this.calculateKinship(
        "temp-analysis",
        "temp-hypothesis",
        targetProfile,
        candidate,
        estimatedType
      );

      const scoreNum = parseFloat(result.combinedLikelihoodRatio);
      if (scoreNum > 1.0) {
        candidateRankings.push({
          id: `fsc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          requestId,
          candidateProfileId: candidate.profileId,
          estimatedRelationshipType: estimatedType,
          likelihoodRatioScore: result.combinedLikelihoodRatio,
          rankingIndex: 0,
          leadStatus: "INVESTIGATIVE_LEAD",
        });
      }
    }

    // Sort descending by Likelihood Ratio Score
    candidateRankings.sort((a, b) => parseFloat(b.likelihoodRatioScore) - parseFloat(a.likelihoodRatioScore));

    // Assign ranking index (1-based)
    return candidateRankings.map((c, idx) => ({
      ...c,
      rankingIndex: idx + 1,
    }));
  }
}
