import type { FederatedIdentityClaims, Subject, ClassificationLevel } from "../types";

export interface TrustedIdpConfig {
  issuer: string;
  allowedAudience: string;
  organizationCode: string;
  defaultClearance: ClassificationLevel;
  defaultRole: string;
}

export const TRUSTED_FEDERATION_PROVIDERS: Record<string, TrustedIdpConfig> = {
  "https://idp.nps.go.ke": {
    issuer: "https://idp.nps.go.ke",
    allowedAudience: "kfin-federation",
    organizationCode: "NPS-HQ",
    defaultClearance: "INTERNAL",
    defaultRole: "INSTITUTIONAL_OFFICER",
  },
  "https://idp.judiciary.go.ke": {
    issuer: "https://idp.judiciary.go.ke",
    allowedAudience: "kfin-federation",
    organizationCode: "ODPP-HQ",
    defaultClearance: "RESTRICTED",
    defaultRole: "CASE_MANAGER",
  },
  "https://idp.dci.go.ke": {
    issuer: "https://idp.dci.go.ke",
    allowedAudience: "kfin-federation",
    organizationCode: "DCI-HQ",
    defaultClearance: "RESTRICTED",
    defaultRole: "INVESTIGATOR",
  },
};

export class FederatedIdentityMapper {
  public static validateAndMapClaims(claims: FederatedIdentityClaims): {
    isValid: boolean;
    error?: string;
    mappedSubject?: Partial<Subject>;
  } {
    // 1. Trust boundary: verify issuer
    const idpConfig = TRUSTED_FEDERATION_PROVIDERS[claims.iss];
    if (!idpConfig) {
      return {
        isValid: false,
        error: `Untrusted identity provider issuer: '${claims.iss}'`,
      };
    }

    // 2. Audience validation
    if (claims.aud !== idpConfig.allowedAudience) {
      return {
        isValid: false,
        error: `Invalid federation audience: expected '${idpConfig.allowedAudience}', received '${claims.aud}'`,
      };
    }

    // 3. Expiration verification
    const now = Math.floor(Date.now() / 1000);
    if (claims.exp <= now) {
      return {
        isValid: false,
        error: "Federated identity assertion token has expired",
      };
    }

    // 4. Required claims presence
    if (!claims.email || !claims.institutionalId || !claims.name) {
      return {
        isValid: false,
        error: "Missing mandatory federated identity claims (email, institutionalId, name)",
      };
    }

    // 5. Organizational mapping
    return {
      isValid: true,
      mappedSubject: {
        email: claims.email,
        fullName: claims.name,
        badgeNumber: claims.institutionalId,
        organizationCode: idpConfig.organizationCode,
        clearanceCode: idpConfig.defaultClearance,
        roles: [idpConfig.defaultRole],
        accountStatus: "ACTIVE",
      },
    };
  }
}
