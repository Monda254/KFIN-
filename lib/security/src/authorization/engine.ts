import {
  CLASSIFICATION_TIERS,
  VALID_PURPOSES,
  type Subject,
  type Resource,
  type AccessContext,
  type AuthorizationDecision,
  type AccessPurpose,
} from "../types";
import { ACTION_POLICIES, type ActionPolicy } from "./matrix";

const POLICY_VERSION = "KFIN-SEC-POL-1.2.0";

export class AuthorizationEngine {
  public static evaluate(
    subject: Subject,
    resource: Resource,
    context: AccessContext
  ): AuthorizationDecision {
    const evaluatedAt = new Date().toISOString();
    const action = context.action;

    // Helper to construct decision response
    const buildDecision = (
      decision: "ALLOW" | "DENY",
      reasonCode: string,
      explanation: string
    ): AuthorizationDecision => ({
      decision,
      reasonCode,
      explanation,
      evaluatedAt,
      policyVersion: POLICY_VERSION,
      auditPayload: {
        action,
        outcome: decision === "ALLOW" ? "SUCCESS" : "DENIED",
        entityType: resource.type,
        entityId: resource.id,
        actorId: subject.userId,
        reason: `${reasonCode}: ${explanation}`,
        metadata: {
          policyVersion: POLICY_VERSION,
          subjectOrg: subject.organizationCode,
          subjectClearance: subject.clearanceCode,
          resourceClassification: resource.classification,
          correlationId: context.correlationId,
          ipAddress: context.ipAddress,
          purpose: context.purpose,
          breakGlass: !!subject.breakGlassActive,
        },
      },
    });

    try {
      // -----------------------------------------------------------------------
      // 1. IDENTITY & ACCOUNT LIFECYCLE CHECK
      // -----------------------------------------------------------------------
      if (subject.accountStatus !== "ACTIVE") {
        return buildDecision(
          "DENY",
          `DENY_ACCOUNT_${subject.accountStatus}`,
          `Account is in '${subject.accountStatus}' state and is not permitted to perform any actions.`
        );
      }

      // -----------------------------------------------------------------------
      // 2. ACTION POLICY RESOLUTION
      // -----------------------------------------------------------------------
      const actionPolicy: ActionPolicy | undefined = ACTION_POLICIES[action];
      if (!actionPolicy) {
        return buildDecision(
          "DENY",
          "DENY_UNKNOWN_ACTION",
          `Action '${action}' is not defined in authoritative KFIN policy catalog (Default Deny).`
        );
      }

      // -----------------------------------------------------------------------
      // 3. SERVICE IDENTITY CONSTRAINTS
      // -----------------------------------------------------------------------
      if (subject.isServiceIdentity) {
        const humanOnlyActions = [
          "break_glass:activate",
          "user:status_manage",
          "clearance:assign",
          "role:manage",
          "disclosure:create",
          "lab:report_approve",
        ];
        if (humanOnlyActions.includes(action)) {
          return buildDecision(
            "DENY",
            "DENY_SERVICE_IDENTITY_HUMAN_ACTION",
            `M2M Service identity cannot perform human-only administrative action '${action}'.`
          );
        }
      }

      // -----------------------------------------------------------------------
      // 4. PERMISSION VERIFICATION
      // -----------------------------------------------------------------------
      const hasDirectPermission =
        subject.permissions.includes(actionPolicy.requiredPermission) ||
        subject.permissions.includes(action);

      // Handle emergency break-glass elevation
      const isBreakGlassActive = Boolean(
        subject.breakGlassActive && context.justification
      );

      if (!hasDirectPermission && !isBreakGlassActive) {
        return buildDecision(
          "DENY",
          "DENY_INSUFFICIENT_PERMISSION",
          `Subject lacks required atomic permission '${actionPolicy.requiredPermission}'.`
        );
      }

      // -----------------------------------------------------------------------
      // 5. SECURITY CLEARANCE VS RESOURCE CLASSIFICATION
      // -----------------------------------------------------------------------
      const requiredClearanceTier = CLASSIFICATION_TIERS[resource.classification];
      const minActionClearanceTier = CLASSIFICATION_TIERS[actionPolicy.minimumClearance];

      if (subject.clearanceLevel < requiredClearanceTier) {
        return buildDecision(
          "DENY",
          "DENY_INSUFFICIENT_CLEARANCE_RESOURCE",
          `Clearance level (${subject.clearanceCode}=${subject.clearanceLevel}) is insufficient for resource classification (${resource.classification}=${requiredClearanceTier}).`
        );
      }

      if (subject.clearanceLevel < minActionClearanceTier) {
        return buildDecision(
          "DENY",
          "DENY_INSUFFICIENT_CLEARANCE_ACTION",
          `Clearance level (${subject.clearanceCode}=${subject.clearanceLevel}) is insufficient for action minimum clearance (${actionPolicy.minimumClearance}=${minActionClearanceTier}).`
        );
      }

      // -----------------------------------------------------------------------
      // 6. SEPARATION OF DUTIES (SOD) ENFORCEMENT
      // -----------------------------------------------------------------------
      // Rule SOD-001: Peer review - Report author cannot approve their own report
      if (action === "lab:report_approve" && resource.creatorId && resource.creatorId === subject.userId) {
        return buildDecision(
          "DENY",
          "DENY_SOD_REPORT_SELF_APPROVAL",
          "Separation of Duties violation: A laboratory analyst cannot review or approve their own examination report."
        );
      }

      // Rule SOD-002: Privilege escalation prevention - User cannot modify their own roles or clearance
      if (
        (action === "role:manage" || action === "clearance:assign" || action === "user:status_manage") &&
        resource.type === "user" &&
        resource.id === subject.userId
      ) {
        return buildDecision(
          "DENY",
          "DENY_SOD_SELF_MODIFICATION",
          "Separation of Duties violation: A user cannot modify their own security clearance, roles, or account status."
        );
      }

      // Rule SOD-003: Audit log immutability
      if (resource.type === "audit_event" && (action.includes("update") || action.includes("delete"))) {
        return buildDecision(
          "DENY",
          "DENY_IMMUTABLE_AUDIT_LOG",
          "Forensic integrity violation: Audit logs are append-only and strictly immutable."
        );
      }

      // -----------------------------------------------------------------------
      // 7. PURPOSE-BASED ACCESS VALIDATION
      // -----------------------------------------------------------------------
      if (actionPolicy.requiresPurpose) {
        if (!context.purpose) {
          return buildDecision(
            "DENY",
            "DENY_PURPOSE_REQUIRED",
            `Action '${action}' requires an explicit lawful purpose.`
          );
        }

        if (!VALID_PURPOSES.includes(context.purpose as AccessPurpose)) {
          return buildDecision(
            "DENY",
            "DENY_INVALID_PURPOSE",
            `Purpose '${context.purpose}' is not an authorized KFIN purpose.`
          );
        }
      }

      // -----------------------------------------------------------------------
      // 8. ORGANIZATIONAL SCOPE & MULTI-INSTITUTIONAL BOUNDARIES
      // -----------------------------------------------------------------------
      if (resource.ownerOrgId && resource.ownerOrgId !== subject.organizationId) {
        // Cross-institutional access check
        const isAssigned = resource.assignedUserIds?.includes(subject.userId);
        const isJoint = resource.isJointJurisdiction;
        const isAuditorOrLiaison =
          subject.roles.includes("AUDITOR") ||
          subject.roles.includes("INSTITUTIONAL_OFFICER");

        const isAllowedCrossOrg =
          actionPolicy.allowCrossOrg && (isAssigned || isJoint || isAuditorOrLiaison);

        // Break-glass exception
        if (!isAllowedCrossOrg && !isBreakGlassActive) {
          return buildDecision(
            "DENY",
            "DENY_CROSS_ORGANIZATION_BOUNDARY",
            `Resource belongs to organization '${resource.ownerOrgId}' which does not match subject's organization '${subject.organizationId}', and no cross-institution authorization exists.`
          );
        }
      }

      // -----------------------------------------------------------------------
      // 9. CASE / OBJECT-LEVEL ACCESS (IDOR/BOLA DEFENSE)
      // -----------------------------------------------------------------------
      if (resource.type === "case" || resource.caseId) {
        if (resource.ownerOrgId && resource.ownerOrgId !== subject.organizationId) {
          const isParticipantOrAssigned = resource.assignedUserIds?.includes(subject.userId);
          const isAuditor = subject.roles.includes("AUDITOR");

          if (!isParticipantOrAssigned && !isAuditor && !isBreakGlassActive) {
            return buildDecision(
              "DENY",
              "DENY_OBJECT_UNAUTHORIZED",
              "Broken Object Level Authorization (BOLA/IDOR): Subject is not assigned to this case or exhibit."
            );
          }
        }
      }

      // -----------------------------------------------------------------------
      // 10. SUCCESS: AUTHORIZED ACCESS GRANTED
      // -----------------------------------------------------------------------
      const allowReason = isBreakGlassActive
        ? "ALLOW_BREAK_GLASS_ELEVATION"
        : "ALLOW_POLICY_PERMITTED";

      const explanation = isBreakGlassActive
        ? `Access temporarily granted via emergency break-glass elevation: ${context.justification}`
        : `Authorized: Subject verified with permission '${actionPolicy.requiredPermission}', clearance '${subject.clearanceCode}', and organizational scope.`;

      return buildDecision("ALLOW", allowReason, explanation);
    } catch (err: any) {
      // Fail Closed in case of any evaluation error
      return buildDecision(
        "DENY",
        "DENY_FAIL_CLOSED_ERROR",
        `Authorization engine encountered internal failure: ${err.message}. Defaulting to closed denial.`
      );
    }
  }
}
