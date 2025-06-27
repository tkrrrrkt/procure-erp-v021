import { Injectable, NestInterceptor, ExecutionContext, CallHandler, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(
    private prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    // Check if the route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    // Skip tenant validation for public routes
    if (isPublic) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();

    // Get tenant ID from authenticated user or header
    let tenantId = request.user?.tenantId;
    
    if (!tenantId) {
      // Try to get from header (for service-to-service calls)
      tenantId = request.headers['x-tenant-id'];
    }

    if (!tenantId) {
      throw new BadRequestException('Tenant context is required');
    }

    // Load tenant details
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new BadRequestException('Invalid tenant');
    }

    if (tenant.status !== 'ACTIVE') {
      throw new BadRequestException('Tenant is not active');
    }

    // Attach tenant to request
    request.tenant = tenant;
    request.tenantId = tenant.id;

    // Set up Prisma middleware for automatic tenant filtering
    this.prisma.$use(async (params, next) => {
      // List of models that should be filtered by tenant
      const tenantModels = [
        'User',
        'Department',
        'Vendor',
        'Product',
        'Warehouse',
        'PurchaseRequest',
        'PurchaseOrder',
        'AuditLog',
      ];

      if (params.model && tenantModels.includes(params.model)) {
        // Add tenant filter to queries
        if (params.action === 'findMany' || params.action === 'findFirst' || params.action === 'findUnique') {
          params.args = params.args || {};
          params.args.where = {
            ...params.args.where,
            tenant_id: tenantId,
          };
        }

        // Add tenant to create operations
        if (params.action === 'create') {
          params.args = params.args || {};
          params.args.data = {
            ...params.args.data,
            tenant_id: tenantId,
          };
        }

        // Add tenant filter to update operations
        if (params.action === 'update' || params.action === 'updateMany') {
          params.args = params.args || {};
          params.args.where = {
            ...params.args.where,
            tenant_id: tenantId,
          };
        }

        // Add tenant filter to delete operations
        if (params.action === 'delete' || params.action === 'deleteMany') {
          params.args = params.args || {};
          params.args.where = {
            ...params.args.where,
            tenant_id: tenantId,
          };
        }
      }

      return next(params);
    });

    return next.handle();
  }
}
