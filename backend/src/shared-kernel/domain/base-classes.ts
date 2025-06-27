import { randomUUID } from 'crypto';

/**
 * Base class for all domain entities
 */
export abstract class Entity<T> {
  protected readonly _id: string;
  public readonly props: T;

  constructor(props: T, id?: string) {
    this._id = id || randomUUID();
    this.props = props;
  }

  get id(): string {
    return this._id;
  }

  equals(entity: Entity<T>): boolean {
    if (entity === null || entity === undefined) {
      return false;
    }
    if (this === entity) {
      return true;
    }
    return this._id === entity._id;
  }
}

/**
 * Base class for aggregate roots
 */
export abstract class AggregateRoot<T> extends Entity<T> {
  private _domainEvents: DomainEvent[] = [];
  protected _version: number = 0;

  get domainEvents(): DomainEvent[] {
    return this._domainEvents;
  }

  get version(): number {
    return this._version;
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  clearEvents(): void {
    this._domainEvents = [];
  }

  markEventsAsCommitted(): void {
    this._domainEvents = [];
  }

  incrementVersion(): void {
    this._version++;
  }
}

/**
 * Base interface for domain events
 */
export interface DomainEvent {
  aggregateId: string;
  eventType: string;
  eventVersion: number;
  occurredAt: Date;
  payload: any;
}

/**
 * Base class for domain events
 */
export abstract class BaseDomainEvent implements DomainEvent {
  public readonly occurredAt: Date;
  public readonly eventVersion: number = 1;

  constructor(
    public readonly aggregateId: string,
    public readonly eventType: string,
    public readonly payload: any,
  ) {
    this.occurredAt = new Date();
  }
}
