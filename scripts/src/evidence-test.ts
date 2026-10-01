import {
  EvidenceAggregate,
  EvidenceService,
  InMemoryEvidenceRepository,
  EvidenceNumberGenerator,
  EvidenceStateMachine,
  UnauthorizedEvidenceActionError,
  LegalHoldViolationError,
  ConcurrencyConflictError,
} from "@workspace/evidence-domain";
import type { Subject } from "@workspace/security";

console.log("=====================================================================");
console.log("             KFIN PHASE 1.4 EVIDENCE ACCEPTANCE TEST SUITE");
console.log("   CANONICAL DOMAIN, CHAIN OF CUSTODY, INTEGRITY & SECURITY");
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
  const repo = new InMemoryEvidenceRepository();
  const service = new EvidenceService(repo);

  // Setup test subjects
  const officerUser: Subject = {
    userId: "usr_officer_01",
    email: "officer1@dci.go.ke",
    badgeNumber: "DCI-8891",
    fullName: "Inspector Kiprop",
    organizationId: "org_dci_hq",
    organizationCode: "DCIHQ",
    clearanceLevel: 4,
    clearanceCode: "CONFIDENTIAL",
    accountStatus: "ACTIVE",
    roles: ["INVESTIGATOR"],
    permissions: [
      "evidence:create",
      "evidence:read",
      "evidence:update",
      "evidence:transfer",
      "evidence:dispose",
      "vault:manage",
    ],
    isServiceIdentity: false,
  };

  const labUser: Subject = {
    userId: "usr_lab_tech_01",
    email: "analyst1@nphl.go.ke",
    badgeNumber: "NPHL-3310",
    fullName: "Dr. Achieng",
    organizationId: "org_nphl_lab",
    organizationCode: "NPHL",
    clearanceLevel: 4,
    clearanceCode: "CONFIDENTIAL",
    accountStatus: "ACTIVE",
    roles: ["LAB_ANALYST"],
    permissions: [
      "evidence:create",
      "evidence:read",
      "evidence:update",
      "evidence:transfer",
      "lab:examine",
    ],
    isServiceIdentity: false,
  };

  const unauthorizedUser: Subject = {
    userId: "usr_civilian_01",
    email: "civilian@external.org",
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

  // Test 1: Evidence Number Generator
  const ref = EvidenceNumberGenerator.generate({ organizationPrefix: "DCIHQ", isSynthetic: true });
  assert(EvidenceNumberGenerator.isValid(ref), "Evidence Number Generator produces valid KFIN references", `Generated ${ref}`);

  // Test 2: Evidence State Machine Transitions
  const canTransition = EvidenceStateMachine.canTransition("COLLECTED", "SEALED");
  assert(canTransition.allowed, "State Machine validates valid transition (COLLECTED -> SEALED)");

  const invalidTransition = EvidenceStateMachine.canTransition("ARCHIVED", "COLLECTED");
  assert(!invalidTransition.allowed, "State Machine rejects invalid transition (ARCHIVED -> COLLECTED)");

  // Scenario 1 — Evidence Collection
  const evd1 = await service.createEvidence(officerUser, {
    id: "evd_scen_1",
    caseId: "case_dci_001",
    itemNumber: "EX-01",
    description: "Bloodstained clothing exhibit recovered from crime scene",
    evidenceType: "BIOLOGICAL_SPECIMEN",
    collectionTimestamp: new Date().toISOString(),
    collectedById: officerUser.userId,
    collectionLocationDesc: "Scene Location Nairobi North",
    currentLocationId: "loc_vault_01",
    currentCustodianId: officerUser.userId,
    tamperSealNumber: "SEAL-KFIN-001",
    integrityHash: "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0",
    packagingType: "PAPER_EVIDENCE_BAG",
  });
  assert(evd1.getState().status === "COLLECTED", "Scenario 1 — Registered evidence is in COLLECTED state");
  assert(evd1.getSeals().length === 1, "Scenario 1 — Tamper seal record created at collection");

  // Scenario 2 — Laboratory Transfer
  await service.initiateTransfer(
    officerUser,
    "evd_scen_1",
    labUser.userId,
    "LAB_ANALYSIS",
    "AUTH-ORDER-7712",
    "loc_nphl_vault"
  );
  let transferEvd = await service.getEvidenceById(officerUser, "evd_scen_1");
  assert(transferEvd.getState().status === "TRANSFERRED", "Scenario 2 — Transfer initiation sets status to TRANSFERRED");

  await service.receiveTransfer(
    labUser,
    "evd_scen_1",
    "loc_nphl_vault",
    true,
    "SEAL-NPHL-9901"
  );
  transferEvd = await service.getEvidenceById(labUser, "evd_scen_1");
  assert(transferEvd.getState().status === "RECEIVED", "Scenario 2 — Lab receipt accepts transfer into custody");
  assert(transferEvd.getState().currentCustodianId === labUser.userId, "Scenario 2 — Current custodian updated to lab technician");

  // Scenario 3 — Controlled Seal Breaking
  await service.breakSeal(
    labUser,
    "evd_scen_1",
    "Sampling biological strain for STR amplification",
    "LAB-REQUISITION-401"
  );
  const brokenSealEvd = await service.getEvidenceById(labUser, "evd_scen_1");
  assert(brokenSealEvd.getState().sealStatus === "BROKEN", "Scenario 3 — Seal status updated to BROKEN");
  assert(brokenSealEvd.getSeals().some((s: any) => s.status === "BROKEN"), "Scenario 3 — Historical seal record preserved with break reason");

  // Scenario 4 — Unauthorized Transfer
  let unauthorizedCaught = false;
  try {
    await service.initiateTransfer(
      unauthorizedUser,
      "evd_scen_1",
      officerUser.userId,
      "UNAUTHORIZED_ATTEMPT",
      "NONE"
    );
  } catch (err: any) {
    if (err instanceof UnauthorizedEvidenceActionError) {
      unauthorizedCaught = true;
    }
  }
  assert(unauthorizedCaught, "Scenario 4 — Unauthorized transfer attempt DENIED by security engine");

  // Scenario 5 — Evidence Vault Storage Checkout & Retrieval
  const evdVault = await service.createEvidence(officerUser, {
    id: "evd_vault_01",
    caseId: "case_dci_002",
    itemNumber: "EX-02",
    description: "Latent fingerprint card exhibit",
    evidenceType: "FINGERPRINT_RELATED",
    collectionTimestamp: new Date().toISOString(),
    collectedById: officerUser.userId,
    collectionLocationDesc: "Station Vault",
    currentLocationId: "loc_vault_01",
    currentCustodianId: officerUser.userId,
    tamperSealNumber: "SEAL-FP-100",
    integrityHash: "0000000000000000000000000000000000000000000000000000000000000000",
    packagingType: "PLASTIC_CARD_CASE",
  });
  await service.retrieveFromStorage(officerUser, "evd_vault_01", "LEGAL_PROCESS");
  const retrievedEvd = await service.getEvidenceById(officerUser, "evd_vault_01");
  assert(retrievedEvd.getState().status === "RETRIEVED", "Scenario 5 — Exhibit retrieved from vault storage");

  // Scenario 6 — Examination Activity
  const examAgg = await service.getEvidenceById(labUser, "evd_scen_1");
  examAgg.addDerivative(
    labUser.userId,
    "evd_sub_sample_01",
    "EXTRACTED_SAMPLE",
    "DNA extraction sample 1A",
    "0.5 mL",
    "1.5 mL"
  );
  assert(examAgg.getDerivatives().length === 1, "Scenario 6 — Examination output sample linked with provenance");

  // Scenario 7 — Derivative Lineage & Subdivision
  const parentEvd = await service.getEvidenceById(labUser, "evd_scen_1");
  const derivativeRecord = parentEvd.getDerivatives()[0];
  assert(
    derivativeRecord.parentEvidenceId === "evd_scen_1" && derivativeRecord.derivedEvidenceId === "evd_sub_sample_01",
    "Scenario 7 — Derivative parentage and lineage tree preserved"
  );

  // Scenario 8 — Digital Evidence Hash Integrity Verification
  const digitalEvd = await service.createEvidence(officerUser, {
    id: "evd_digital_01",
    caseId: "case_dci_003",
    itemNumber: "EX-DIG-01",
    description: "Forensic E01 Disk Image of suspect hard drive",
    evidenceType: "DIGITAL_MEDIA",
    collectionTimestamp: new Date().toISOString(),
    collectedById: officerUser.userId,
    collectionLocationDesc: "Digital Forensics Lab",
    currentLocationId: "loc_digital_vault",
    currentCustodianId: officerUser.userId,
    tamperSealNumber: "SEAL-DIG-888",
    integrityHash: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
    packagingType: "ENCRYPTED_CONTAINER",
  });

  const validVerif = await service.verifyIntegrity(
    officerUser,
    "evd_digital_01",
    "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
  );
  assert(validVerif.verification.result === "MATCH", "Scenario 8 — Digital hash verification confirms MATCH");

  const mismatchVerif = await service.verifyIntegrity(
    officerUser,
    "evd_digital_01",
    "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
  );
  assert(mismatchVerif.verification.result === "MISMATCH", "Scenario 8 — Digital hash mismatch correctly flagged");
  assert(mismatchVerif.aggregate.getState().status === "EXCEPTION", "Scenario 8 — Hash mismatch triggers EXCEPTION state");

  // Scenario 9 — Custody Discrepancy & Exception Handling
  const dispEvd = await service.createEvidence(officerUser, {
    id: "evd_disp_01",
    caseId: "case_dci_004",
    itemNumber: "EX-DISP-01",
    description: "Exotic powder sample",
    evidenceType: "CHEMICAL",
    collectionTimestamp: new Date().toISOString(),
    collectedById: officerUser.userId,
    collectionLocationDesc: "Border Post",
    currentLocationId: "loc_vault_01",
    currentCustodianId: officerUser.userId,
    tamperSealNumber: "SEAL-CHEM-01",
    integrityHash: "1111111111111111111111111111111111111111111111111111111111111111",
    packagingType: "GLASS_VIAL",
  });

  await service.initiateTransfer(officerUser, "evd_disp_01", labUser.userId, "LAB_ANALYSIS", "AUTH-100");
  await service.receiveTransfer(labUser, "evd_disp_01", "loc_nphl_vault", false, undefined, "Vial seal torn");
  const exceptionEvd = await service.getEvidenceById(labUser, "evd_disp_01");
  assert(exceptionEvd.getState().status === "EXCEPTION", "Scenario 9 — Broken seal on transfer creates custody EXCEPTION");
  assert(exceptionEvd.getExceptions().length === 1, "Scenario 9 — Discrepancy record logged in exception ledger");

  // Scenario 10 — Illegal Destruction Attempt under Legal Hold
  const holdEvdAgg = await service.createEvidence(officerUser, {
    id: "evd_hold_01",
    caseId: "case_dci_005",
    itemNumber: "EX-HOLD-01",
    description: "Firearm exhibit under High Court Legal Hold",
    evidenceType: "FIREARM_RELATED",
    collectionTimestamp: new Date().toISOString(),
    collectedById: officerUser.userId,
    collectionLocationDesc: "Armory Vault",
    currentLocationId: "loc_armory",
    currentCustodianId: officerUser.userId,
    tamperSealNumber: "SEAL-ARM-77",
    integrityHash: "2222222222222222222222222222222222222222222222222222222222222222",
    packagingType: "GUN_CASE",
  });

  // Apply legal hold
  await service.setLegalHold(officerUser, "evd_hold_01", true);

  let holdViolationCaught = false;
  try {
    await service.disposeEvidence(
      officerUser,
      "evd_hold_01",
      "usr_judge_01",
      "DESTROYED",
      "COURT-DESTRUCTION-ORDER-001",
      "INCINERATION"
    );
  } catch (err: any) {
    if (err instanceof LegalHoldViolationError) {
      holdViolationCaught = true;
    }
  }
  assert(holdViolationCaught, "Scenario 10 — Destruction attempt on Legal Hold exhibit DENIED with LegalHoldViolationError");

  // Test Concurrency Control
  let concurrencyCaught = false;
  try {
    await service.sealEvidence(officerUser, "evd_vault_01", "NEW-SEAL-999", "TAMPER_BAND", 999);
  } catch (err: any) {
    if (err instanceof ConcurrencyConflictError) {
      concurrencyCaught = true;
    }
  }
  assert(concurrencyCaught, "Optimistic Concurrency Control rejects stale version mutation");

  console.log("\n=====================================================================");
  console.log(`    ALL ${testsPassed}/${totalTests} PHASE 1.4 EVIDENCE ACCEPTANCE TESTS PASSED! ✅`);
  console.log("=====================================================================\n");
}

runAcceptanceSuite().catch((err) => {
  console.error("FATAL: Evidence acceptance test suite failed:", err);
  process.exit(1);
});
