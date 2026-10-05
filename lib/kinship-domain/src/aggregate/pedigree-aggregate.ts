import {
  PedigreeData,
  PedigreeNodeData,
  PedigreeRelationshipData,
  PedigreeVersionSnapshot,
  PedigreeNodeStatus,
  RelationshipType,
} from "../types";

export class PedigreeAggregate {
  private pedigree: PedigreeData;
  private history: PedigreeVersionSnapshot[] = [];

  constructor(pedigree: PedigreeData) {
    this.pedigree = pedigree;
    // Store initial version snapshot
    this.history.push({
      versionNumber: pedigree.currentVersionNumber,
      pedigreeId: pedigree.id,
      snapshotData: {
        nodes: JSON.parse(JSON.stringify(pedigree.nodes)),
        relationships: JSON.parse(JSON.stringify(pedigree.relationships)),
      },
      changeReason: "Initial pedigree creation",
      changedById: "SYSTEM",
      createdAt: pedigree.createdAt,
    });
  }

  public get data(): PedigreeData {
    return { ...this.pedigree };
  }

  public get versionHistory(): readonly PedigreeVersionSnapshot[] {
    return [...this.history];
  }

  public addNode(
    node: Omit<PedigreeNodeData, "id" | "pedigreeId" | "createdAt">,
    actorId: string,
    reason: string
  ): PedigreeNodeData {
    const newNode: PedigreeNodeData = {
      ...node,
      id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      pedigreeId: this.pedigree.id,
      createdAt: new Date(),
    };
    this.pedigree.nodes.push(newNode);
    this.recordNewVersion(actorId, reason);
    return newNode;
  }

  public addRelationship(
    relationship: Omit<PedigreeRelationshipData, "id" | "pedigreeId" | "createdAt">,
    actorId: string,
    reason: string
  ): PedigreeRelationshipData {
    const newRel: PedigreeRelationshipData = {
      ...relationship,
      id: `rel-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      pedigreeId: this.pedigree.id,
      createdAt: new Date(),
    };
    this.pedigree.relationships.push(newRel);
    this.recordNewVersion(actorId, reason);
    return newRel;
  }

  public updateRelationshipStatus(
    relationshipId: string,
    newStatus: PedigreeNodeStatus,
    actorId: string,
    reason: string
  ): void {
    const rel = this.pedigree.relationships.find((r) => r.id === relationshipId);
    if (!rel) {
      throw new Error(`Pedigree relationship ${relationshipId} not found`);
    }
    rel.relationshipStatus = newStatus;
    this.recordNewVersion(actorId, reason);
  }

  private recordNewVersion(actorId: string, reason: string): void {
    this.pedigree.currentVersionNumber += 1;
    this.pedigree.updatedAt = new Date();
    const snapshot: PedigreeVersionSnapshot = {
      versionNumber: this.pedigree.currentVersionNumber,
      pedigreeId: this.pedigree.id,
      snapshotData: {
        nodes: JSON.parse(JSON.stringify(this.pedigree.nodes)),
        relationships: JSON.parse(JSON.stringify(this.pedigree.relationships)),
      },
      changeReason: reason,
      changedById: actorId,
      createdAt: this.pedigree.updatedAt,
    };
    this.history.push(snapshot);
  }

  public getVersionSnapshot(versionNumber: number): PedigreeVersionSnapshot | undefined {
    return this.history.find((h) => h.versionNumber === versionNumber);
  }
}
