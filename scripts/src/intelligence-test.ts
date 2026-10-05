import {
  IntelligenceService,
  InMemoryIntelligenceRepository,
  IntelligenceAuthorizationError,
  IntelligenceSeparationOfDutiesError,
  IntelligenceInvalidStateTransitionError,
  IntelligenceUserContext,
  IntelligenceNumberGenerator,
} from "@workspace/intelligence-domain";

async function runIntelligenceAcceptanceTests() {
  console.log("=========================================================");
  console.log("KFIN PHASE 1.7 — CROSS-CASE INTELLIGENCE & LINK ANALYSIS");
  console.log("ACCEPTANCE & SECURITY VERIFICATION SUITE");
  console.log("=========================================================\n");

  const repo = new InMemoryIntelligenceRepository();
  const service = new IntelligenceService(repo);

  const analystContext: IntelligenceUserContext = {
    userId: "usr_analyst_01",
    userRole: "INVESTIGATOR",
    organizationId: "org_nphl_lab",
    clearanceLevel: "HIGHLY_RESTRICTED",
    permissions: [
      "intelligence:read",
      "intelligence:create",
      "intelligence:lead_manage",
      "intelligence:graph_traverse",
      "intelligence:case_link",
      "intelligence:export",
    ],
  };

  const externalUserContext: IntelligenceUserContext = {
    userId: "usr_dci_02",
    userRole: "INVESTIGATOR",
    organizationId: "org_dci_hq",
    clearanceLevel: "CONFIDENTIAL",
    permissions: [
      "intelligence:read",
      "intelligence:create",
      "intelligence:graph_traverse",
    ],
  };

  const unprivilegedUserContext: IntelligenceUserContext = {
    userId: "usr_unprivileged",
    userRole: "EVIDENCE_CUSTODIAN",
    organizationId: "org_nphl_lab",
    clearanceLevel: "INTERNAL",
    permissions: ["evidence:read"],
  };

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Numbering Generators
  console.log("--- TEST SUITE 1: Numbering Generators ---");
  const relNum = IntelligenceNumberGenerator.generateRelationshipNumber({ organizationPrefix: "NPHL" });
  assert(relNum.startsWith("KFIN-REL-SYN-NPHL-"), "Relationship number format (KFIN-REL-SYN-NPHL-...)");

  const obsNum = IntelligenceNumberGenerator.generateObservationNumber({ organizationPrefix: "NPHL" });
  assert(obsNum.startsWith("KFIN-OBS-SYN-NPHL-"), "Observation number format (KFIN-OBS-SYN-NPHL-...)");

  const leadNum = IntelligenceNumberGenerator.generateLeadNumber({ organizationPrefix: "NPHL" });
  assert(leadNum.startsWith("KFIN-LEAD-SYN-NPHL-"), "Lead number format (KFIN-LEAD-SYN-NPHL-...)");

  const anaNum = IntelligenceNumberGenerator.generateAnalysisNumber({ organizationPrefix: "NPHL" });
  assert(anaNum.startsWith("KFIN-LNK-SYN-NPHL-"), "Analysis number format (KFIN-LNK-SYN-NPHL-...)");

  // 2. Forensic Relationship Creation & Provenance
  console.log("\n--- TEST SUITE 2: Forensic Relationship Creation & Provenance ---");
  const rel1 = await service.createRelationship(
    {
      sourceEntityType: "CASE",
      sourceEntityId: "case_2026_001",
      targetEntityType: "EVIDENCE",
      targetEntityId: "evd_2026_101",
      relationshipType: "RECOVERED_FROM",
      relationshipClass: "FACT",
      provenanceSource: "SCENE_EXHIBIT_LOG",
    },
    analystContext
  );
  assert(rel1.id !== undefined && rel1.status === "ACTIVE", "Create FACT relationship Case -> Evidence");
  assert(rel1.relationshipClass === "FACT", "Relationship class is FACT");

  const rel2 = await service.createRelationship(
    {
      sourceEntityType: "EVIDENCE",
      sourceEntityId: "evd_2026_101",
      targetEntityType: "DNA_PROFILE",
      targetEntityId: "dna_2026_prof1",
      relationshipType: "PRODUCED_PROFILE",
      relationshipClass: "CONFIRMED_FORENSIC_RELATIONSHIP",
      provenanceSource: "LAB_STR_PROFILE_ANALYSIS",
    },
    analystContext
  );
  assert(rel2.relationshipClass === "CONFIRMED_FORENSIC_RELATIONSHIP", "Create CONFIRMED_FORENSIC_RELATIONSHIP");

  const rel3 = await service.createRelationship(
    {
      sourceEntityType: "DNA_PROFILE",
      sourceEntityId: "dna_2026_prof1",
      targetEntityType: "CASE",
      targetEntityId: "case_2026_002",
      relationshipType: "MATCHED_TO",
      relationshipClass: "ANALYTICAL_RELATIONSHIP",
      provenanceSource: "NATIONAL_DNA_INDEX_SEARCH",
      organizationId: "org_dci_hq", // Different org case
    },
    analystContext
  );
  assert(rel3.relationshipClass === "ANALYTICAL_RELATIONSHIP", "Create ANALYTICAL_RELATIONSHIP across cases");

  // 3. Authorization Access Gating
  console.log("\n--- TEST SUITE 3: Authorization Access Gating ---");
  try {
    await service.createRelationship(
      {
        sourceEntityType: "PERSON",
        sourceEntityId: "prs_001",
        targetEntityType: "CASE",
        targetEntityId: "case_2026_001",
        relationshipType: "SUSPECT_IN",
        relationshipClass: "HYPOTHESIS",
        provenanceSource: "ANONYMOUS_TIP",
      },
      unprivilegedUserContext
    );
    assert(false, "Unprivileged user created relationship (Should have failed)");
  } catch (err: any) {
    assert(err instanceof IntelligenceAuthorizationError, "Unprivileged user blocked from creating relationship");
  }

  // 4. Intelligence Observations & Lead Lifecycle
  console.log("\n--- TEST SUITE 4: Intelligence Observations & Lead Lifecycle ---");
  const obs = await service.recordObservation(
    {
      title: "Cross-case DNA STR Match Observation",
      description: "DNA profile from Exhibit EVD-101 matched crime scene sample in Case 002 with LR = 1.45e9",
      rationale: "Matches national CODIS STR database search",
      relatedEntities: [
        { entityType: "CASE", entityId: "case_2026_001", label: "Nairobi Burglary 2026-001" },
        { entityType: "CASE", entityId: "case_2026_002", label: "Mombasa Theft 2026-002" },
      ],
    },
    analystContext
  );
  assert(obs.observationNumber.startsWith("KFIN-OBS-"), "Recorded observation successfully");

  const lead = await service.createLead(
    {
      observationId: obs.id,
      title: "Investigate Serial Burglary Link Nairobi-Mombasa",
      rationale: "High DNA LR match between exhibit profiles",
      priority: "CRITICAL",
    },
    analystContext
  );
  assert(lead.status === "NEW" && lead.priority === "CRITICAL", "Created CRITICAL intelligence lead in status NEW");

  const assignedLead = await service.assignLead(lead.id, "usr_investigator_99", "org_nphl_lab", analystContext);
  assert(assignedLead.status === "ASSIGNED" && assignedLead.assignedInvestigatorId === "usr_investigator_99", "Assigned lead to investigator");

  // 5. Separation of Duties (SoD) Checks
  console.log("\n--- TEST SUITE 5: Separation of Duties (SoD) Checks ---");
  const assignedInvestigatorContext: IntelligenceUserContext = {
    userId: "usr_investigator_99",
    userRole: "INVESTIGATOR",
    organizationId: "org_nphl_lab",
    clearanceLevel: "HIGHLY_RESTRICTED",
    permissions: ["intelligence:lead_manage", "intelligence:case_link"],
  };

  // Start review first to put in UNDER_REVIEW state
  const leadAggregate = (await repo.findLeadById(lead.id))!;
  leadAggregate.status = "UNDER_REVIEW";
  await repo.saveLead(leadAggregate);

  try {
    await service.reviewLead(lead.id, "CONFIRMED", "Self confirmation test", assignedInvestigatorContext);
    assert(false, "Assigned investigator confirmed lead without independent review (Should fail SoD)");
  } catch (err: any) {
    assert(err instanceof IntelligenceSeparationOfDutiesError, "Assigned investigator blocked from self-confirming lead (SoD enforced)");
  }

  // Independent reviewer confirms lead
  const confirmedLead = await service.reviewLead(lead.id, "CONFIRMED", "Verified matching DNA profiles independently", analystContext);
  assert(confirmedLead.status === "CONFIRMED" && confirmedLead.reviewedById === "usr_analyst_01", "Independent reviewer confirmed lead");

  // 6. Link Analysis Graph Execution & Traversal Depth
  console.log("\n--- TEST SUITE 6: Link Analysis Graph Execution & Traversal Depth ---");
  const graphDepth1 = await service.executeLinkAnalysis(
    {
      rootEntityType: "CASE",
      rootEntityId: "case_2026_001",
      maxDepth: 1,
    },
    analystContext
  );
  assert(graphDepth1.resultSummary.nodes.length >= 2, "Depth 1 graph returns direct connected nodes");
  assert(graphDepth1.maxDepth === 1, "Max depth 1 strictly respected");

  const graphDepth3 = await service.executeLinkAnalysis(
    {
      rootEntityType: "CASE",
      rootEntityId: "case_2026_001",
      maxDepth: 3,
    },
    analystContext
  );
  assert(graphDepth3.resultSummary.nodes.length >= 3, "Depth 3 graph traverses multi-step cross-case network");

  // 7. Cross-Organization Minimum Necessary Disclosure
  console.log("\n--- TEST SUITE 7: Cross-Organization Minimum Necessary Disclosure ---");
  const externalGraph = await service.executeLinkAnalysis(
    {
      rootEntityType: "CASE",
      rootEntityId: "case_2026_001",
      maxDepth: 3,
    },
    externalUserContext
  );
  const redactedNode = externalGraph.resultSummary.nodes.find((n) => n.isRedacted);
  assert(redactedNode !== undefined, "Cross-org node masked/redacted for unauthorized external viewer");
  if (redactedNode) {
    assert(redactedNode.label.includes("[RESTRICTED"), "Redacted node label follows minimum necessary disclosure format");
  }

  // 8. Case Link Operations & State Machine
  console.log("\n--- TEST SUITE 8: Case Link Operations & State Machine ---");
  const caseLink = await service.proposeCaseLink(
    {
      sourceCaseId: "case_2026_001",
      targetCaseId: "case_2026_002",
      linkType: "COMMON_BIOLOGICAL_EXHIBIT",
      rationale: "DNA profile from Exhibit 101 matched Exhibit 201 across cases",
    },
    analystContext
  );
  assert(caseLink.status === "PROPOSED", "Proposed case link between Case 001 and Case 002");

  // SoD: Proposer cannot approve their own case link
  try {
    await service.reviewCaseLink(caseLink.id, "CONFIRMED", analystContext.userId, analystContext);
    assert(false, "Proposer approved their own case link (Should fail SoD)");
  } catch (err: any) {
    assert(err instanceof IntelligenceSeparationOfDutiesError, "Proposer blocked from confirming own case link (SoD enforced)");
  }

  const supervisorContext: IntelligenceUserContext = {
    userId: "usr_supervisor_01",
    userRole: "CASE_MANAGER",
    organizationId: "org_nphl_lab",
    clearanceLevel: "HIGHLY_RESTRICTED",
    permissions: ["intelligence:case_link", "intelligence:read"],
  };

  const confirmedCaseLink = await service.reviewCaseLink(
    caseLink.id,
    "CONFIRMED",
    analystContext.userId,
    supervisorContext
  );
  assert(confirmedCaseLink.status === "CONFIRMED", "Supervisor confirmed case link");

  // 9. Person Entity Resolution Candidates
  console.log("\n--- TEST SUITE 9: Person Entity Resolution Candidates ---");
  const personCand = await service.evaluatePersonResolutionCandidate(
    {
      personAId: "prs_john_doe_01",
      personBId: "prs_jonathan_doe_02",
      similarityScore: "0.94",
      matchingFactors: [
        { factorName: "FULL_NAME", matchDetail: "Levenshtein distance = 2" },
        { factorName: "NATIONAL_ID", matchDetail: "Exact national ID match 33445566" },
      ],
    },
    analystContext
  );
  assert(personCand.status === "CANDIDATE", "Created duplicate person resolution candidate");

  const resolvedCand = await service.resolvePersonCandidate(personCand.id, "MERGED", analystContext);
  assert(resolvedCand.status === "MERGED" && resolvedCand.reviewedById === "usr_analyst_01", "Resolved candidate to MERGED after human review");

  // 10. Verification Summary
  console.log("\n=========================================================");
  console.log(`TOTAL TESTS EXECUTED : ${passed + failed}`);
  console.log(`PASSED               : ${passed}`);
  console.log(`FAILED               : ${failed}`);
  console.log("=========================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runIntelligenceAcceptanceTests().catch((err) => {
  console.error("FATAL ERROR in intelligence test suite:", err);
  process.exit(1);
});
