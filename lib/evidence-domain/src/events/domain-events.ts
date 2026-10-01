import type { EvidenceStatus, SealStatus, EvidenceCondition, DispositionType } from "../types";

export interface EvidenceDomainEvent {
  eventId: string;
  eventType: string;
  evidenceId: string;
  caseId: string;
  timestamp: string;
  actorId: string;
  payload: Record<string, any>;
}

export type DomainEventListener = (event: EvidenceDomainEvent) => void | Promise<void>;

export class DomainEventPublisher {
  private static instance: DomainEventPublisher;
  private listeners: Map<string, DomainEventListener[]> = new Map();

  public static getInstance(): DomainEventPublisher {
    if (!DomainEventPublisher.instance) {
      DomainEventPublisher.instance = new DomainEventPublisher();
    }
    return DomainEventPublisher.instance;
  }

  public subscribe(eventType: string, listener: DomainEventListener): void {
    const existing = this.listeners.get(eventType) || [];
    this.listeners.set(eventType, [...existing, listener]);
  }

  public async publish(event: EvidenceDomainEvent): Promise<void> {
    const eventListeners = this.listeners.get(event.eventType) || [];
    const wildcardListeners = this.listeners.get("*") || [];
    const allListeners = [...eventListeners, ...wildcardListeners];

    for (const listener of allListeners) {
      try {
        await listener(event);
      } catch (err) {
        console.error(`Error in DomainEventListener for event ${event.eventType}:`, err);
      }
    }
  }

  public clearListeners(): void {
    this.listeners.clear();
  }
}

export function createEvidenceCreatedEvent(
  evidenceId: string,
  caseId: string,
  actorId: string,
  reference: string,
  type: string
): EvidenceDomainEvent {
  return {
    eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    eventType: "EvidenceCreated",
    evidenceId,
    caseId,
    timestamp: new Date().toISOString(),
    actorId,
    payload: { reference, type },
  };
}

export function createEvidenceSealedEvent(
  evidenceId: string,
  caseId: string,
  actorId: string,
  sealNumber: string
): EvidenceDomainEvent {
  return {
    eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    eventType: "EvidenceSealed",
    evidenceId,
    caseId,
    timestamp: new Date().toISOString(),
    actorId,
    payload: { sealNumber },
  };
}

export function createSealBrokenEvent(
  evidenceId: string,
  caseId: string,
  actorId: string,
  sealNumber: string,
  reason: string
): EvidenceDomainEvent {
  return {
    eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    eventType: "SealBroken",
    evidenceId,
    caseId,
    timestamp: new Date().toISOString(),
    actorId,
    payload: { sealNumber, reason },
  };
}

export function createCustodyTransferredEvent(
  evidenceId: string,
  caseId: string,
  actorId: string,
  fromActorId: string,
  toActorId: string,
  transferReason: string
): EvidenceDomainEvent {
  return {
    eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    eventType: "CustodyTransferred",
    evidenceId,
    caseId,
    timestamp: new Date().toISOString(),
    actorId,
    payload: { fromActorId, toActorId, transferReason },
  };
}

export function createCustodyReceivedEvent(
  evidenceId: string,
  caseId: string,
  actorId: string,
  locationId: string
): EvidenceDomainEvent {
  return {
    eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    eventType: "CustodyReceived",
    evidenceId,
    caseId,
    timestamp: new Date().toISOString(),
    actorId,
    payload: { locationId },
  };
}

export function createEvidenceRetrievedEvent(
  evidenceId: string,
  caseId: string,
  actorId: string,
  purpose: string
): EvidenceDomainEvent {
  return {
    eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    eventType: "EvidenceRetrieved",
    evidenceId,
    caseId,
    timestamp: new Date().toISOString(),
    actorId,
    payload: { purpose },
  };
}

export function createEvidenceReturnedEvent(
  evidenceId: string,
  caseId: string,
  actorId: string,
  locationId: string
): EvidenceDomainEvent {
  return {
    eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    eventType: "EvidenceReturned",
    evidenceId,
    caseId,
    timestamp: new Date().toISOString(),
    actorId,
    payload: { locationId },
  };
}

export function createDerivativeCreatedEvent(
  evidenceId: string,
  caseId: string,
  actorId: string,
  derivedEvidenceId: string,
  derivativeType: string
): EvidenceDomainEvent {
  return {
    eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    eventType: "DerivativeCreated",
    evidenceId,
    caseId,
    timestamp: new Date().toISOString(),
    actorId,
    payload: { derivedEvidenceId, derivativeType },
  };
}

export function createEvidenceDisposedEvent(
  evidenceId: string,
  caseId: string,
  actorId: string,
  dispositionType: DispositionType,
  method: string
): EvidenceDomainEvent {
  return {
    eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    eventType: "EvidenceDisposed",
    evidenceId,
    caseId,
    timestamp: new Date().toISOString(),
    actorId,
    payload: { dispositionType, method },
  };
}
