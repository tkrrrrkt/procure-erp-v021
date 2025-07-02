import { Injectable } from '@nestjs/common';

/**
 * Mock Prisma Service for Testing
 * データベース接続なしでテスト実行を可能にする
 */
@Injectable()
export class PrismaMockService {
  // Mock data storage
  private mockData: { [key: string]: any[] } = {
    users: [],
    tenants: [],
    procurementRequests: [],
    vendors: [],
    quotations: [],
    approvalWorkflows: [],
    auditLogs: []
  };

  // Mock Prisma Client methods
  $connect = jest.fn().mockResolvedValue(undefined);
  $disconnect = jest.fn().mockResolvedValue(undefined);
  $executeRaw = jest.fn();
  $queryRaw = jest.fn();
  $transaction = jest.fn();

  // Mock model methods
  user = {
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation(data => ({ id: '1', ...data.data })),
    update: jest.fn().mockImplementation(data => ({ id: data.where.id, ...data.data })),
    delete: jest.fn().mockResolvedValue({ id: '1' }),
    count: jest.fn().mockResolvedValue(0),
  };

  tenant = {
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation(data => ({ id: '1', ...data.data })),
    update: jest.fn().mockImplementation(data => ({ id: data.where.id, ...data.data })),
    delete: jest.fn().mockResolvedValue({ id: '1' }),
    count: jest.fn().mockResolvedValue(0),
  };

  procurementRequest = {
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation(data => ({ id: '1', ...data.data })),
    update: jest.fn().mockImplementation(data => ({ id: data.where.id, ...data.data })),
    delete: jest.fn().mockResolvedValue({ id: '1' }),
    count: jest.fn().mockResolvedValue(0),
  };

  purchaseRequest = {
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation(data => ({ id: '1', ...data.data })),
    update: jest.fn().mockImplementation(data => ({ id: data.where.id, ...data.data })),
    delete: jest.fn().mockResolvedValue({ id: '1' }),
    count: jest.fn().mockResolvedValue(0),
  };

  vendor = {
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation(data => ({ id: '1', ...data.data })),
    update: jest.fn().mockImplementation(data => ({ id: data.where.id, ...data.data })),
    delete: jest.fn().mockResolvedValue({ id: '1' }),
    count: jest.fn().mockResolvedValue(0),
  };

  quotation = {
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation(data => ({ id: '1', ...data.data })),
    update: jest.fn().mockImplementation(data => ({ id: data.where.id, ...data.data })),
    delete: jest.fn().mockResolvedValue({ id: '1' }),
    count: jest.fn().mockResolvedValue(0),
  };

  approvalWorkflow = {
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation(data => ({ id: '1', ...data.data })),
    update: jest.fn().mockImplementation(data => ({ id: data.where.id, ...data.data })),
    delete: jest.fn().mockResolvedValue({ id: '1' }),
    count: jest.fn().mockResolvedValue(0),
  };

  auditLog = {
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation(data => ({ id: '1', ...data.data })),
    update: jest.fn().mockImplementation(data => ({ id: data.where.id, ...data.data })),
    delete: jest.fn().mockResolvedValue({ id: '1' }),
    count: jest.fn().mockResolvedValue(0),
  };

  // Lifecycle methods
  async onModuleInit() {
    // Mock initialization - no actual DB connection
    console.log('[Test] Mock Prisma Service initialized');
  }

  async onModuleDestroy() {
    // Mock cleanup
    console.log('[Test] Mock Prisma Service destroyed');
  }

  // Test utilities
  resetMockData() {
    Object.keys(this.mockData).forEach(key => {
      this.mockData[key] = [];
    });
  }

  setMockData(model: string, data: any[]) {
    if (this.mockData[model]) {
      this.mockData[model] = data;
    }
  }

  getMockData(model: string) {
    return this.mockData[model] || [];
  }
}
