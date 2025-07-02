/**
 * Base class for all domain exceptions
 */
export class DomainException extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Thrown when a business rule is violated
 */
export class BusinessRuleViolationException extends DomainException {
  constructor(message: string, details?: any) {
    super(message, 'BUSINESS_RULE_VIOLATION', details);
  }
}

/**
 * Thrown when an entity is not found
 */
export class EntityNotFoundException extends DomainException {
  constructor(entity: string, id: string) {
    super(`${entity} with id ${id} not found`, 'ENTITY_NOT_FOUND', { entity, id });
  }
}

/**
 * Thrown when user lacks necessary permissions
 */
export class InsufficientPermissionsException extends DomainException {
  constructor(action: string, resource: string) {
    super(`Insufficient permissions to ${action} ${resource}`, 'INSUFFICIENT_PERMISSIONS', {
      action,
      resource,
    });
  }
}

/**
 * Thrown when an operation is not allowed in current state
 */
export class InvalidOperationException extends DomainException {
  constructor(message: string, currentState: string, operation: string) {
    super(message, 'INVALID_OPERATION', { currentState, operation });
  }
}

/**
 * Thrown when validation fails
 */
export class ValidationException extends DomainException {
  constructor(errors: Record<string, string[]>) {
    super('Validation failed', 'VALIDATION_FAILED', errors);
  }
}
