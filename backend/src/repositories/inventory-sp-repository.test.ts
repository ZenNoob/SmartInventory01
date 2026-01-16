/**
 * Unit Tests for InventorySPRepository
 * 
 * Tests stored procedure repository operations for inventory.
 * Requirements: 4.1-4.4
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { InventorySPRepository } from './inventory-sp-repository';

// Mock the database connection module
vi.mock('../db/connection', () => ({
  getConnection: vi.fn(),
}));

describe('InventorySPRepository', () => {
  let repository: InventorySPRepository;
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

    repository = new InventorySPRepository();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAvailable', () => {
    it('should call sp_Inventory_GetAvailable with correct parameters', async () => {
      mockRequest.execute.mockResolvedValueOnce({ 
        recordset: [{ AvailableQuantity: 100 }] 
      });

      const result = await repository.getAvailable('prod-123', 'store-123', 'unit-123');

      expect(mockRequest.execute).toHaveBeenCalledWith('sp_Inventory_GetAvailable');
      expect(mockRequest.input).toHaveBeenCalledWith('productId', 'prod-123');
      expect(mockRequest.input).toHaveBeenCalledWith('storeId', 'store-123');
      expect(mockRequest.input).toHaveBeenCalledWith('unitId', 'unit-123');
      expect(result).toBe(100);
    });

    it('should return 0 when no inventory found', async () => {
      mockRequest.execute.mockResolvedValueOnce({ recordset: [] });

      const result = await repository.getAvailable('prod-123', 'store-123', 'unit-123');

      expect(result).toBe(0);
    });
  });

  describe('add', () => {
    it('should call sp_Inventory_Add with correct parameters', async () => {
      mockRequest.execute.mockResolvedValueOnce({ 
        recordset: [{ Quantity: 150 }] 
      });

      const result = await repository.add('prod-123', 'store-123', 'unit-123', 50);

      expect(mockRequest.execute).toHaveBeenCalledWith('sp_Inventory_Add');
      expect(mockRequest.input).toHaveBeenCalledWith('productId', 'prod-123');
      expect(mockRequest.input).toHaveBeenCalledWith('storeId', 'store-123');
      expect(mockRequest.input).toHaveBeenCalledWith('unitId', 'unit-123');
      expect(mockRequest.input).toHaveBeenCalledWith('quantity', 50);
      expect(result).toBe(150);
    });

    it('should return 0 when result is empty', async () => {
      mockRequest.execute.mockResolvedValueOnce({ recordset: [] });

      const result = await repository.add('prod-123', 'store-123', 'unit-123', 50);

      expect(result).toBe(0);
    });
  });

  describe('deduct', () => {
    it('should call sp_Inventory_Deduct with correct parameters', async () => {
      mockRequest.execute.mockResolvedValueOnce({ 
        recordset: [{ Quantity: 50 }] 
      });

      const result = await repository.deduct('prod-123', 'store-123', 'unit-123', 50);

      expect(mockRequest.execute).toHaveBeenCalledWith('sp_Inventory_Deduct');
      expect(mockRequest.input).toHaveBeenCalledWith('productId', 'prod-123');
      expect(mockRequest.input).toHaveBeenCalledWith('storeId', 'store-123');
      expect(mockRequest.input).toHaveBeenCalledWith('unitId', 'unit-123');
      expect(mockRequest.input).toHaveBeenCalledWith('quantity', 50);
      expect(result).toBe(50);
    });

    it('should return 0 when result is empty', async () => {
      mockRequest.execute.mockResolvedValueOnce({ recordset: [] });

      const result = await repository.deduct('prod-123', 'store-123', 'unit-123', 50);

      expect(result).toBe(0);
    });
  });

  describe('sync', () => {
    it('should call sp_Inventory_Sync with correct parameters', async () => {
      mockRequest.execute.mockResolvedValueOnce({ 
        recordset: [{ SyncedCount: 25 }] 
      });

      const result = await repository.sync('store-123');

      expect(mockRequest.execute).toHaveBeenCalledWith('sp_Inventory_Sync');
      expect(mockRequest.input).toHaveBeenCalledWith('storeId', 'store-123');
      expect(result).toBe(25);
    });

    it('should return 0 when no records synced', async () => {
      mockRequest.execute.mockResolvedValueOnce({ recordset: [] });

      const result = await repository.sync('store-123');

      expect(result).toBe(0);
    });
  });

  describe('hasSufficientStock', () => {
    it('should return true when stock is sufficient', async () => {
      mockRequest.execute.mockResolvedValueOnce({ 
        recordset: [{ AvailableQuantity: 100 }] 
      });

      const result = await repository.hasSufficientStock('prod-123', 'store-123', 'unit-123', 50);

      expect(result).toBe(true);
    });

    it('should return false when stock is insufficient', async () => {
      mockRequest.execute.mockResolvedValueOnce({ 
        recordset: [{ AvailableQuantity: 30 }] 
      });

      const result = await repository.hasSufficientStock('prod-123', 'store-123', 'unit-123', 50);

      expect(result).toBe(false);
    });

    it('should return true when stock equals required quantity', async () => {
      mockRequest.execute.mockResolvedValueOnce({ 
        recordset: [{ AvailableQuantity: 50 }] 
      });

      const result = await repository.hasSufficientStock('prod-123', 'store-123', 'unit-123', 50);

      expect(result).toBe(true);
    });
  });
});
