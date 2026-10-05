import crypto from "node:crypto";

export interface IntelligenceNumberOptions {
  organizationPrefix?: string;
  isSynthetic?: boolean;
  year?: number;
}

export class IntelligenceNumberGenerator {
  public static generateRelationshipNumber(options?: IntelligenceNumberOptions): string {
    const org = (options?.organizationPrefix || "NPHL").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const synthMarker = options?.isSynthetic !== false ? "SYN-" : "";
    const year = options?.year || new Date().getUTCFullYear();
    const entropy = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `KFIN-REL-${synthMarker}${org}-${year}-${entropy}`;
  }

  public static generateObservationNumber(options?: IntelligenceNumberOptions): string {
    const org = (options?.organizationPrefix || "NPHL").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const synthMarker = options?.isSynthetic !== false ? "SYN-" : "";
    const year = options?.year || new Date().getUTCFullYear();
    const entropy = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `KFIN-OBS-${synthMarker}${org}-${year}-${entropy}`;
  }

  public static generateLeadNumber(options?: IntelligenceNumberOptions): string {
    const org = (options?.organizationPrefix || "NPHL").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const synthMarker = options?.isSynthetic !== false ? "SYN-" : "";
    const year = options?.year || new Date().getUTCFullYear();
    const entropy = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `KFIN-LEAD-${synthMarker}${org}-${year}-${entropy}`;
  }

  public static generateAnalysisNumber(options?: IntelligenceNumberOptions): string {
    const org = (options?.organizationPrefix || "NPHL").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const synthMarker = options?.isSynthetic !== false ? "SYN-" : "";
    const year = options?.year || new Date().getUTCFullYear();
    const entropy = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `KFIN-LNK-${synthMarker}${org}-${year}-${entropy}`;
  }
}
