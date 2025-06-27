import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../database/prisma.service';
import { Reflector } from '@nestjs/core';

export interface AuditMetadata {
  action: string;
  resource: string;
  captureChanges?: boolean;
}

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const controller = context.getClass();

    // Get audit metadata from decorator
    const auditMetadata = this.reflector.getAllAndOverride<AuditMetadata>('audit', [
      handler,
      controller,
    ]);

    if (!auditMetadata) {
      // No audit required for this endpoint
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap(async (response) => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        try {
          const auditLog = {
            tenant_id: request.tenantId,
            user_id: request.user?.id,
            auth0_user_id: request.user?.sub,
            action: auditMetadata.action,
            resource: auditMetadata.resource,
            resource_id: response?.id || null,
            ip_address: request.ip || request.connection.remoteAddress,
            user_agent: request.headers['user-agent'],
            changes: auditMetadata.captureChanges ? response : null,
          };

          await this.prisma.auditLog.create({
            data: auditLog,
          });
        } catch (error) {
          // Log error but don't fail the request
          console.error('Failed to create audit log:', error);
        }
      }),
    );
  }
}

/**
 * Decorator to mark endpoints for audit logging
 */
export const Audit = (metadata: AuditMetadata) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('audit', metadata, descriptor.value);
    return descriptor;
  };
};
