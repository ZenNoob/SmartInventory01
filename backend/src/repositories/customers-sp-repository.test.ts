/**
 * Unit Tests for CustomersSPRepository
 * 
 * Tests stored procedure repository operations for customers.
 * Requirements: 3.1-3.5
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CustomersSPRepository, CreateCustomerSPInput, UpdateCustomerSPInput } from './customers-sp-repository';

// Mock the database connection module
vi.mock('../db/connection', () => ({
  getConnection: vi.fn(),
}));

describe('CustomersSPRepository', () => {
  let repository: CustomersSPRepository;
  let mockRequest: {
    input: ReturnType<typeof vi.fn>;
    execute: ReturnType<typeof vi.fn>;
  };
  let mockConnection: { request: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.clearAllMocks();

    mockRequest = {
      input: vi.fn().mockReturnThis(),
      execute: vi.fn(),
    };

    mockConnection = {
      request: vi.fn().mockReturnValue(mockRequest),
    };

    const { getConnection } = await import('../db/connection');
    (getConnection as ReturnType<typeof vi.fn>).mockResolvedValue(mockConnection);

    repository = new CustomersSPRepository();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('create', () => {
    it('should call sp_Customers_Create with correct parameters', async () => {
      const input: CreateCustomerSPInput = {
        id: 'cust-123',
        storeId: 'store-123',
        name: 'Test Customer',
        phone: '0123456789',
        email: 'test@example.com',
        address: '123 Test St',
        customerType: 'retail',
        loyaltyTier: 'bronze',
      };

      const mockCustomer = {
        Id: 'cust-123',
        store_id: input.storeId,
        name: input.name,
        full_name: input.name,
        phone: input.phone,
        email: input.email,
        address: input.address,
        customer_type: input.customerType,
        loyalty_tier: input.loyaltyTier,
        total_spent: 0,
        total_paid: 0,
        total_debt: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // First call for create, second for getByStore (used by getById)
      mockRequest.execute
        .mockResolvedValueOnce({ recordset: [{ Id: 'cust-123' }] })
        .mockResolvedValueOnce({ recordset: [mockCustomer] });

      const result = await repository.create(input);

      expect(mockRequest.execute).toHaveBeenCalledWith('sp_Customers_Create');
      expect(mockRequest.input).toHaveBeenCalledWith('storeId', input.storeId);
      expect(mockRequest.input).toHaveBeenCalledWith('name', input.name);
      expect(result.name).toBe(input.name);
      expect(result.storeId).toBe(input.storeId);
    });

    it('should throw error when customer creation fails', async () => {
      const input: CreateCustomerSPInput = {
        storeId: 'store-123',
        name: 'Test Customer',
      };

      mockRequest.execute
        .mockResolvedValueOnce({ recordset: [{ Id: 'cust-123' }] })
        .mockResolvedValueOnce({ recordset: [] });

      await expect(repository.create(input)).rejects.toThrow('Failed to create customer');
    });
  });

  describe('update', () => {
    it('should call sp_Customers_Update with correct parameters', async () => {
      const id = 'cust-123';
      const storeId = 'store-123';
      const data: UpdateCustomerSPInput = {
        name: 'Updated Customer',
        phone: '0987654321',
      };

      const mockCustomer = {
        Id: id,
        store_id: storeId,
        name: data.name,
        full_name: data.name,
        phone: data.phone,
        customer_type: 'retail',
        loyalty_tier: 'bronze',
        total_spent: 0,
        total_paid: 0,
        total_debt: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRequest.execute
        .mockResolvedValueOnce({ recordset: [{ AffectedRows: 1 }] })
        .mockResolvedValueOnce({ recordset: [mockCustomer] });

      const result = await repository.update(id, storeId, data);

      expect(mockRequest.execute).toHaveBeenCalledWith('sp_Customers_Update');
      expect(mockRequest.input).toHaveBeenCalledWith('id', id);
      expect(mockRequest.input).toHaveBeenCalledWith('storeId', storeId);
      expect(result?.name).toBe(data.name);
    });

    it('should return null when customer not found', async () => {
      mockRequest.execute.mockResolvedValueOnce({ recordset: [{ AffectedRows: 0 }] });

      const result = await repository.update('non-existent', 'store-123', { name: 'Test' });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should call sp_Customers_Delete and return true on success', async () => {
      mockRequest.execute.mockResolvedValueOnce({ recordset: [{ AffectedRows: 1 }] });

      const result = await repository.delete('cust-123', 'store-123');

      expect(mockRequest.execute).toHaveBeenCalledWith('sp_Customers_Delete');
      expect(mockRequest.input).toHaveBeenCalledWith('id', 'cust-123');
      expect(mockRequest.input).toHaveBeenCalledWith('storeId', 'store-123');
      expect(result).toBe(true);
    });

    it('should return false when customer not found', async () => {
      mockRequest.execute.mockResolvedValueOnce({ recordset: [{ AffectedRows: 0 }] });

      const result = await repository.delete('non-existent', 'store-123');

      expect(result).toBe(false);
    });
  });

  describe('getByStore', () => {
    it('should call sp_Customers_GetByStore and return customers', async () => {
      const mockCustomers = [
        {
          Id: 'cust-1',
          store_id: 'store-123',
          name: 'Customer 1',
          full_name: 'Customer 1',
          phone: '0123456789',
          customer_type: 'retail',
          loyalty_tier: 'bronze',
          total_spent: 1000,
          total_paid: 800,
          total_debt: 200,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          Id: 'cust-2',
          store_id: 'store-123',
          name: 'Customer 2',
          full_name: 'Customer 2',
          phone: '0987654321',
          customer_type: 'wholesale',
          loyalty_tier: 'silver',
          total_spent: 5000,
          total_paid: 5000,
          total_debt: 0,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockRequest.execute.mockResolvedValueOnce({ recordset: mockCustomers });

      const result = await repository.getByStore('store-123');

      expect(mockRequest.execute).toHaveBeenCalledWith('sp_Customers_GetByStore');
      expect(mockRequest.input).toHaveBeenCalledWith('storeId', 'store-123');
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Customer 1');
      expect(result[1].name).toBe('Customer 2');
    });
  });

  describe('updateDebt', () => {
    it('should call sp_Customers_UpdateDebt with correct parameters', async () => {
      mockRequest.execute.mockResolvedValueOnce({ recordset: [{ total_debt: 500 }] });

      const result = await repository.updateDebt('cust-123', 'store-123', 1000, 500);

      expect(mockRequest.execute).toHaveBeenCalledWith('sp_Customers_UpdateDebt');
      expect(mockRequest.input).toHaveBeenCalledWith('id', 'cust-123');
      expect(mockRequest.input).toHaveBeenCalledWith('storeId', 'store-123');
      expect(mockRequest.input).toHaveBeenCalledWith('spentAmount', 1000);
      expect(mockRequest.input).toHaveBeenCalledWith('paidAmount', 500);
      expect(result).toBe(500);
    });

    it('should return 0 when no result', async () => {
      mockRequest.execute.mockResolvedValueOnce({ recordset: [] });

      const result = await repository.updateDebt('cust-123', 'store-123', 100, 0);

      expect(result).toBe(0);
    });
  });

  describe('addSpent', () => {
    it('should call updateDebt with spent amount only', async () => {
      mockRequest.execute.mockResolvedValueOnce({ recordset: [{ total_debt: 1000 }] });

      const result = await repository.addSpent('cust-123', 'store-123', 1000);

      expect(mockRequest.input).toHaveBeenCalledWith('spentAmount', 1000);
      expect(mockRequest.input).toHaveBeenCalledWith('paidAmount', 0);
      expect(result).toBe(1000);
    });
  });

  describe('recordPayment', () => {
    it('should call updateDebt with paid amount only', async () => {
      mockRequest.execute.mockResolvedValueOnce({ recordset: [{ total_debt: 0 }] });

      const result = await repository.recordPayment('cust-123', 'store-123', 500);

      expect(mockRequest.input).toHaveBeenCalledWith('spentAmount', 0);
      expect(mockRequest.input).toHaveBeenCalledWith('paidAmount', 500);
      expect(result).toBe(0);
    });
  });
});
