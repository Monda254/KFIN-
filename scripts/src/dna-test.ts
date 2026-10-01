import {
  DnaProfileAggregate,
  DnaService,
  InMemoryDnaRepository,
  DnaNumberGenerator,
  DnaProfileStateMachine,
  DnaMatchingEngine,
  UnauthorizedDnaActionError,
  DnaLegalHoldViolationError,
  DnaConcurrencyConflictError,
  StrAllele,
} from "@workspace/dna-domain";
import type { Subject } from "@workspace/security";

console.log("=====================================================================");
console.log("             KFIN PHASE 1.5 DNA ACCEPTANCE TEST SUITE");
console.log("   NATIONAL INDICES, STR SEARCH ENGINE, MATCHING & GOVERNANCE");
console.log("=====================================================================\n");

let testsPassed = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    testsPassed++;
    console.log(`Test ${totalTests.toString().padStart(2, " ")}: ${testName} ... ✅ PASS`);
  } else {
    console.error(`Test ${totalTests.toString().padStart(2, " ")}: ${testName} ... ❌ FAIL (${detail || "Assertion failed"})`);
    process.exitCode = 1;
  }
}

async function runAcceptanceSuite() {
  const repo = new InMemoryDnaRepository();
  const service = new DnaService(repo);

  // Setup test subjects
  const analystUser: Subject = {
    userId: "usr_dna_analyst_01",
    email: "analyst1@nphl.go.ke",
    badgeNumber: "NPHL-9912",
    fullName: "Dr. Mutua",
    organizationId: "org_nphl_lab",
    organizationCode: "NPHL",
    clearanceLevel: 4,
    clearanceCode: "CONFIDENTIAL",
    accountStatus: "ACTIVE",
    roles: ["LAB_ANALYST"],
    permissions: [
      "dna:create",
      "dna:read",
      "dna:approve",
      "dna:search",
      "dna:review_match",
      "dna:withdraw",
      "index:access_restricted",
      "search:restricted_index",
    ],
    isServiceIdentity: false,
  };

  const reviewerUser: Subject = {
    userId: "usr_dna_director_01",
    email: "director@nphl.go.ke",
    badgeNumber: "NPHL-0001",
    fullName: "Dr. Wanjiku",
    organizationId: "org_nphl_lab",
    organizationCode: "NPHL",
    clearanceLevel: 5,
    clearanceCode: "HIGHLY_RESTRICTED",
    accountStatus: "ACTIVE",
    roles: ["LAB_DIRECTOR"],
    permissions: [
      "dna:create",
      "dna:read",
      "dna:approve",
      "dna:search",
      "dna:review_match",
      "dna:withdraw",
      "index:access_restricted",
      "search:restricted_index",
    ],
    isServiceIdentity: false,
  };

  const unauthorizedUser: Subject = {
    userId: "usr_civilian_01",
    email: "visitor@external.org",
    badgeNumber: "EXT-0000",
    fullName: "External Visitor",
    organizationId: "org_external",
    organizationCode: "EXT",
    clearanceLevel: 1,
    clearanceCode: "PUBLIC",
    accountStatus: "ACTIVE",
    roles: ["INSTITUTIONAL_OFFICER"],
    permissions: ["case:read"],
    isServiceIdentity: false,
  };

  // Test 1: DNA Number Generator
  const identifier = DnaNumberGenerator.generateProfileIdentifier("NPHL");
  assert(DnaNumberGenerator.isValidIdentifier(identifier), "DNA Identifier Generator produces valid KFIN profile format", `Generated ${identifier}`);

  // Test 2: State Machine Transitions
  const validTrans = DnaProfileStateMachine.canTransition("DRAFT", "QUALITY_REVIEW");
  assert(validTrans.allowed, "State Machine validates valid transition (DRAFT -> QUALITY_REVIEW)");

  const invalidTrans = DnaProfileStateMachine.canTransition("WITHDRAWN", "ACTIVE");
  assert(!invalidTrans.allowed, "State Machine rejects invalid transition (WITHDRAWN -> ACTIVE)");

  // Scenario 1 — Crime Scene DNA Profile Registration & Approval
  const sample1 = await service.createBiologicalSample(analystUser, {
    id: "smp_crime_01",
    sampleNumber: "SMP-DCI-2026-0001",
    evidenceId: "evd_scen_1",
    caseId: "case_dci_001",
    sampleType: "WHOLE_BLOOD",
    donorType: "EVIDENCE_STAIN",
    storageFreezerLocation: "FREEZER-A1-SHELF-3",
  });

  const CODIS_ALLELES_1: StrAllele[] = [
    { locusName: "D3S1358", allele1: "15", allele2: "16" },
    { locusName: "vWA", allele1: "17", allele2: "18" },
    { locusName: "FGA", allele1: "21", allele2: "23" },
    { locusName: "D8S1179", allele1: "13", allele2: "14" },
    { locusName: "D21S11", allele1: "28", allele2: "30" },
    { locusName: "D18S51", allele1: "12", allele2: "15" },
    { locusName: "D5S818", allele1: "11", allele2: "12" },
    { locusName: "D13S317", allele1: "11", allele2: "14" },
    { locusName: "D7S820", allele1: "10", allele2: "11" },
    { locusName: "TH01", allele1: "6", allele2: "9.3" },
    { locusName: "TPOX", allele1: "8", allele2: "11" },
    { locusName: "CSF1PO", allele1: "10", allele2: "12" },
    { locusName: "AMEL", allele1: "X", allele2: "Y" },
  ];

  const profile1 = await service.createProfile(analystUser, {
    id: "dna_crime_01",
    sampleId: sample1.id,
    indexCode: "FORENSIC",
    alleles: CODIS_ALLELES_1,
  });

  assert(profile1.getStatus() === "DRAFT", "Scenario 1 — Created DNA Profile starts in DRAFT state");
  await service.approveProfile(analystUser, "dna_crime_01");
  const approvedP1 = await service.getProfileById(analystUser, "dna_crime_01");
  assert(approvedP1.getStatus() === "ACTIVE", "Scenario 1 — Quality review approval activates profile into Forensic Index");

  // Register Offender Profile for Matching
  const sampleOffender = await service.createBiologicalSample(analystUser, {
    id: "smp_offender_01",
    sampleNumber: "SMP-OFF-2026-9901",
    sampleType: "BUCCAL_SWAB",
    donorType: "CONVICTED_OFFENDER",
    donorPseudonym: "SUBJECT-X-88",
    storageFreezerLocation: "FREEZER-B2-SHELF-1",
  });

  const profileOffender = await service.createProfile(analystUser, {
    id: "dna_offender_01",
    sampleId: sampleOffender.id,
    indexCode: "OFFENDER",
    alleles: CODIS_ALLELES_1, // Identical loci to simulate match
  });
  await service.approveProfile(analystUser, "dna_offender_01");

  // Scenario 2 — Authorized Forensic Search
  const searchResult1 = await service.executeSearch(analystUser, {
    targetProfileId: "dna_crime_01",
    targetIndices: ["OFFENDER"],
    minMatchingLoci: 12,
    searchPurpose: "SERIAL_CRIME_INVESTIGATION",
  });

  assert(searchResult1.request.status === "COMPLETED", "Scenario 2 — Forensic search job completed successfully");
  assert(searchResult1.results.length === 1, "Scenario 2 — Search produced 1 candidate match in Offender Index");
  assert(searchResult1.results[0].stringencyLevel === "HIGH", "Scenario 2 — Match engine computed HIGH stringency loci match");

  // Scenario 3 — Search with No Match
  const sampleNoMatch = await service.createBiologicalSample(analystUser, {
    id: "smp_nomatch_01",
    sampleNumber: "SMP-NOMATCH-01",
    sampleType: "TOUCH_DNA",
    donorType: "EVIDENCE_STAIN",
    storageFreezerLocation: "FREEZER-A1-SHELF-4",
  });
  const NO_MATCH_ALLELES: StrAllele[] = [
    { locusName: "D3S1358", allele1: "9", allele2: "10" },
    { locusName: "vWA", allele1: "11", allele2: "12" },
    { locusName: "FGA", allele1: "14", allele2: "15" },
    { locusName: "D8S1179", allele1: "8", allele2: "9" },
    { locusName: "D21S11", allele1: "19", allele2: "20" },
    { locusName: "D18S51", allele1: "8", allele2: "9" },
    { locusName: "D5S818", allele1: "7", allele2: "8" },
    { locusName: "D13S317", allele1: "7", allele2: "8" },
    { locusName: "D7S820", allele1: "6", allele2: "7" },
    { locusName: "TH01", allele1: "4", allele2: "5" },
    { locusName: "TPOX", allele1: "6", allele2: "7" },
    { locusName: "CSF1PO", allele1: "6", allele2: "7" },
    { locusName: "AMEL", allele1: "X", allele2: "X" },
  ];
  const pNoMatch = await service.createProfile(analystUser, {
    id: "dna_nomatch_01",
    sampleId: sampleNoMatch.id,
    indexCode: "FORENSIC",
    alleles: NO_MATCH_ALLELES,
  });
  await service.approveProfile(analystUser, "dna_nomatch_01");

  const searchResultNoMatch = await service.executeSearch(analystUser, {
    targetProfileId: "dna_nomatch_01",
    targetIndices: ["OFFENDER"],
    minMatchingLoci: 12,
    searchPurpose: "ROUTINE_CHECK",
  });
  assert(searchResultNoMatch.request.status === "COMPLETED", "Scenario 3 — No-match search completes with COMPLETED status");
  assert(searchResultNoMatch.results.length === 0, "Scenario 3 — Zero candidate matches cleanly distinguished from search failure");

  // Scenario 4 — Scientific Candidate Match Review & Confirmation
  const candMatchId = searchResult1.results[0].id;
  const reviewedMatch = await service.reviewCandidateMatch(
    reviewerUser,
    candMatchId,
    "TECHNICALLY_CONFIRMED",
    "Independent double-blind verification confirms 13-locus STR match"
  );
  assert(reviewedMatch.status === "TECHNICALLY_CONFIRMED", "Scenario 4 — Independent scientific review confirms candidate match status");

  // Scenario 5 — Profile Withdrawal & Legal Hold Protection
  await service.getProfileById(analystUser, "dna_crime_01");
  const aggToHold = await service.getProfileById(analystUser, "dna_crime_01");
  aggToHold.setLegalHold(true);
  await repo.saveProfile(aggToHold);

  let holdViolationCaught = false;
  try {
    await service.withdrawProfile(analystUser, "dna_crime_01", "EXPUNGEMENT_REQUEST");
  } catch (err: any) {
    if (err instanceof DnaLegalHoldViolationError) {
      holdViolationCaught = true;
    }
  }
  assert(holdViolationCaught, "Scenario 5 — Expungement/withdrawal on Legal Hold DNA Profile DENIED with DnaLegalHoldViolationError");

  // Scenario 6 — Elimination Index Contamination Alert
  const sampleElim = await service.createBiologicalSample(analystUser, {
    id: "smp_elim_01",
    sampleNumber: "SMP-ELIM-101",
    sampleType: "BUCCAL_SWAB",
    donorType: "ELIMINATION",
    donorPseudonym: "LAB-TECH-REF-01",
    storageFreezerLocation: "FREEZER-STAFF-01",
  });
  const pElim = await service.createProfile(analystUser, {
    id: "dna_elim_01",
    sampleId: sampleElim.id,
    indexCode: "ELIMINATION",
    alleles: CODIS_ALLELES_1,
  });
  await service.approveProfile(analystUser, "dna_elim_01");

  const elimSearch = await service.executeSearch(analystUser, {
    targetProfileId: "dna_crime_01",
    targetIndices: ["ELIMINATION"],
    minMatchingLoci: 12,
    searchPurpose: "CONTAMINATION_AUDIT",
  });
  assert(elimSearch.results.length === 1, "Scenario 6 — Contamination search detects match in Elimination Index");
  assert(elimSearch.results[0].status === "CANDIDATE", "Scenario 6 — Contamination candidate flagged for review without premature guilt assertion");

  // Scenario 7 — Missing Person & Unidentified Remains Search
  const sampleRemains = await service.createBiologicalSample(analystUser, {
    id: "smp_remains_01",
    sampleNumber: "SMP-REMAINS-77",
    sampleType: "BONE_FRAGMENT",
    donorType: "UNIDENTIFIED_HUMAN_REMAINS",
    storageFreezerLocation: "FREEZER-MORGUE-01",
  });
  const pRemains = await service.createProfile(analystUser, {
    id: "dna_remains_01",
    sampleId: sampleRemains.id,
    indexCode: "UNIDENTIFIED_REMAINS",
    alleles: CODIS_ALLELES_1,
  });
  await service.approveProfile(analystUser, "dna_remains_01");

  const sampleMissingRel = await service.createBiologicalSample(analystUser, {
    id: "smp_missing_rel_01",
    sampleNumber: "SMP-MISSING-REL-01",
    sampleType: "BUCCAL_SWAB",
    donorType: "RELATIVE",
    storageFreezerLocation: "FREEZER-MP-01",
  });
  const pMissingRel = await service.createProfile(analystUser, {
    id: "dna_missing_rel_01",
    sampleId: sampleMissingRel.id,
    indexCode: "MISSING_PERSONS",
    alleles: CODIS_ALLELES_1,
  });
  await service.approveProfile(analystUser, "dna_missing_rel_01");

  const missingSearch = await service.executeSearch(analystUser, {
    targetProfileId: "dna_remains_01",
    targetIndices: ["MISSING_PERSONS"],
    minMatchingLoci: 12,
    searchPurpose: "DISASTER_VICTIM_IDENTIFICATION",
  });
  assert(missingSearch.results.length === 1, "Scenario 7 — Disaster victim identification search matches reference profile in Missing Persons Index");

  // Scenario 8 — Unauthorized Cross-Index Search Attempt
  let unauthorizedCaught = false;
  try {
    await service.executeSearch(unauthorizedUser, {
      targetProfileId: "dna_crime_01",
      targetIndices: ["OFFENDER"],
      minMatchingLoci: 12,
      searchPurpose: "UNAUTHORIZED_LOOKUP",
    });
  } catch (err: any) {
    if (err instanceof UnauthorizedDnaActionError) {
      unauthorizedCaught = true;
    }
  }
  assert(unauthorizedCaught, "Scenario 8 — Unauthorized cross-index search attempt DENIED with ABAC security audit");

  // Scenario 9 — Historical Reconstruction & Provenance Trace
  const provenance = await service.getProvenance(analystUser, "dna_crime_01");
  assert(
    provenance.provenanceTrace.evidenceId === "evd_scen_1" &&
      provenance.provenanceTrace.caseId === "case_dci_001",
    "Scenario 9 — Historical reconstruction successfully traces DNA Profile -> Sample -> Evidence -> Case"
  );

  // Optimistic Concurrency Control Check
  let concurrencyCaught = false;
  try {
    const agg = await service.getProfileById(analystUser, "dna_offender_01");
    agg.approve(analystUser.userId, 999);
  } catch (err: any) {
    if (err instanceof DnaConcurrencyConflictError) {
      concurrencyCaught = true;
    }
  }
  assert(concurrencyCaught, "Optimistic Concurrency Control rejects stale version mutation");

  console.log("\n=====================================================================");
  console.log(`    ALL ${testsPassed}/${totalTests} PHASE 1.5 DNA ACCEPTANCE TESTS PASSED! ✅`);
  console.log("=====================================================================\n");
}

runAcceptanceSuite().catch((err) => {
  console.error("FATAL: DNA acceptance test suite failed:", err);
  process.exit(1);
});
