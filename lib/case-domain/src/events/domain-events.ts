import type {
  CaseRecord,
  CaseStatus,
  CaseRole,
  ParticipantType,
  LinkType,
} from "../types";

export interface DomainEvent<T = unknown> {
  eventId: string;
  eventName: string;
  caseId: string;
  actorId: string;
  occurredAt: Date;
  payload: T;
}

export type DomainEventListener<T = unknown> = (event: DomainEvent<T>) => void | Promise<void>;

export class DomainEventPublisher {
  private static listeners: Map<string, DomainEventListener<any>[]> = new Map();

  public static subscribe<T>(eventName: string, listener: DomainEventListener<T>): () => void {
    const list = this.listeners.get(eventName) ?? [];
    list.push(listener);
    this.listeners.set(eventName, list);
    return () => {
      const idx = list.indexOf(listener);
      if (idx >= 0) list.splice(idx, 1);
    };
  }

  public static async publish<T>(event: DomainEvent<T>): Promise<void> {
    const list = this.listeners.get(event.eventName) ?? [];
    const wildcard = this.listeners.get("*") ?? [];
    const all = [...list, ...wildcard];
    for (const listener of all) {
      try {
        await listener(event);
      } catch (err) {
        console.error(`Error in event listener for ${event.eventName}:`, err);
      }
    }
  }

  public static clear(): void {
    this.listeners.clear();
  }
}

export function createDomainEvent<T>(
  eventName: string,
  caseId: string,
  actorId: string,
  payload: T
): DomainEvent<T> {
  return {
    eventId: crypto.randomUUID(),
    eventName,
    caseId,
    actorId,
    occurredAt: new Date(),
    payload,
  };
}
