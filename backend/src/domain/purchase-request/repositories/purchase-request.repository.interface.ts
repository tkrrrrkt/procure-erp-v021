/**
 * Purchase Request Repository Interface
 * 
 * This interface defines the contract for purchase request persistence.
 * The actual implementation will be in the infrastructure layer.
 */
export interface IPurchaseRequestRepository {
  findById(id: string): Promise<PurchaseRequest | null>;
  findByRequestNumber(requestNumber: string): Promise<PurchaseRequest | null>;
  findByTenantId(tenantId: string, options?: FindOptions): Promise<PurchaseRequest[]>;
  save(entity: PurchaseRequest): Promise<void>;
  getNextSequenceNumber(tenantId: string): Promise<number>;
}

export interface FindOptions {
  status?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

// Placeholder - will be implemented when entity is created
export type PurchaseRequest = any;
