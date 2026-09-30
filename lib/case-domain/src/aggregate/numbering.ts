import crypto from "node:crypto";

/**
 * Generates an authoritative, human-readable KFIN Case Reference Number.
 * Format: KFIN-<ORG_PREFIX>-<YEAR>-<SEQUENTIAL_OR_HASH_HEX>
 * Example: KFIN-DCI-2026-004812
 */
export function generateCaseNumber(orgCode: string, date: Date = new Date()): string {
  const cleanOrg = orgCode.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 8) || "GEN";
  const year = date.getUTCFullYear();
  const entropy = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `KFIN-SYN-${cleanOrg}-${year}-${entropy}`;
}

const CASE_NUMBER_REGEX = /^KFIN-(?:SYN-)?[A-Z0-9]{2,12}-\d{4}-[A-Z0-9]{4,10}$/;

export function isValidCaseNumber(caseNumber: string): boolean {
  return CASE_NUMBER_REGEX.test(caseNumber.trim());
}
