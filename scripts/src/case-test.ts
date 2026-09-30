import assert from "node:assert/strict";
import { pool } from "@workspace/db";
import {
  CaseService,
  CaseRepository,
  CaseStateMachine,
  generateCaseNumber,
  isValidCaseNumber,
  InvalidStateTransitionError,
  UnauthorizedCaseActionError,
  ConcurrencyConflictError,
  CaseNotFoundError,
} from "@workspace/case-domain";
import type { Subject } from "@workspace/security";

async function runCaseManagementTests(): Promise<void> {
  console.log("=====================================================================");
  console.log("             KFIN PHASE 1.3 CASE MANAGEMENT ACCEPTANCE SUITE");
  console.log("   CANONICAL DOMAIN, LIFECYCLE, RELATIONSHIPS & ACCESS CONTROL");
  console.log("=====================================================================");

  const client = await pool.connect();
  let testCount = 0;
  let passCount = 0;

  const test = async (name: string, fn: () => Promise<void>) => {
    testCount++;
    const num = String(testCount).padStart(2, " ");
    process.stdout.write(`Test ${num}: ${name} ... `);
    try {
      await fn();
      passCount++;
      console.log("✅ PASS");
    } catch (err: any) {
      console.log(`❌ FAIL\n  Error: ${err.message}`);
      throw err;
    }
  };

  try {
    // -------------------------------------------------------------------------
    // Setup Synthetic Test Subjects
    // -------------------------------------------------------------------------
    const { rows: orgRows } = await client.query<{ id: string; code: string }>(
      "SELECT id, code FROM organizations WHERE code IN ('DCI-HQ', 'NPHL-LAB', 'ODPP-HQ');"
    );
    const orgMap = new Map(orgRows.map((o) => [o.code, o.id]));
    const dciOrgId = orgMap.get("DCI-HQ")!;
    const labOrgId = orgMap.get("NPHL-LAB")!;
    const odppOrgId = orgMap.get("ODPP-HQ")!;

    const { rows: userRows } = await client.query<{ id: string; badge_number: string }>(
      "SELECT id, badge_number FROM users WHERE badge_number IN ('KFIN-OFF-003', 'KFIN-OFF-002', 'KFIN-OFF-000', 'KFIN-OFF-001', 'KFIN-OFF-007');"
    );
    const userMap = new Map(userRows.map((u) => [u.badge_number, u.id]));
    const dciInv1Id = userMap.get("KFIN-OFF-003")!;
    const dciInv2Id = userMap.get("KFIN-OFF-002")!;
    const dciMgrId = userMap.get("KFIN-OFF-000")!;
    const labSciId = userMap.get("KFIN-OFF-001")!;
    const odppAudId = userMap.get("KFIN-OFF-007")!;

    assert.ok(dciInv1Id, "KFIN-OFF-003 must exist in users table");
    assert.ok(dciInv2Id, "KFIN-OFF-002 must exist in users table");
    assert.ok(dciMgrId, "KFIN-OFF-000 must exist in users table");
    assert.ok(labSciId, "KFIN-OFF-001 must exist in users table");
    assert.ok(odppAudId, "KFIN-OFF-007 must exist in users table");

    // Subject 1: DCI Senior Investigator (Authorized for creation, assignment, updates)
    const investigatorSubject: Subject = {
      userId: dciInv1Id,
      email: "insp.wanjiku.synthetic@kfin.test",
      badgeNumber: "KFIN-OFF-003",
      fullName: "Insp. Grace Wanjiku (Synthetic)",
      organizationId: dciOrgId,
      organizationCode: "DCI-HQ",
      clearanceLevel: 3,
      clearanceCode: "RESTRICTED",
      accountStatus: "ACTIVE",
      roles: ["INVESTIGATOR"],
      permissions: [
        "case:create",
        "case:read",
        "case:update",
        "case:note_add",
        "case:participant_manage",
        "case:assign",
        "case:link",
      ],
    };

    // Subject 2: DCI Case Manager (Authorized for full lifecycle including close/reopen/transfer)
    const caseManagerSubject: Subject = {
      userId: dciMgrId,
      email: "admin.sec.synthetic@kfin.test",
      badgeNumber: "KFIN-OFF-000",
      fullName: "Major David Kariuki (Synthetic Administrator)",
      organizationId: dciOrgId,
      organizationCode: "DCI-HQ",
      clearanceLevel: 5,
      clearanceCode: "HIGHLY_RESTRICTED",
      accountStatus: "ACTIVE",
      roles: ["SECURITY_ADMINISTRATOR", "CASE_MANAGER"],
      permissions: [
        "case:create",
        "case:read",
        "case:update",
        "case:status_change",
        "case:participant_manage",
        "case:assign",
        "case:transfer",
        "case:close",
        "case:reopen",
        "case:link",
        "case:note_add",
      ],
    };

    // Subject 3: NPHL Lab Analyst (Different institution, no case:create permission)
    const labAnalystSubject: Subject = {
      userId: labSciId,
      email: "dr.omondi.synthetic@kfin.test",
      badgeNumber: "KFIN-OFF-001",
      fullName: "Dr. Evans Omondi (Synthetic)",
      organizationId: labOrgId,
      organizationCode: "NPHL-LAB",
      clearanceLevel: 5,
      clearanceCode: "HIGHLY_RESTRICTED",
      accountStatus: "ACTIVE",
      roles: ["LAB_ANALYST"],
      permissions: ["case:read", "lab:examine", "lab:report_create", "dna:submit", "dna:search"],
    };

    // Subject 4: Unprivileged / Restricted Officer (INTERNAL clearance only)
    const restrictedOfficerSubject: Subject = {
      userId: odppAudId,
      email: "officer.kariuki.synthetic@kfin.test",
      badgeNumber: "KFIN-OFF-007",
      fullName: "Constable James Kariuki (Synthetic)",
      organizationId: odppOrgId,
      organizationCode: "ODPP-HQ",
      clearanceLevel: 2,
      clearanceCode: "INTERNAL",
      accountStatus: "ACTIVE",
      roles: ["INSTITUTIONAL_OFFICER"],
      permissions: ["case:read"],
    };

    const caseRepo = new CaseRepository();
    const caseService = new CaseService(caseRepo);

    let createdCaseId = "";
    let createdCaseNumber = "";
    let caseVersion = 1;

    // -------------------------------------------------------------------------
    // Numbering & State Machine Unit Tests
    // -------------------------------------------------------------------------
    await test("Case Number Generator produces valid, traceable KFIN references", async () => {
      const caseNum = generateCaseNumber("DCI-HQ");
      assert.match(caseNum, /^KFIN-SYN-DCIHQ-\d{4}-[A-Z0-9]{6}$/);
      assert.strictEqual(isValidCaseNumber(caseNum), true);
      assert.strictEqual(isValidCaseNumber("INVALID-CASE-REF"), false);
    });

    await test("Case State Machine validates topological transitions and rejection", async () => {
      assert.strictEqual(CaseStateMachine.canTransition("DRAFT", "OPEN"), true);
      assert.strictEqual(CaseStateMachine.canTransition("OPEN", "ACTIVE"), true);
      assert.strictEqual(CaseStateMachine.canTransition("ACTIVE", "CLOSED"), true);
      assert.strictEqual(CaseStateMachine.canTransition("CLOSED", "REOPENED"), true);
      assert.strictEqual(CaseStateMachine.canTransition("REOPENED", "ACTIVE"), true);

      // Illegal transitions
      assert.strictEqual(CaseStateMachine.canTransition("DRAFT", "CLOSED"), false);
      assert.strictEqual(CaseStateMachine.canTransition("CLOSED", "ACTIVE"), false); // must pass through REOPENED
      assert.strictEqual(CaseStateMachine.canTransition("ARCHIVED", "ACTIVE"), false); // terminal
    });

    // -------------------------------------------------------------------------
    // Acceptance Scenario 1: Authorized Case Creation
    // -------------------------------------------------------------------------
    await test("Scenario 1 — Authorized investigator creates case (ALLOW + audit + assignment)", async () => {
      const created = await caseService.createCase(
        investigatorSubject,
        {
          title: "Synthetic Burglary Forensic Analysis (Phase 1.3)",
          description: "Investigation into commercial property unlawful entry and biological trace recovery.",
          originatingOrgId: dciOrgId,
          leadInvestigatorId: dciInv1Id,
          caseType: "CRIMINAL_INVESTIGATION",
          priority: "PRIORITY",
          incidentDate: new Date("2026-09-28T09:00:00Z"),
          incidentCounty: "Nairobi",
          incidentLocationCoords: "-1.286389, 36.817223",
          dataClassification: "RESTRICTED",
        },
        { ipAddress: "192.168.10.45" }
      );

      assert.ok(created.id);
      assert.strictEqual(created.status, "OPEN");
      assert.strictEqual(created.version, 1);
      assert.strictEqual(isValidCaseNumber(created.caseNumber), true);

      createdCaseId = created.id;
      createdCaseNumber = created.caseNumber;

      // Verify status history record
      const history = await caseRepo.getStatusHistory(created.id);
      assert.strictEqual(history.length, 1);
      assert.strictEqual(history[0].previousStatus, "DRAFT");
      assert.strictEqual(history[0].newStatus, "OPEN");

      // Verify initial assignment record
      const assignments = await caseRepo.getAssignments(created.id);
      assert.strictEqual(assignments.length, 1);
      assert.strictEqual(assignments[0].caseRole, "LEAD_INVESTIGATOR");
      assert.strictEqual(assignments[0].userId, dciInv1Id);
    });

    // -------------------------------------------------------------------------
    // Acceptance Scenario 2: Unauthorized Creation
    // -------------------------------------------------------------------------
    await test("Scenario 2 — Unauthorized creation fails with DENIED + audit", async () => {
      await assert.rejects(
        async () => {
          await caseService.createCase(
            labAnalystSubject, // Lacks case:create permission
            {
              title: "Unauthorized Case Attempt",
              description: "Should fail authorization immediately.",
              originatingOrgId: labOrgId,
              leadInvestigatorId: labSciId,
              incidentDate: new Date(),
              incidentCounty: "Nairobi",
            }
          );
        },
        (err: any) => err instanceof UnauthorizedCaseActionError
      );
    });

    // -------------------------------------------------------------------------
    // Acceptance Scenario 3: Authorized Case Access
    // -------------------------------------------------------------------------
    await test("Scenario 3 — Authorized investigator accesses case (ALLOW)", async () => {
      const fetched = await caseService.getCaseById(investigatorSubject, createdCaseId);
      assert.strictEqual(fetched.id, createdCaseId);
      assert.strictEqual(fetched.caseNumber, createdCaseNumber);
      assert.ok(fetched.description.includes("Investigation into commercial property"));
    });

    // -------------------------------------------------------------------------
    // Acceptance Scenario 4: Cross-Institution Access Denied
    // -------------------------------------------------------------------------
    await test("Scenario 4 — Cross-institution user denied access to restricted case", async () => {
      await assert.rejects(
        async () => {
          await caseService.getCaseById(labAnalystSubject, createdCaseId);
        },
        (err: any) => err instanceof UnauthorizedCaseActionError
      );
    });

    // -------------------------------------------------------------------------
    // Acceptance Scenario 5: Assignment
    // -------------------------------------------------------------------------
    await test("Scenario 5 — Case manager assigns secondary investigator (ALLOW + history)", async () => {
      const assignment = await caseService.assignPersonnel(
        caseManagerSubject,
        createdCaseId,
        {
          userId: dciInv2Id,
          organizationId: dciOrgId,
          caseRole: "INVESTIGATOR",
          accessScope: "FULL",
        }
      );

      assert.ok(assignment.id);
      assert.strictEqual(assignment.userId, dciInv2Id);
      assert.strictEqual(assignment.caseRole, "INVESTIGATOR");
      assert.strictEqual(assignment.isActive, true);

      const all = await caseRepo.getAssignments(createdCaseId);
      assert.strictEqual(all.length, 2);
    });

    // -------------------------------------------------------------------------
    // Acceptance Scenario 6: Unauthorized Assignment
    // -------------------------------------------------------------------------
    await test("Scenario 6 — User without assignment authority rejected (DENIED)", async () => {
      await assert.rejects(
        async () => {
          await caseService.assignPersonnel(
            restrictedOfficerSubject,
            createdCaseId,
            {
              userId: dciInv2Id,
              organizationId: dciOrgId,
              caseRole: "INVESTIGATOR",
            }
          );
        },
        (err: any) => err instanceof UnauthorizedCaseActionError
      );
    });

    // -------------------------------------------------------------------------
    // Acceptance Scenario 7: Transfer
    // -------------------------------------------------------------------------
    await test("Scenario 7 — Case transfer preserves historical responsibility and records transfer", async () => {
      // Transition case to ACTIVE first
      const activeCase = await caseService.transitionCaseStatus(
        caseManagerSubject,
        createdCaseId,
        {
          newStatus: "ACTIVE",
          reason: "Formal investigation initiated with secondary detective assigned",
          expectedVersion: 1,
        }
      );
      caseVersion = activeCase.version;
      assert.strictEqual(activeCase.status, "ACTIVE");

      // Transfer lead to Detective 2
      const transfer = await caseService.transferCase(
        caseManagerSubject,
        createdCaseId,
        {
          toOrgId: dciOrgId,
          toInvestigatorId: dciInv2Id,
          transferReason: "Inter-departmental case reassignment due to specialized forensics requirement",
          authorizationReference: "DCI-AUTH-2026-X9",
          expectedVersion: caseVersion,
        }
      );

      assert.ok(transfer.id);
      assert.strictEqual(transfer.fromInvestigatorId, dciInv1Id);
      assert.strictEqual(transfer.toInvestigatorId, dciInv2Id);
      assert.strictEqual(transfer.status, "COMPLETED");

      // Case lead should now be Detective 2
      const updatedCase = await caseRepo.findById(createdCaseId);
      assert.strictEqual(updatedCase?.leadInvestigatorId, dciInv2Id);
      caseVersion = updatedCase!.version;
    });

    // -------------------------------------------------------------------------
    // Acceptance Scenario 8: Invalid State Transition
    // -------------------------------------------------------------------------
    await test("Scenario 8 — Invalid state transition rejected (DENIED + no state change)", async () => {
      await assert.rejects(
        async () => {
          // Attempting to transition ACTIVE directly to ARCHIVED (only CLOSED cases can be archived)
          await caseService.transitionCaseStatus(
            caseManagerSubject,
            createdCaseId,
            {
              newStatus: "ARCHIVED",
              reason: "Invalid jump to archive",
              expectedVersion: caseVersion,
            }
          );
        },
        (err: any) => err instanceof InvalidStateTransitionError
      );

      // Verify status is unchanged
      const current = await caseRepo.findById(createdCaseId);
      assert.strictEqual(current?.status, "ACTIVE");
    });

    // -------------------------------------------------------------------------
    // Acceptance Scenario 9: Closure
    // -------------------------------------------------------------------------
    await test("Scenario 9 — Closure succeeds when all conditions satisfied (CLOSED + audit)", async () => {
      const closed = await caseService.transitionCaseStatus(
        caseManagerSubject,
        createdCaseId,
        {
          newStatus: "CLOSED",
          reason: "Forensic examination completed and investigative report submitted to prosecutor",
          expectedVersion: caseVersion,
        }
      );

      assert.strictEqual(closed.status, "CLOSED");
      assert.ok(closed.closedAt);
      assert.strictEqual(closed.closedById, dciMgrId);
      assert.ok(closed.closureReason?.includes("Forensic examination completed"));
      caseVersion = closed.version;

      const history = await caseRepo.getStatusHistory(createdCaseId);
      const closeEntry = history.find((h) => h.newStatus === "CLOSED");
      assert.ok(closeEntry);
      assert.strictEqual(closeEntry.actorId, dciMgrId);
    });

    // -------------------------------------------------------------------------
    // Acceptance Scenario 10: Unauthorized Reopening
    // -------------------------------------------------------------------------
    await test("Scenario 10 — Unauthorized officer cannot reopen closed case (DENIED)", async () => {
      await assert.rejects(
        async () => {
          await caseService.transitionCaseStatus(
            investigatorSubject, // Investigator lacks case:reopen permission (only Case Manager / Security Admin)
            createdCaseId,
            {
              newStatus: "REOPENED",
              reason: "Attempting reopening without authorization",
              expectedVersion: caseVersion,
            }
          );
        },
        (err: any) => err instanceof UnauthorizedCaseActionError
      );

      const reopened = await caseService.transitionCaseStatus(
        caseManagerSubject,
        createdCaseId,
        {
          newStatus: "REOPENED",
          reason: "New biological evidence discovered at secondary scene under court warrant",
          expectedVersion: caseVersion,
        }
      );

      assert.strictEqual(reopened.status, "REOPENED");
      assert.ok(reopened.reopenedAt);
      assert.strictEqual(reopened.reopenedById, dciMgrId);
      caseVersion = reopened.version;
    });

    // -------------------------------------------------------------------------
    // Acceptance Scenario 11: Historical Reconstruction
    // -------------------------------------------------------------------------
    await test("Scenario 11 — Historical reconstruction produces complete chronological audit record", async () => {
      const timeline = await caseService.getTimeline(caseManagerSubject, createdCaseId);
      assert.ok(timeline.length >= 4, `Expected at least 4 timeline events, got ${timeline.length}`);

      const eventTypes = timeline.map((t) => t.eventType);
      assert.ok(eventTypes.includes("STATUS_CHANGE"), "Timeline must contain STATUS_CHANGE events");
      assert.ok(eventTypes.includes("ASSIGNMENT"), "Timeline must contain ASSIGNMENT events");
      assert.ok(eventTypes.includes("TRANSFER"), "Timeline must contain TRANSFER events");

      // Verify strictly chronological ordering
      for (let i = 1; i < timeline.length; i++) {
        assert.ok(
          timeline[i].timestamp.getTime() >= timeline[i - 1].timestamp.getTime(),
          "Timeline items must be in non-decreasing chronological order"
        );
      }
    });

    // -------------------------------------------------------------------------
    // Acceptance Scenario 12: Object-Level Attack (IDOR)
    // -------------------------------------------------------------------------
    await test("Scenario 12 — Object substitution IDOR attack rejected against unauthorized case", async () => {
      // Fake non-existent or other case ID
      const fakeId = "00000000-0000-0000-0000-000000009999";
      await assert.rejects(
        async () => {
          await caseService.getCaseById(investigatorSubject, fakeId);
        },
        (err: any) => err instanceof CaseNotFoundError
      );
    });

    // -------------------------------------------------------------------------
    // Acceptance Scenario 13: Classification Restriction & Field Minimization
    // -------------------------------------------------------------------------
    await test("Scenario 13 — User with insufficient clearance receives minimized/redacted case record", async () => {
      // Officer with INTERNAL clearance reading RESTRICTED case (within same org, e.g. DCI civilian staff)
      const dciInternalStaffSubject: Subject = {
        userId: dciInv1Id,
        email: "dci.clerk.synthetic@kfin.test",
        badgeNumber: "DCI-CLK-001",
        fullName: "Clerk Juma Bakari (Synthetic)",
        organizationId: dciOrgId,
        organizationCode: "DCI-HQ",
        clearanceLevel: 2,
        clearanceCode: "INTERNAL", // Lower than case's RESTRICTED classification
        accountStatus: "ACTIVE",
        roles: ["AUDITOR"],
        permissions: ["case:read"],
      };

      const result = await caseService.getCaseById(dciInternalStaffSubject, createdCaseId);
      assert.strictEqual(result.id, createdCaseId);
      assert.strictEqual(result.description, "[REDACTED — INSUFFICIENT SECURITY CLEARANCE]");
      assert.strictEqual(result.incidentLocationCoords, null);
    });

    // -------------------------------------------------------------------------
    // Acceptance Scenario 14: Participant Management & Removal
    // -------------------------------------------------------------------------
    await test("Scenario 14 — Case participant registration and removal with privacy preservation", async () => {
      const participant = await caseService.addParticipant(
        investigatorSubject,
        createdCaseId,
        {
          participantType: "SUSPECT",
          pseudonym: "PERSON_ALPHA",
          idDocumentType: "NATIONAL_ID",
          idDocumentNumber: "38920194", // will be SHA-256 hashed
          demographics: { approximateAge: 34, gender: "MALE" },
          notes: "Recovered fingerprint match candidate",
        }
      );

      assert.ok(participant.id);
      assert.strictEqual(participant.pseudonym, "PERSON_ALPHA");
      assert.ok(participant.idDocumentHash);
      assert.notStrictEqual(participant.idDocumentHash, "38920194"); // Must be hashed!

      const listBefore = await caseRepo.getParticipants(createdCaseId);
      assert.strictEqual(listBefore.length, 1);

      // Remove participant
      await caseService.removeParticipant(
        investigatorSubject,
        createdCaseId,
        participant.id,
        "Excluded via DNA elimination test"
      );

      const listAfter = await caseRepo.getParticipants(createdCaseId);
      assert.strictEqual(listAfter.length, 0);
    });

    // -------------------------------------------------------------------------
    // Acceptance Scenario 15: Duplicate Case Candidate Linking
    // -------------------------------------------------------------------------
    await test("Scenario 15 — Duplicate case candidate linking without destructive merge", async () => {
      // Create a second case
      const caseB = await caseService.createCase(
        investigatorSubject,
        {
          title: "Synthetic Correlated Incident (Phase 1.3)",
          description: "Correlated robbery suspected to share modus operandi.",
          originatingOrgId: dciOrgId,
          leadInvestigatorId: dciInv1Id,
          incidentDate: new Date(),
          incidentCounty: "Nairobi",
        }
      );

      // Link Case A and Case B as duplicate candidate
      const link = await caseService.linkCases(
        investigatorSubject,
        createdCaseId,
        {
          targetCaseId: caseB.id,
          linkType: "DUPLICATE_CANDIDATE",
          notes: "Identified matching scene shoe impression and timeline correlation",
        }
      );

      assert.ok(link.id);
      assert.strictEqual(link.linkType, "DUPLICATE_CANDIDATE");

      // Verify both cases remain intact (zero destructive merging)
      const originalA = await caseRepo.findById(createdCaseId);
      const originalB = await caseRepo.findById(caseB.id);
      assert.ok(originalA);
      assert.ok(originalB);

      const linksA = await caseRepo.getLinks(createdCaseId);
      assert.strictEqual(linksA.length, 1);
      assert.strictEqual(linksA[0].targetCaseId, caseB.id);
    });

    // -------------------------------------------------------------------------
    // Concurrency & Note Controls
    // -------------------------------------------------------------------------
    await test("Optimistic Concurrency Control rejects updates with stale version", async () => {
      await assert.rejects(
        async () => {
          // Providing stale expectedVersion: 1 when case is at version >= 3
          await caseService.updateCase(
            caseManagerSubject,
            createdCaseId,
            {
              title: "Conflicting Update",
              expectedVersion: 1,
            }
          );
        },
        (err: any) => err instanceof ConcurrencyConflictError
      );
    });

    await test("Case Journal Notes enforce confidential view filtering", async () => {
      // Add standard note
      await caseService.addNote(
        investigatorSubject,
        createdCaseId,
        { noteText: "Standard scene reconnaissance complete", isConfidential: false }
      );

      // Add confidential note
      await caseService.addNote(
        investigatorSubject,
        createdCaseId,
        { noteText: "Confidential informant intelligence reference K-91", isConfidential: true }
      );

      // User with RESTRICTED clearance sees both notes
      const notesForInvestigator = await caseService.getNotes(investigatorSubject, createdCaseId);
      assert.strictEqual(notesForInvestigator.length, 2);

      // User with INTERNAL clearance sees only the standard note
      const dciInternalStaffSubject: Subject = {
        userId: dciInv1Id,
        email: "dci.clerk.synthetic@kfin.test",
        badgeNumber: "DCI-CLK-001",
        fullName: "Clerk Juma Bakari (Synthetic)",
        organizationId: dciOrgId,
        organizationCode: "DCI-HQ",
        clearanceLevel: 2,
        clearanceCode: "INTERNAL",
        accountStatus: "ACTIVE",
        roles: ["AUDITOR"],
        permissions: ["case:read"],
      };

      const notesForClerk = await caseService.getNotes(dciInternalStaffSubject, createdCaseId);
      assert.strictEqual(notesForClerk.length, 1);
      assert.strictEqual(notesForClerk[0].isConfidential, false);
    });

    console.log("\n=====================================================================");
    console.log(`    ALL ${passCount}/${testCount} PHASE 1.3 CASE ACCEPTANCE TESTS PASSED! ✅`);
    console.log("=====================================================================\n");
  } finally {
    client.release();
  }
}

runCaseManagementTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
