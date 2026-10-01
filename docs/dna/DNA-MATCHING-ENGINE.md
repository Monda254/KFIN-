# KFIN DNA Matching Engine & STR Comparison Specification

## 1. Overview
The `DnaMatchingEngine` evaluates autosomal STR loci profiles between a query profile and candidate profiles in active indices using versioned algorithms (`KFIN-STR-COMPARE v1.5.0`).

## 2. Comparison Metrics

### 2.1 Loci Match Count (`matchingLociCount`)
Total number of loci where the query profile and candidate profile share identical or partial alleles (e.g., 13+ matching loci).

### 2.2 Match Stringency (`stringencyLevel`)
- **`HIGH`**: Exact 2-allele match at all evaluated loci across 13+ CODIS loci.
- **`MODERATE`**: High loci match count (>= 10 loci) with single-allele sharing at partial loci.
- **`LOW`**: Minimum locus overlap.

### 2.3 Likelihood Ratio (`likelihoodRatioScore`)
Calculates scientific match likelihood ratio estimates formatted in exponential notation (e.g., `1.85e+14`), providing scientific foundation for forensic review.

## 3. Scientific Boundary
Computational candidate matches remain in `CANDIDATE` status until independently reviewed by an accredited forensic scientist (`TECHNICALLY_CONFIRMED`, `EXCLUDED`, or `INCONCLUSIVE`).
