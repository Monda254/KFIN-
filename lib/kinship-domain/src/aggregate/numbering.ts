export class KinshipNumberGenerator {
  private static investigationCounter = 1000;
  private static analysisCounter = 5000;
  private static pedigreeCounter = 100;
  private static searchCounter = 3000;

  public static generateInvestigationNumber(orgCode: string = "NPHL"): string {
    const year = new Date().getFullYear();
    const count = (this.investigationCounter++).toString().padStart(5, "0");
    return `KIN-${orgCode.toUpperCase()}-${year}-${count}`;
  }

  public static generateAnalysisNumber(orgCode: string = "NPHL"): string {
    const year = new Date().getFullYear();
    const count = (this.analysisCounter++).toString().padStart(5, "0");
    return `KANA-${orgCode.toUpperCase()}-${year}-${count}`;
  }

  public static generatePedigreeNumber(): string {
    const year = new Date().getFullYear();
    const count = (this.pedigreeCounter++).toString().padStart(4, "0");
    return `PED-${year}-${count}`;
  }

  public static generateSearchNumber(orgCode: string = "NPHL"): string {
    const year = new Date().getFullYear();
    const count = (this.searchCounter++).toString().padStart(5, "0");
    return `FSR-${orgCode.toUpperCase()}-${year}-${count}`;
  }
}
