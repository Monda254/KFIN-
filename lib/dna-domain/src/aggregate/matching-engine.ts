import type { DnaProfileState, StrAllele, StringencyLevel } from "../types";

export interface ComparisonResult {
  candidateProfileId: string;
  matchingLociCount: number;
  totalEvaluatedLoci: number;
  stringencyLevel: StringencyLevel;
  likelihoodRatioScore: string;
  sharedLociNames: string[];
}

export class DnaMatchingEngine {
  public static readonly ALGORITHM_NAME = "KFIN-STR-COMPARE";
  public static readonly ALGORITHM_VERSION = "1.5.0";

  /**
   * Compares a query DNA profile against a candidate DNA profile.
   */
  public static compareProfiles(
    target: DnaProfileState,
    candidate: DnaProfileState
  ): ComparisonResult | null {
    if (!target.alleles || target.alleles.length === 0) return null;
    if (!candidate.alleles || candidate.alleles.length === 0) return null;

    const candidateLociMap = new Map<string, StrAllele>();
    for (const ca of candidate.alleles) {
      candidateLociMap.set(ca.locusName.toUpperCase(), ca);
    }

    let matchingLociCount = 0;
    let totalEvaluatedLoci = 0;
    let highMatchCount = 0;
    const sharedLociNames: string[] = [];

    for (const ta of target.alleles) {
      const locusKey = ta.locusName.toUpperCase();
      // Skip sex marker for autosomal match counting if desired, or include AMEL
      if (locusKey === "AMEL") continue;

      const ca = candidateLociMap.get(locusKey);
      if (!ca) continue;

      totalEvaluatedLoci++;

      const targetVals = [ta.allele1, ta.allele2].filter(Boolean) as string[];
      const candidateVals = [ca.allele1, ca.allele2].filter(Boolean) as string[];

      // Check exact match
      const targetSorted = [...targetVals].sort().join(",");
      const candidateSorted = [...candidateVals].sort().join(",");

      if (targetSorted === candidateSorted && targetSorted.length > 0) {
        matchingLociCount++;
        highMatchCount++;
        sharedLociNames.push(locusKey);
      } else {
        // Check partial match (shared allele)
        const hasOverlap = targetVals.some((val) => candidateVals.includes(val));
        if (hasOverlap) {
          matchingLociCount++;
          sharedLociNames.push(locusKey);
        }
      }
    }

    if (matchingLociCount === 0) {
      return null;
    }

    let stringencyLevel: StringencyLevel = "LOW";
    if (highMatchCount === totalEvaluatedLoci && totalEvaluatedLoci >= 12) {
      stringencyLevel = "HIGH";
    } else if (matchingLociCount >= 8) {
      stringencyLevel = "MODERATE";
    }

    // Likelihood ratio calculation estimate based on matching loci count
    // Scientific formula approximation: 10^(matchingLociCount * 1.1)
    const lrExponent = matchingLociCount * 1.15;
    const lrBase = Math.pow(10, lrExponent);
    const likelihoodRatioScore = lrBase.toExponential(2);

    return {
      candidateProfileId: candidate.id,
      matchingLociCount,
      totalEvaluatedLoci,
      stringencyLevel,
      likelihoodRatioScore,
      sharedLociNames,
    };
  }
}
