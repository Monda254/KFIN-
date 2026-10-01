import crypto from "node:crypto";

export interface EvidenceNumberOptions {
  organizationPrefix: string;
  isSynthetic?: boolean;
  year?: number;
}

export class EvidenceNumberGenerator {
  public static generate(options: EvidenceNumberOptions): string {
    const org = (options.organizationPrefix || "KFIN")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");

    const synthMarker = options.isSynthetic !== false ? "SYN-" : "";
    const year = options.year || new Date().getUTCFullYear();
    const entropy = crypto.randomBytes(3).toString("hex").toUpperCase();

    return `KFIN-EVD-${synthMarker}${org}-${year}-${entropy}`;
  }

  public static isValid(reference: string): boolean {
    const regex = /^KFIN-EVD-(?:SYN-)?[A-Z0-9]{2,12}-\d{4}-[A-Z0-9]{4,10}$/;
    return regex.test(reference);
  }
}
