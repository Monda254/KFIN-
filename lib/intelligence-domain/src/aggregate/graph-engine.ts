import {
  ForensicRelationshipData,
  GraphNode,
  GraphEdge,
  IntelligenceUserContext,
  RelationshipClass,
} from "../types.js";

export interface GraphTraversalOptions {
  rootEntityType: string;
  rootEntityId: string;
  maxDepth?: number;
  allowedClasses?: RelationshipClass[];
  allowedTypes?: string[];
}

export interface GraphTraversalResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  totalNodes: number;
  totalEdges: number;
  depthReached: number;
}

export class IntelligenceGraphEngine {
  public static traverse(
    options: GraphTraversalOptions,
    userContext: IntelligenceUserContext,
    relationships: ForensicRelationshipData[],
    entityMetadataResolver?: (entityType: string, entityId: string) => { label: string; orgId?: string; sensitivity?: string }
  ): GraphTraversalResult {
    const maxDepth = Math.min(Math.max(options.maxDepth || 1, 1), 3); // Depth capped at 3
    const rootId = `${options.rootEntityType}:${options.rootEntityId}`;

    const visitedNodes = new Map<string, GraphNode>();
    const visitedEdges = new Map<string, GraphEdge>();
    let currentLevelNodes = new Set<string>([rootId]);

    // Initial root node creation
    const rootMeta = entityMetadataResolver
      ? entityMetadataResolver(options.rootEntityType, options.rootEntityId)
      : { label: `${options.rootEntityType} ${options.rootEntityId}`, orgId: userContext.organizationId, sensitivity: "OFFICIAL" };

    visitedNodes.set(rootId, {
      id: rootId,
      entityType: options.rootEntityType,
      entityId: options.rootEntityId,
      label: rootMeta.label,
      organizationId: rootMeta.orgId || null,
      sensitivity: rootMeta.sensitivity || "OFFICIAL",
      isRedacted: false,
    });

    let currentDepth = 0;

    while (currentDepth < maxDepth && currentLevelNodes.size > 0) {
      currentDepth++;
      const nextLevelNodes = new Set<string>();

      for (const rel of relationships) {
        // Filter by class if specified
        if (options.allowedClasses && options.allowedClasses.length > 0) {
          if (!options.allowedClasses.includes(rel.relationshipClass)) {
            continue;
          }
        }
        // Filter by type if specified
        if (options.allowedTypes && options.allowedTypes.length > 0) {
          if (!options.allowedTypes.includes(rel.relationshipType)) {
            continue;
          }
        }

        const sourceId = `${rel.sourceEntityType}:${rel.sourceEntityId}`;
        const targetId = `${rel.targetEntityType}:${rel.targetEntityId}`;

        // Check if edge connects to any current level node
        let matchedSource: string | null = null;
        let matchedTarget: string | null = null;

        if (currentLevelNodes.has(sourceId)) {
          matchedSource = sourceId;
          matchedTarget = targetId;
        } else if (currentLevelNodes.has(targetId)) {
          matchedSource = targetId;
          matchedTarget = sourceId;
        }

        if (matchedSource && matchedTarget) {
          // Process target node authorization & disclosure
          const targetEntityType = matchedTarget.split(":")[0];
          const targetEntityId = matchedTarget.split(":")[1];

          const targetMeta = entityMetadataResolver
            ? entityMetadataResolver(targetEntityType, targetEntityId)
            : { label: `${targetEntityType} ${targetEntityId}`, orgId: rel.organizationId, sensitivity: "RESTRICTED" };

          const isCrossOrg = targetMeta.orgId && targetMeta.orgId !== userContext.organizationId;
          const hasCrossOrgPermission = userContext.permissions.includes("intelligence:cross_org_read") || userContext.clearanceLevel === "TOP_SECRET";

          let isRedacted = false;
          let displayLabel = targetMeta.label;

          if (isCrossOrg && !hasCrossOrgPermission) {
            isRedacted = true;
            displayLabel = `[RESTRICTED ${targetEntityType.toUpperCase()}]`;
          }

          if (!visitedNodes.has(matchedTarget)) {
            visitedNodes.set(matchedTarget, {
              id: matchedTarget,
              entityType: targetEntityType,
              entityId: targetEntityId,
              label: displayLabel,
              organizationId: targetMeta.orgId || null,
              sensitivity: isRedacted ? "RESTRICTED" : (targetMeta.sensitivity || "OFFICIAL"),
              isRedacted,
            });
            nextLevelNodes.add(matchedTarget);
          }

          // Edge recording
          if (!visitedEdges.has(rel.id)) {
            visitedEdges.set(rel.id, {
              id: rel.id,
              sourceNodeId: `${rel.sourceEntityType}:${rel.sourceEntityId}`,
              targetNodeId: `${rel.targetEntityType}:${rel.targetEntityId}`,
              relationshipType: rel.relationshipType,
              relationshipClass: rel.relationshipClass,
              provenanceSource: rel.provenanceSource,
              confidenceScore: rel.confidenceScore,
              isRestricted: isRedacted,
            });
          }
        }
      }

      currentLevelNodes = nextLevelNodes;
    }

    const nodesArray = Array.from(visitedNodes.values());
    const edgesArray = Array.from(visitedEdges.values());

    return {
      nodes: nodesArray,
      edges: edgesArray,
      totalNodes: nodesArray.length,
      totalEdges: edgesArray.length,
      depthReached: currentDepth,
    };
  }
}
