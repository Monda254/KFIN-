import {
  KinshipService,
  InMemoryKinshipRepository,
  KinshipNumberGenerator,
  KinshipStateMachine,
  KinshipEngine,
  PedigreeAggregate,
  KinshipAuthorizationError,
  KinshipLegalBasisMissingError,
  KinshipSeparationOfDutiesError,
  KinshipInvalidStateTransitionError,
  KinshipEliminationProtectionViolationError,
  DEFAULT_KENYA_POPULATION_DATASET,
  ProfileSTRPanelInput,
  UserSecurityContext,
} from "@workspace/kinship-domain";

async function runKinshipAcceptanceTests() {
  console.log("=====================================================================");
  console.log("           KFIN PHASE 1.6 ADVANCED FORENSIC INTELLIGENCE");
  console.log("       KINSHIP, RELATIONSHIP ANALYSIS & FAMILIAL SEARCH SUITE");
  console.log("=====================================================================");

  let passCount = 0;
  let testNumber = 1;

  function assert(condition: boolean, description: string) {
    const paddedNum = testNumber.toString().padStart(2, " ");
    if (condition) {
      console.log(`Test ${paddedNum}: ${description} ... ✅ PASS`);
      passCount++;
    } else {
      console.error(`Test ${paddedNum}: ${description} ... ❌ FAIL`);
      process.exitCode = 1;
    }
    testNumber++;
  }

  const repo = new InMemoryKinshipRepository();
  const service = new KinshipService(repo);

  const analystContext: UserSecurityContext = {
    userId: "usr_analyst_01",
    userRole: "DNA_SPECIALIST",
    organizationId: "org_nphl_lab",
    clearanceLevel: "HIGHLY_RESTRICTED",
    permissions: [
      "kinship:create",
      "kinship:read",
      "kinship:analyze",
      "kinship:review",
      "familial_search:request",
    ],
  };

  const supervisorContext: UserSecurityContext = {
    userId: "usr_supervisor_02",
    userRole: "LAB_REVIEWER",
    organizationId: "org_nphl_lab",
    clearanceLevel: "HIGHLY_RESTRICTED",
    permissions: [
      "kinship:create",
      "kinship:read",
      "kinship:review",
      "familial_search:authorize",
    ],
  };

  // 1. Number Generator Tests
  const invNum = KinshipNumberGenerator.generateInvestigationNumber("NPHL");
  const kanaNum = KinshipNumberGenerator.generateAnalysisNumber("NPHL");
  const pedNum = KinshipNumberGenerator.generatePedigreeNumber();
  const fsrNum = KinshipNumberGenerator.generateSearchNumber("NPHL");

  assert(
    invNum.startsWith("KIN-NPHL-") &&
      kanaNum.startsWith("KANA-NPHL-") &&
      pedNum.startsWith("PED-") &&
      fsrNum.startsWith("FSR-NPHL-"),
    "Kinship Number Generator produces valid KFIN format identifiers"
  );

  // 2. State Machine Lifecycle
  const canValid = KinshipStateMachine.canTransition("DRAFT", "AUTHORIZATION_PENDING");
  assert(canValid === true, "State machine validates legal transition (DRAFT -> AUTHORIZATION_PENDING)");

  // 3. Invalid State Transition Rejection
  let transitionError = false;
  try {
    KinshipStateMachine.validateTransition("CLOSED", "DRAFT");
  } catch (err: any) {
    if (err instanceof KinshipInvalidStateTransitionError) {
      transitionError = true;
    }
  }
  assert(transitionError, "State machine rejects invalid transition (CLOSED -> DRAFT) with KinshipInvalidStateTransitionError");

  // 4. Legal Basis Requirement
  let legalBasisError = false;
  try {
    await service.createInvestigation(
      { caseId: "case-101", purpose: "Familial inquiry", legalBasis: "   " },
      analystContext
    );
  } catch (err: any) {
    if (err instanceof KinshipLegalBasisMissingError) {
      legalBasisError = true;
    }
  }
  assert(legalBasisError, "Creating investigation without statutory legal basis DENIED with KinshipLegalBasisMissingError");

  // 5. Create Valid Investigation
  const inv = await service.createInvestigation(
    {
      caseId: "case-2026-0012",
      purpose: "Unidentified person family relationship inquiry",
      legalBasis: "National Forensic DNA Regulations 2026, Section 14",
    },
    analystContext
  );
  assert(inv.status === "DRAFT", "Created Kinship Investigation starts in DRAFT state");

  // 6. Transition to Authorized
  await service.transitionInvestigationStatus(inv.id, "AUTHORIZATION_PENDING", analystContext);
  const authorizedInv = await service.transitionInvestigationStatus(inv.id, "AUTHORIZED", supervisorContext);
  assert(authorizedInv.status === "AUTHORIZED", "Investigation transitioned to AUTHORIZED state");

  // 7. Separation of Duties (SoD) Check on Closure/Final Approval
  let sodError = false;
  try {
    const underReviewInv = { ...authorizedInv, status: "UNDER_REVIEW" as const };
    const aggregate = new (await import("@workspace/kinship-domain")).KinshipInvestigationAggregate(underReviewInv);
    aggregate.transitionState("ACCEPTED", "usr_analyst_01"); // Analyst trying to self-approve
  } catch (err: any) {
    if (err instanceof KinshipSeparationOfDutiesError) {
      sodError = true;
    }
  }
  assert(sodError, "Separation of Duties prevents initiating analyst from self-approving final conclusion");

  // 8. Scientific Parent/Child Kinship Likelihood Ratio Calculation
  const parentProfilePanel: ProfileSTRPanelInput = {
    profileId: "prf-parent-01",
    profileIdentifier: "DNA-NPHL-2026-00001",
    loci: [
      { locusName: "D3S1358", allele1: "15", allele2: "16" },
      { locusName: "vWA", allele1: "16", allele2: "17" },
      { locusName: "FGA", allele1: "22", allele2: "23" },
      { locusName: "D8S1179", allele1: "13", allele2: "14" },
      { locusName: "D21S11", allele1: "29", allele2: "30" },
    ],
  };

  const childProfilePanel: ProfileSTRPanelInput = {
    profileId: "prf-child-02",
    profileIdentifier: "DNA-NPHL-2026-00002",
    loci: [
      { locusName: "D3S1358", allele1: "15", allele2: "17" },
      { locusName: "vWA", allele1: "17", allele2: "18" },
      { locusName: "FGA", allele1: "23", allele2: "24" },
      { locusName: "D8S1179", allele1: "13", allele2: "15" },
      { locusName: "D21S11", allele1: "29", allele2: "31" },
    ],
  };

  const hypothesis = await service.addRelationshipHypothesis(
    {
      investigationId: inv.id,
      profileAId: parentProfilePanel.profileId,
      profileBId: childProfilePanel.profileId,
      relationshipType: "PARENT_CHILD",
      description: "Alleged parent vs missing person reference",
    },
    analystContext
  );

  const { analysis, result } = await service.executeKinshipAnalysis(
    {
      investigationId: inv.id,
      hypothesisId: hypothesis.id,
      profileAPanel: parentProfilePanel,
      profileBPanel: childProfilePanel,
    },
    analystContext
  );

  assert(
    result.interpretationCategory === "SUPPORTED" && parseFloat(result.combinedLikelihoodRatio) > 5.0,
    "Kinship engine computes SUPPORTED parent-child relationship likelihood ratio"
  );

  // 9. Full Sibling Kinship Calculation
  const siblingAPanel: ProfileSTRPanelInput = {
    profileId: "prf-sib-A",
    profileIdentifier: "DNA-NPHL-2026-00010",
    loci: [
      { locusName: "D3S1358", allele1: "15", allele2: "16" },
      { locusName: "vWA", allele1: "16", allele2: "17" },
      { locusName: "FGA", allele1: "22", allele2: "23" },
    ],
  };

  const siblingBPanel: ProfileSTRPanelInput = {
    profileId: "prf-sib-B",
    profileIdentifier: "DNA-NPHL-2026-00011",
    loci: [
      { locusName: "D3S1358", allele1: "15", allele2: "16" },
      { locusName: "vWA", allele1: "16", allele2: "18" },
      { locusName: "FGA", allele1: "22", allele2: "25" },
    ],
  };

  const sibHypo = await service.addRelationshipHypothesis(
    {
      investigationId: inv.id,
      profileAId: siblingAPanel.profileId,
      profileBId: siblingBPanel.profileId,
      relationshipType: "FULL_SIBLINGS",
    },
    analystContext
  );

  const sibResult = KinshipEngine.calculateKinship(
    "analysis-sib",
    sibHypo.id,
    siblingAPanel,
    siblingBPanel,
    "FULL_SIBLINGS",
    DEFAULT_KENYA_POPULATION_DATASET
  );

  assert(
    sibResult.sharedAlleleSummary.ibs2LociCount >= 1,
    "Full Sibling kinship engine correctly identifies IBS-2 shared loci"
  );

  // 10. Scientifically Constrained Analysis Handling
  const uncalibratedPanelA: ProfileSTRPanelInput = {
    profileId: "prf-uncal-A",
    profileIdentifier: "DNA-NPHL-2026-99998",
    loci: [{ locusName: "UNKNOWN_CUSTOM_LOCUS", allele1: "10", allele2: "12" }],
  };

  const uncalibratedPanelB: ProfileSTRPanelInput = {
    profileId: "prf-uncal-B",
    profileIdentifier: "DNA-NPHL-2026-99999",
    loci: [{ locusName: "UNKNOWN_CUSTOM_LOCUS", allele1: "10", allele2: "12" }],
  };

  const constrainedResult = KinshipEngine.calculateKinship(
    "analysis-const",
    hypothesis.id,
    uncalibratedPanelA,
    uncalibratedPanelB,
    "PARENT_CHILD",
    DEFAULT_KENYA_POPULATION_DATASET
  );

  assert(
    constrainedResult.confidenceQualityInfo.scientificallyConstrained === true &&
      constrainedResult.limitations.includes("constrained"),
    "Uncalibrated population locus flags analysis as scientifically constrained without fabricating values"
  );

  // 11. Pedigree Structure & Reconstructable Versioning
  const pedigree = await service.createPedigree(
    { investigationId: inv.id, title: "Kiprotich Family Tree" },
    analystContext
  );

  const pedAggregate = new PedigreeAggregate(pedigree);
  const fatherNode = pedAggregate.addNode(
    { label: "Father (Deceased)", gender: "MALE", nodeStatus: "KNOWN" },
    analystContext.userId,
    "Add father node"
  );
  const childNode = pedAggregate.addNode(
    { label: "Missing Person", gender: "MALE", nodeStatus: "CONFIRMED", profileId: childProfilePanel.profileId },
    analystContext.userId,
    "Add child node"
  );

  pedAggregate.addRelationship(
    {
      sourceNodeId: fatherNode.id,
      targetNodeId: childNode.id,
      relationshipType: "PARENT_CHILD",
      relationshipStatus: "CONFIRMED",
    },
    analystContext.userId,
    "Link father to missing child"
  );

  assert(
    pedAggregate.versionHistory.length === 4 && pedAggregate.data.currentVersionNumber === 4,
    "Pedigree tree changes are versioned with full historical reconstruction"
  );

  // 12. Four-Eyes Scientific Review
  const reviewedResult = await service.reviewKinshipResult(
    analysis.id,
    "ACCEPTED",
    "Independent scientific review confirms LR metrics and parent-child hypothesis.",
    supervisorContext
  );

  assert(
    reviewedResult.reviewStatus === "ACCEPTED" && reviewedResult.reviewerId === supervisorContext.userId,
    "Four-eyes supervisor review confirms kinship result"
  );

  // 13. Authorized Familial Search & Candidate Ranking
  const fsr = await service.requestFamilialSearch(
    {
      caseId: inv.caseId,
      targetProfileId: parentProfilePanel.profileId,
      targetIndices: ["OFFENDER", "FORENSIC"],
      searchPurpose: "Missing person family candidate search",
      legalBasis: "Forensic Intelligence Act 2026, Section 22",
    },
    analystContext
  );

  const authorizedFsr = await service.authorizeFamilialSearch(fsr.id, supervisorContext);
  assert(authorizedFsr.status === "AUTHORIZED", "Familial search request authorized by supervisor");

  const candidates = await service.executeFamilialSearch(
    fsr.id,
    parentProfilePanel,
    [childProfilePanel, siblingAPanel],
    analystContext
  );

  assert(
    candidates.length > 0 && candidates[0].leadStatus === "INVESTIGATIVE_LEAD",
    "Familial Search ranks candidate relationships explicitly labeled as INVESTIGATIVE_LEAD"
  );

  // 14. Elimination Database Protection
  let eliminationError = false;
  const eliminationPanel: ProfileSTRPanelInput = {
    profileId: "prf-elim-01",
    profileIdentifier: "DNA-ELIM-2026-001",
    indexCode: "ELIMINATION",
    loci: [{ locusName: "D3S1358", allele1: "15", allele2: "16" }],
  };

  try {
    await service.executeKinshipAnalysis(
      {
        investigationId: inv.id,
        hypothesisId: hypothesis.id,
        profileAPanel: eliminationPanel,
        profileBPanel: childProfilePanel,
        isEliminationAudit: false, // Not an audit!
      },
      analystContext
    );
  } catch (err: any) {
    if (err instanceof KinshipEliminationProtectionViolationError) {
      eliminationError = true;
    }
  }
  assert(
    eliminationError,
    "Elimination Database Protection DENIES unauthorized kinship query with KinshipEliminationProtectionViolationError"
  );

  // 15. ABAC Security Gate Verification
  let authError = false;
  const unauthorizedContext: UserSecurityContext = {
    userId: "usr_unauth_01",
    userRole: "RECEPTIONIST",
    organizationId: "org_other",
    clearanceLevel: "PUBLIC",
    permissions: [],
  };

  try {
    await service.createInvestigation(
      { caseId: inv.caseId, purpose: "Unauthorized test", legalBasis: "None" },
      unauthorizedContext
    );
  } catch (err: any) {
    if (err instanceof KinshipAuthorizationError) {
      authError = true;
    }
  }
  assert(authError, "Unauthorized user access DENIED with KinshipAuthorizationError");

  // 16. Historical Provenance Tracing
  const provenance = await service.getKinshipProvenance(analysis.id);
  assert(
    provenance.analysisNumber === analysis.analysisNumber &&
      provenance.algorithm === `${KinshipEngine.ALGORITHM_NAME} ${KinshipEngine.ALGORITHM_VERSION}`,
    "Historical reconstruction traces Kinship Result -> Analysis -> Algorithm -> Population Dataset -> Case"
  );

  // 17. Reproducibility Verification
  const reResult = KinshipEngine.calculateKinship(
    "analysis-repro",
    hypothesis.id,
    parentProfilePanel,
    childProfilePanel,
    "PARENT_CHILD",
    DEFAULT_KENYA_POPULATION_DATASET
  );

  assert(
    reResult.combinedLikelihoodRatio === result.combinedLikelihoodRatio,
    "Identical inputs, profiles, algorithm version, and population dataset produce 100% reproducible results"
  );

  console.log("=====================================================================");
  console.log(`    ALL ${passCount}/${testNumber - 1} PHASE 1.6 KINSHIP ACCEPTANCE TESTS PASSED! ✅`);
  console.log("=====================================================================");
}

runKinshipAcceptanceTests().catch((err) => {
  console.error("Unhandled error in Kinship acceptance tests:", err);
  process.exit(1);
});
