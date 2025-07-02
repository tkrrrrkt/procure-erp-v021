import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get<string>('DATABASE_URL'),
        },
      },
      log:
        configService.get<string>('NODE_ENV') === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Execute a transaction with automatic rollback on error
   */
  async transaction<T>(fn: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    return this.$transaction(fn);
  }

  /**
   * Clean the database (for testing)
   */
  async cleanDatabase() {
    if (this.configService.get<string>('NODE_ENV') !== 'test') {
      throw new Error('cleanDatabase can only be used in test environment');
    }

    // Manually delete from each table in correct order to respect foreign key constraints
    await this.$transaction(async (tx) => {
      // Delete in reverse order of dependencies
      await tx.auditLog.deleteMany();
      await tx.vendorProduct.deleteMany();
      await tx.inventoryItem.deleteMany();
      await tx.purchaseOrderItem.deleteMany();
      await tx.purchaseOrder.deleteMany();
      await tx.purchaseRequestItem.deleteMany();
      await tx.purchaseRequest.deleteMany();
      await tx.userRole.deleteMany();
      await tx.rolePermission.deleteMany();
      await tx.role.deleteMany();
      await tx.permission.deleteMany();
      await tx.user.deleteMany();
      await tx.warehouse.deleteMany();
      await tx.product.deleteMany();
      await tx.vendor.deleteMany();
      await tx.department.deleteMany();
      await tx.tenant.deleteMany();
    });
  }
}
