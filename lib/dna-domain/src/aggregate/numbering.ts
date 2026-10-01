export class DnaNumberGenerator {
  public static generateProfileIdentifier(prefix: string = "NPHL"): string {
    const year = new Date().getFullYear();
    const randomHex = Math.floor(100000 + Math.random() * 900000).toString(10);
    return `DNA-${prefix}-${year}-${randomHex}`;
  }

  public static generateSampleNumber(prefix: string = "SMP"): string {
    const year = new Date().getFullYear();
    const randomSeq = Math.floor(1000 + Math.random() * 9000).toString(10);
    return `${prefix}-${year}-${randomSeq}`;
  }

  public static isValidIdentifier(identifier: string): boolean {
    return /^DNA-[A-Z0-9]+-\d{4}-\d+$/.test(identifier);
  }
}
