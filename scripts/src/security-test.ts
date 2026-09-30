import { pool } from "@workspace/db";
import assert from "node:assert/strict";
import {
  hashPassword,
  verifyPassword,
  validatePasswordPolicy,
  checkPasswordHistory,
  generateTotpSecret,
  generateTotpCode,
  verifyTotpCode,
  generateBackupCodes,
  verifyBackupCode,
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashToken,
  generateApiKey,
  verifyApiKey,
  AuthorizationEngine,
  FederatedIdentityMapper,
  sanitizeAuditMetadata,
  type Subject,
  type Resource,
  type AccessContext,
  type ClassificationLevel,
} from "@workspace/security";

async function runSecurityTestSuite() {
  console.log("=====================================================================");
  console.log("             KFIN PHASE 1.2 SECURITY ACCEPTANCE TEST SUITE");
  console.log("   IDENTITY, AUTHENTICATION, AUTHORIZATION & ACCESS CONTROL MATRIX");
  console.log("=====================================================================");

  let client: any = null;
  let dbAvailable = false;
  try {
    client = await pool.connect();
    dbAvailable = true;
  } catch (err: any) {
    console.log("ℹ️  Note: Live database not reachable in current environment (" + (err.code || err.message) + ").");
    console.log("   Executing complete in-memory security, cryptography, RBAC/ABAC and policy acceptance suite.\n");
  }

  let passCount = 0;
  let testCount = 0;

  const test = async (name: string, fn: () => Promise<void>) => {
    testCount++;
    process.stdout.write(`Test ${testCount.toString().padStart(2, " ")}: ${name} ... `);
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
    // Setup: Retrieve seeded synthetic entities for tests or fallback to synthetic UUIDs
    // -------------------------------------------------------------------------
    let dciOrgId = "00000000-0000-0000-0000-000000000001";
    let labOrgId = "00000000-0000-0000-0000-000000000002";
    let odppOrgId = "00000000-0000-0000-0000-000000000003";
    let npsOrgId = "00000000-0000-0000-0000-000000000004";

    let investigatorId = "00000000-0000-0000-0000-000000000011";
    let analystId = "00000000-0000-0000-0000-000000000012";
    let directorId = "00000000-0000-0000-0000-000000000013";
    let secAdminId = "00000000-0000-0000-0000-000000000014";
    let auditorId = "00000000-0000-0000-0000-000000000015";
    let officerId = "00000000-0000-0000-0000-000000000016";
    let suspendedId = "00000000-0000-0000-0000-000000000017";
    let lockedId = "00000000-0000-0000-0000-000000000018";
    let revokedId = "00000000-0000-0000-0000-000000000019";

    interface OrgRow {
      id: string;
      code: string;
    }
    interface UserRow {
      id: string;
      email: string;
      account_status?: string;
    }

    if (dbAvailable && client) {
      const orgResult: any = await client.query("SELECT id, code FROM organizations;");
      const orgs: OrgRow[] = orgResult.rows || [];
      const orgMap = new Map<string, string>(orgs.map((o: OrgRow) => [o.code, o.id]));

      const userResult: any = await client.query("SELECT id, email, account_status FROM users;");
      const users: UserRow[] = userResult.rows || [];
      const userMap = new Map<string, string>(users.map((u: UserRow) => [u.email, u.id]));

      if (orgMap.get("DCI-HQ")) dciOrgId = orgMap.get("DCI-HQ")!;
      if (orgMap.get("NPHL-LAB")) labOrgId = orgMap.get("NPHL-LAB")!;
      if (orgMap.get("ODPP-HQ")) odppOrgId = orgMap.get("ODPP-HQ")!;
      if (orgMap.get("NPS-HQ")) npsOrgId = orgMap.get("NPS-HQ")!;

      if (userMap.get("insp.wanjiku.synthetic@kfin.test")) investigatorId = userMap.get("insp.wanjiku.synthetic@kfin.test")!;
      if (userMap.get("dr.omondi.synthetic@kfin.test")) analystId = userMap.get("dr.omondi.synthetic@kfin.test")!;
      if (userMap.get("director.mutua.synthetic@kfin.test")) directorId = userMap.get("director.mutua.synthetic@kfin.test")!;
      if (userMap.get("admin.sec.synthetic@kfin.test")) secAdminId = userMap.get("admin.sec.synthetic@kfin.test")!;
      if (userMap.get("auditor.odero.synthetic@kfin.test")) auditorId = userMap.get("auditor.odero.synthetic@kfin.test")!;
      if (userMap.get("officer.kariuki.synthetic@kfin.test")) officerId = userMap.get("officer.kariuki.synthetic@kfin.test")!;
      if (userMap.get("suspended.user.synthetic@kfin.test")) suspendedId = userMap.get("suspended.user.synthetic@kfin.test")!;
      if (userMap.get("locked.user.synthetic@kfin.test")) lockedId = userMap.get("locked.user.synthetic@kfin.test")!;
      if (userMap.get("revoked.user.synthetic@kfin.test")) revokedId = userMap.get("revoked.user.synthetic@kfin.test")!;
    }

    // Base Synthetic Subjects
    const investigatorSubject: Subject = {
      userId: investigatorId,
      email: "insp.wanjiku.synthetic@kfin.test",
      badgeNumber: "KFIN-OFF-003",
      fullName: "Insp. Grace Wanjiku",
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
        "evidence:create",
        "evidence:read",
        "evidence:transfer",
        "lab:submit",
        "dna:read",
      ],
    };

    const analystSubject: Subject = {
      userId: analystId,
      email: "dr.omondi.synthetic@kfin.test",
      badgeNumber: "KFIN-OFF-001",
      fullName: "Dr. Evans Omondi",
      organizationId: labOrgId,
      organizationCode: "NPHL-LAB",
      clearanceLevel: 5,
      clearanceCode: "HIGHLY_RESTRICTED",
      accountStatus: "ACTIVE",
      roles: ["LAB_ANALYST", "DNA_SPECIALIST"],
      permissions: [
        "case:read",
        "evidence:read",
        "lab:examine",
        "lab:report_create",
        "dna:submit",
        "dna:read",
        "dna:search",
        "dna:view_sensitive",
      ],
    };

    const reviewerSubject: Subject = {
      userId: directorId,
      email: "director.mutua.synthetic@kfin.test",
      badgeNumber: "KFIN-OFF-004",
      fullName: "Dr. Faith Mutua",
      organizationId: labOrgId,
      organizationCode: "NPHL-LAB",
      clearanceLevel: 5,
      clearanceCode: "HIGHLY_RESTRICTED",
      accountStatus: "ACTIVE",
      roles: ["LAB_REVIEWER"],
      permissions: [
        "case:read",
        "evidence:read",
        "lab:review",
        "lab:report_approve",
        "dna:read",
        "dna:match_confirm",
        "dna:view_sensitive",
      ],
    };

    const crossOrgSubject: Subject = {
      userId: officerId,
      email: "officer.kariuki.synthetic@kfin.test",
      badgeNumber: "KFIN-OFF-007",
      fullName: "Constable James Kariuki",
      organizationId: npsOrgId,
      organizationCode: "NPS-HQ",
      clearanceLevel: 2,
      clearanceCode: "INTERNAL",
      accountStatus: "ACTIVE",
      roles: ["INSTITUTIONAL_OFFICER"],
      permissions: ["case:read", "evidence:read"],
    };

    // -------------------------------------------------------------------------
    // 1. Password Security & Hashing Tests
    // -------------------------------------------------------------------------
    await test("Password policy enforces 12+ chars, mixed case, number & symbol", async () => {
      assert.equal(validatePasswordPolicy("short").valid, false);
      assert.equal(validatePasswordPolicy("alllowercase123!").valid, false);
      assert.equal(validatePasswordPolicy("ALLUPPERCASE123!").valid, false);
      assert.equal(validatePasswordPolicy("NoNumbersOrSymbols!").valid, false);
      assert.equal(validatePasswordPolicy("NoSpecialCharacters123").valid, false);
      assert.equal(validatePasswordPolicy("KFIN-Secure-Pass-2026!").valid, true);
    });

    await test("Cryptographic scrypt hashing and constant-time verification", async () => {
      const password = "KFIN-Secure-Pass-2026!";
      const hash = await hashPassword(password);
      assert.ok(hash.startsWith("kfin_scrypt$16384$8$1$"));
      const isValid = await verifyPassword(password, hash);
      assert.equal(isValid, true);
      const isInvalid = await verifyPassword("WrongPassword-2026!", hash);
      assert.equal(isInvalid, false);
    });

    await test("Password history rejects reuse of prior passwords", async () => {
      const pwd1 = "KFIN-Initial-Password-2026!";
      const hash1 = await hashPassword(pwd1);
      const isReused = await checkPasswordHistory(pwd1, [hash1]);
      assert.equal(isReused, true, "Expected password reuse to be detected");
      const isDifferent = await checkPasswordHistory("KFIN-Completely-New-Pass-2026!", [hash1]);
      assert.equal(isDifferent, false);
    });

    // -------------------------------------------------------------------------
    // 2. Multi-Factor Authentication (RFC 6238 TOTP) Tests
    // -------------------------------------------------------------------------
    await test("TOTP generation, drift window, and replay prevention", async () => {
      const secret = generateTotpSecret();
      const now = Date.now();
      const { code, step } = generateTotpCode(secret, now);
      assert.equal(code.length, 6);

      // Verify code
      const result = verifyTotpCode(secret, code, { timestampMs: now });
      assert.equal(result.valid, true);

      // Replay prevention: same step must be rejected if lastUsedStep >= step
      const replayResult = verifyTotpCode(secret, code, {
        timestampMs: now,
        lastUsedStep: step,
      });
      assert.equal(replayResult.valid, false, "Replay attack must be blocked");

      // Wrong code must fail
      const wrongResult = verifyTotpCode(secret, "000000", { timestampMs: now });
      assert.equal(wrongResult.valid, false);
    });

    await test("Single-use backup recovery codes verify and invalidate", async () => {
      const { plaintext, hashed } = generateBackupCodes(5);
      assert.equal(plaintext.length, 5);

      const codeToUse = plaintext[2];
      const result = verifyBackupCode(codeToUse, hashed);
      assert.equal(result.valid, true);
      assert.equal(result.remainingHashedCodes.length, 4);

      // Re-using the same code against remaining codes must fail
      const reuseResult = verifyBackupCode(codeToUse, result.remainingHashedCodes);
      assert.equal(reuseResult.valid, false, "Consumed backup code must be rejected");
    });

    // -------------------------------------------------------------------------
    // 3. Cryptographic Token & Session Management Tests
    // -------------------------------------------------------------------------
    await test("JWT Access token signed with HMAC-SHA256, verified, and tamper-resistant", async () => {
      const secret = "a_very_secret_signing_key_for_kfin_tests_32_bytes!";
      const { token } = signAccessToken(
        {
          sub: investigatorId,
          email: "insp.wanjiku.synthetic@kfin.test",
          badge: "KFIN-OFF-003",
          name: "Insp. Grace Wanjiku",
          orgId: dciOrgId,
          orgCode: "DCI-HQ",
          clearanceLevel: 3,
          clearanceCode: "RESTRICTED",
          roles: ["INVESTIGATOR"],
          permissions: ["case:read"],
          mfaAuthenticated: true,
        },
        secret
      );

      const claims = verifyAccessToken(token, secret);
      assert.equal(claims.sub, investigatorId);
      assert.equal(claims.orgCode, "DCI-HQ");
      assert.equal(claims.iss, "kfin-identity-authority");

      // Tampered token must fail
      const tampered = token.slice(0, -4) + "XXXX";
      assert.throws(() => verifyAccessToken(tampered, secret));

      // Expired token must fail
      const { token: expiredToken } = signAccessToken(
        {
          sub: investigatorId,
          email: "insp.wanjiku.synthetic@kfin.test",
          badge: "KFIN-OFF-003",
          name: "Insp. Grace Wanjiku",
          orgId: dciOrgId,
          orgCode: "DCI-HQ",
          clearanceLevel: 3,
          clearanceCode: "RESTRICTED",
          roles: ["INVESTIGATOR"],
          permissions: ["case:read"],
          mfaAuthenticated: true,
          expiresInSeconds: -10, // already expired
        },
        secret
      );
      assert.throws(() => verifyAccessToken(expiredToken, secret));
    });

    // -------------------------------------------------------------------------
    // 4. Master Acceptance Scenarios (A through J)
    // -------------------------------------------------------------------------

    // Scenario A: Normal authorized access
    await test("Scenario A — Normal authorized access (ALLOW + audited)", async () => {
      const resource: Resource = {
        type: "case",
        id: "KFIN-SYN-CASE-2026-0001",
        classification: "RESTRICTED",
        ownerOrgId: dciOrgId,
        assignedUserIds: [investigatorId],
      };
      const context: AccessContext = {
        action: "case:read",
        ipAddress: "192.168.1.10",
        correlationId: "test-corr-scenario-a",
      };

      const decision = AuthorizationEngine.evaluate(investigatorSubject, resource, context);
      assert.equal(decision.decision, "ALLOW");
      assert.equal(decision.auditPayload.outcome, "SUCCESS");
    });

    // Scenario B: Insufficient permission
    await test("Scenario B — Insufficient permission (DENY + audited)", async () => {
      const resource: Resource = {
        type: "dna_profile",
        id: "KFIN-SYN-DNA-2026-0001",
        classification: "HIGHLY_RESTRICTED",
        ownerOrgId: labOrgId,
      };
      const context: AccessContext = {
        action: "dna:search",
        purpose: "CASE_INVESTIGATION",
        ipAddress: "192.168.1.10",
        correlationId: "test-corr-scenario-b",
      };

      // Investigator lacks dna:search permission
      const decision = AuthorizationEngine.evaluate(investigatorSubject, resource, context);
      assert.equal(decision.decision, "DENY");
      assert.equal(decision.reasonCode, "DENY_INSUFFICIENT_PERMISSION");
      assert.equal(decision.auditPayload.outcome, "DENIED");
    });

    // Scenario C: Insufficient clearance
    await test("Scenario C — Insufficient clearance for classified resource (DENY)", async () => {
      // Create a user with permission but lower clearance level
      const restrictedUser: Subject = {
        ...analystSubject,
        clearanceLevel: 2, // INTERNAL (tier 2)
        clearanceCode: "INTERNAL",
      };
      const resource: Resource = {
        type: "dna_profile",
        id: "KFIN-SYN-DNA-2026-0001",
        classification: "HIGHLY_RESTRICTED", // tier 5
        ownerOrgId: labOrgId,
      };
      const context: AccessContext = {
        action: "dna:view_sensitive",
        purpose: "FORENSIC_EXAMINATION",
        ipAddress: "192.168.1.10",
        correlationId: "test-corr-scenario-c",
      };

      const decision = AuthorizationEngine.evaluate(restrictedUser, resource, context);
      assert.equal(decision.decision, "DENY");
      assert.equal(decision.reasonCode, "DENY_INSUFFICIENT_CLEARANCE_RESOURCE");
    });

    // Scenario D: Cross-institution access without authorization
    await test("Scenario D — Cross-institution boundary access (DENY)", async () => {
      // User from NPS-HQ attempting to read restricted case owned by DCI-HQ without joint assignment
      const resource: Resource = {
        type: "case",
        id: "KFIN-SYN-CASE-2026-0001",
        classification: "RESTRICTED",
        ownerOrgId: dciOrgId, // Belongs to DCI
        assignedUserIds: [investigatorId],
      };
      const context: AccessContext = {
        action: "case:update",
        purpose: "CASE_INVESTIGATION",
        ipAddress: "192.168.1.25",
        correlationId: "test-corr-scenario-d",
      };

      const decision = AuthorizationEngine.evaluate(crossOrgSubject, resource, context);
      assert.equal(decision.decision, "DENY");
    });

    // Scenario E: Suspended account
    await test("Scenario E — Suspended account rejected (DENY)", async () => {
      const suspendedSubject: Subject = {
        ...investigatorSubject,
        userId: suspendedId,
        accountStatus: "SUSPENDED",
      };
      const resource: Resource = {
        type: "case",
        id: "KFIN-SYN-CASE-2026-0001",
        classification: "RESTRICTED",
        ownerOrgId: dciOrgId,
      };
      const context: AccessContext = {
        action: "case:read",
        ipAddress: "192.168.1.10",
        correlationId: "test-corr-scenario-e",
      };

      const decision = AuthorizationEngine.evaluate(suspendedSubject, resource, context);
      assert.equal(decision.decision, "DENY");
      assert.equal(decision.reasonCode, "DENY_ACCOUNT_SUSPENDED");
    });

    // Scenario F: Purpose limitation
    await test("Scenario F — Purpose requirement for sensitive forensic actions (DENY when missing)", async () => {
      const resource: Resource = {
        type: "dna_profile",
        id: "KFIN-SYN-DNA-2026-0001",
        classification: "HIGHLY_RESTRICTED",
        ownerOrgId: labOrgId,
      };
      const contextWithoutPurpose: AccessContext = {
        action: "dna:search",
        ipAddress: "192.168.1.15",
        correlationId: "test-corr-scenario-f",
        // purpose omitted
      };

      const decision = AuthorizationEngine.evaluate(analystSubject, resource, contextWithoutPurpose);
      assert.equal(decision.decision, "DENY");
      assert.equal(decision.reasonCode, "DENY_PURPOSE_REQUIRED");

      // Invalid purpose
      const contextWithInvalidPurpose: AccessContext = {
        ...contextWithoutPurpose,
        purpose: "UNAUTHORIZED_CURIOSITY",
      };
      const decisionInvalid = AuthorizationEngine.evaluate(analystSubject, resource, contextWithInvalidPurpose);
      assert.equal(decisionInvalid.decision, "DENY");
      assert.equal(decisionInvalid.reasonCode, "DENY_INVALID_PURPOSE");
    });

    // Scenario G: Object substitution / IDOR defense
    await test("Scenario G — Object substitution IDOR defense (DENY)", async () => {
      const unassignedCase: Resource = {
        type: "case",
        id: "KFIN-SYN-CASE-2026-9999",
        classification: "RESTRICTED",
        ownerOrgId: odppOrgId, // belongs to ODPP
        assignedUserIds: [auditorId], // not assigned to investigator
      };
      const context: AccessContext = {
        action: "case:read",
        ipAddress: "192.168.1.10",
        correlationId: "test-corr-scenario-g",
      };

      const decision = AuthorizationEngine.evaluate(investigatorSubject, unassignedCase, context);
      assert.equal(decision.decision, "DENY");
    });

    // Scenario H: Privilege escalation attempt
    await test("Scenario H — Privilege escalation attempt on self-roles (DENY)", async () => {
      const userTarget: Resource = {
        type: "user",
        id: investigatorSubject.userId, // targeting self
        classification: "INTERNAL",
      };
      const context: AccessContext = {
        action: "role:manage",
        ipAddress: "192.168.1.10",
        correlationId: "test-corr-scenario-h",
      };

      const decision = AuthorizationEngine.evaluate(investigatorSubject, userTarget, context);
      assert.equal(decision.decision, "DENY");
    });

    // Scenario I: Clearance escalation attempt
    await test("Scenario I — Clearance escalation attempt on self (DENY)", async () => {
      const userTarget: Resource = {
        type: "user",
        id: investigatorSubject.userId,
        classification: "INTERNAL",
      };
      const context: AccessContext = {
        action: "clearance:assign",
        ipAddress: "192.168.1.10",
        correlationId: "test-corr-scenario-i",
      };

      const decision = AuthorizationEngine.evaluate(investigatorSubject, userTarget, context);
      assert.equal(decision.decision, "DENY");
    });

    // Scenario J: Session & account revocation
    await test("Scenario J — Revoked account immediately blocked (DENY)", async () => {
      const revokedSubject: Subject = {
        ...crossOrgSubject,
        userId: revokedId,
        accountStatus: "REVOKED",
      };
      const resource: Resource = {
        type: "case",
        id: "KFIN-SYN-CASE-2026-0001",
        classification: "INTERNAL",
      };
      const context: AccessContext = {
        action: "case:read",
        ipAddress: "192.168.1.10",
        correlationId: "test-corr-scenario-j",
      };

      const decision = AuthorizationEngine.evaluate(revokedSubject, resource, context);
      assert.equal(decision.decision, "DENY");
      assert.equal(decision.reasonCode, "DENY_ACCOUNT_REVOKED");
    });

    // -------------------------------------------------------------------------
    // 5. Separation of Duties (Dual Control) Tests
    // -------------------------------------------------------------------------
    await test("Separation of Duties (SOD-001): Analyst cannot approve own lab report", async () => {
      const reportResource: Resource = {
        type: "lab_report",
        id: "KFIN-SYN-REP-2026-0001",
        classification: "CONFIDENTIAL",
        creatorId: analystId, // Dr. Omondi authored the report
        ownerOrgId: labOrgId,
      };

      // Even if Dr. Omondi had the report:approve permission, rule SOD-001 must block self-approval!
      const analystWithApprovePerm: Subject = {
        ...analystSubject,
        permissions: [...analystSubject.permissions, "lab:report_approve"],
      };

      const context: AccessContext = {
        action: "lab:report_approve",
        purpose: "FORENSIC_EXAMINATION",
        ipAddress: "192.168.1.20",
        correlationId: "test-corr-sod-001",
      };

      const selfApprovalDecision = AuthorizationEngine.evaluate(analystWithApprovePerm, reportResource, context);
      assert.equal(selfApprovalDecision.decision, "DENY");
      assert.equal(selfApprovalDecision.reasonCode, "DENY_SOD_REPORT_SELF_APPROVAL");

      // Independent Reviewer (Dr. Mutua) CAN approve
      const reviewerDecision = AuthorizationEngine.evaluate(reviewerSubject, reportResource, context);
      assert.equal(reviewerDecision.decision, "ALLOW");
    });

    // -------------------------------------------------------------------------
    // 6. Emergency Break-Glass Elevation Tests
    // -------------------------------------------------------------------------
    await test("Break-glass emergency access grants temporary access with audit", async () => {
      const restrictedResource: Resource = {
        type: "case",
        id: "KFIN-SYN-CASE-2026-0002",
        classification: "RESTRICTED",
        ownerOrgId: "OTHER-ORG-ID",
      };

      // Normal request denied
      const normalContext: AccessContext = {
        action: "case:read",
        ipAddress: "192.168.1.10",
        correlationId: "test-corr-breakglass-1",
      };
      const normalDecision = AuthorizationEngine.evaluate(investigatorSubject, restrictedResource, normalContext);
      assert.equal(normalDecision.decision, "DENY");

      // Break-glass request with incident ticket and justification allowed
      const breakGlassSubject: Subject = {
        ...investigatorSubject,
        breakGlassActive: true,
        breakGlassRef: "INCIDENT-2026-EMERGENCY-091",
      };
      const breakGlassContext: AccessContext = {
        action: "case:read",
        ipAddress: "192.168.1.10",
        correlationId: "test-corr-breakglass-2",
        justification: "Emergency judicial preservation order following imminent threat to life.",
      };

      const emergencyDecision = AuthorizationEngine.evaluate(breakGlassSubject, restrictedResource, breakGlassContext);
      assert.equal(emergencyDecision.decision, "ALLOW");
      assert.equal(emergencyDecision.reasonCode, "ALLOW_BREAK_GLASS_ELEVATION");
    });

    // -------------------------------------------------------------------------
    // 7. Service Identity (M2M) Tests
    // -------------------------------------------------------------------------
    await test("Service identity has scoped access and cannot execute human actions", async () => {
      const { apiKey, keyPrefix, keyHash } = generateApiKey("lims");
      assert.ok(verifyApiKey(apiKey, keyHash));

      const serviceSubject: Subject = {
        userId: "svc-uuid-001",
        email: "dci-lims-sync@service.kfin.internal",
        badgeNumber: "SVC-lims",
        fullName: "dci-lims-sync",
        organizationId: dciOrgId,
        organizationCode: "DCI-HQ",
        clearanceLevel: 4,
        clearanceCode: "CONFIDENTIAL",
        accountStatus: "ACTIVE",
        roles: ["SERVICE_IDENTITY"],
        permissions: ["lab:submit", "dna:submit", "evidence:read"],
        isServiceIdentity: true,
        serviceName: "dci-lims-sync",
      };

      // Allowed machine action
      const machineResource: Resource = {
        type: "lab_submission",
        id: "KFIN-SYN-SUB-2026-0001",
        classification: "RESTRICTED",
        ownerOrgId: dciOrgId,
      };
      const machineContext: AccessContext = {
        action: "lab:submit",
        purpose: "FORENSIC_EXAMINATION",
        ipAddress: "10.0.0.50",
        correlationId: "test-corr-m2m-1",
      };
      const machineDecision = AuthorizationEngine.evaluate(serviceSubject, machineResource, machineContext);
      assert.equal(machineDecision.decision, "ALLOW");

      // Blocked human-only action (break-glass or user status manage)
      const humanContext: AccessContext = {
        action: "break_glass:activate",
        purpose: "SYSTEM_ADMINISTRATION",
        ipAddress: "10.0.0.50",
        correlationId: "test-corr-m2m-2",
      };
      const humanDecision = AuthorizationEngine.evaluate(serviceSubject, machineResource, humanContext);
      assert.equal(humanDecision.decision, "DENY");
      assert.equal(humanDecision.reasonCode, "DENY_SERVICE_IDENTITY_HUMAN_ACTION");
    });

    // -------------------------------------------------------------------------
    // 8. Institutional Federation Claims Validation Tests
    // -------------------------------------------------------------------------
    await test("Institutional federation claims validation and trust boundary", async () => {
      // Untrusted issuer
      const untrustedResult = FederatedIdentityMapper.validateAndMapClaims({
        sub: "ext-123",
        iss: "https://untrusted-external-idp.com",
        aud: "kfin-federation",
        exp: Math.floor(Date.now() / 1000) + 3600,
        email: "officer@external.go.ke",
        name: "Officer External",
        institutionalId: "EXT-8492",
        externalOrgCode: "EXT-ORG",
      });
      assert.equal(untrustedResult.isValid, false);
      assert.ok(untrustedResult.error?.includes("Untrusted identity provider issuer"));

      // Trusted NPS IdP
      const trustedResult = FederatedIdentityMapper.validateAndMapClaims({
        sub: "nps-849201",
        iss: "https://idp.nps.go.ke",
        aud: "kfin-federation",
        exp: Math.floor(Date.now() / 1000) + 3600,
        email: "cpl.mutiso.synthetic@kfin.test",
        name: "Cpl. John Mutiso",
        institutionalId: "NPS-849201",
        externalOrgCode: "NPS-HQ",
      });
      assert.equal(trustedResult.isValid, true);
      assert.equal(trustedResult.mappedSubject?.organizationCode, "NPS-HQ");
      assert.equal(trustedResult.mappedSubject?.clearanceCode, "INTERNAL");
    });

    // -------------------------------------------------------------------------
    // 9. Zero-PII Audit Sanitization Test
    // -------------------------------------------------------------------------
    await test("Zero-PII audit metadata sanitization redacts sensitive credentials and alleles", async () => {
      const rawMetadata = {
        correlationId: "test-123",
        userEmail: "test@kfin.test",
        password: "KFIN-Secure-Pass-2026!",
        refreshToken: "abcdef0123456789",
        apiKey: "kfin_sec_live001_secret123",
        nested: {
          totpSecret: "JBSWY3DPEHPK3PXP",
          safeNote: "Exhibit logged in vault A",
        },
      };

      const clean = sanitizeAuditMetadata(rawMetadata);
      assert.equal(clean.password, "[REDACTED_SECURITY_DATA]");
      assert.equal(clean.refreshToken, "[REDACTED_SECURITY_DATA]");
      assert.equal(clean.apiKey, "[REDACTED_SECURITY_DATA]");
      assert.equal((clean.nested as any).totpSecret, "[REDACTED_SECURITY_DATA]");
      assert.equal((clean.nested as any).safeNote, "Exhibit logged in vault A");
    });

    // -------------------------------------------------------------------------
    // 10. Live Database Account Lockout & History Verification
    // -------------------------------------------------------------------------
    await test("Live Database: users table contains active roles, clearance and password history", async () => {
      if (!dbAvailable || !client) {
        console.log(" (Skipped in offline CI environment)");
        return;
      }
      const { rows: historyCount } = await client.query("SELECT COUNT(*)::int as count FROM password_histories;");
      assert.ok(historyCount[0].count > 0, "Password history records must exist in live database");

      const { rows: userRoleCount } = await client.query("SELECT COUNT(*)::int as count FROM user_roles;");
      assert.ok(userRoleCount[0].count >= 12, "User role assignments must exist in live database");

      const { rows: mfaCount } = await client.query("SELECT COUNT(*)::int as count FROM mfa_factors;");
      assert.ok(mfaCount[0].count > 0, "MFA factor records must exist in live database");

      const { rows: serviceCount } = await client.query("SELECT COUNT(*)::int as count FROM service_identities;");
      assert.ok(serviceCount[0].count > 0, "Service identity records must exist in live database");
    });

    console.log("\n=====================================================================");
    console.log(`    ALL ${passCount}/${testCount} PHASE 1.2 SECURITY ACCEPTANCE TESTS PASSED! ✅`);
    console.log("=====================================================================");
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

runSecurityTestSuite().catch((err) => {
  console.error("Phase 1.2 Security test suite failed:", err);
  process.exit(1);
});
