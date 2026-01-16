/**
 * Unit Tests for ProductsSPRepository
 * 
 * Tests stored procedure repository operations for products.
 * Requirements: 1.1-1.5
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ProductsSPRepository, CreateProductSPInput, UpdateProductSPInput } from './products-sp-repository';

// Mock the database connection module
vi.mock('../db/connection', () => ({
  getConnection: vi.fn(),
}));

describe('ProductsSPRepository', () => {
  let repository: ProductsSPRepository;
  let mockRequest: {
    input: ReturnType<typeof vi.fn>;
    execute: ReturnType<typeof vi.fn>;
  };
  let mockConnection: { request: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();

    // Create mock request object
    mockRequest = {
      input: vi.fn().mockReturnThis(),
      execute: vi.fn(),
    };

    // Create mock connection
    mockConnection = {
      request: vi.fn().mockReturnValue(mockRequest),
    };

    // Setup getConnection mock
    const { getConnection } = await import('../db/connection');
    (getConnection as ReturnType<typeof vi.fn>).mockResolvedValue(mockConnection);

    repository = new ProductsSPRepository();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('create', () => {
    it('should call sp_Products_Create with correct parameters', async () => {
      const input: CreateProductSPInput = {
        storeId: 'store-123',
        name: 'Test Product',
        price: 100,
        costPrice: 80,
        categoryId: 'cat-123',
        unitId: 'unit-123',
        stockQuantity: 50,
        status: 'active',
      };

      const mockProduct = {
        id: 'prod-123',
        store_id: input.storeId,
        category_id: input.categoryId,
        name: input.name,
        price: input.price,
        cost_price: input.costPrice,
        unit_id: input.unitId,
        stock_quantity: input.stockQuantity,
        status: input.status,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // First call for create, second for getById
      mockRequest.execute
        .mockResolvedValueOnce({ recordset: [{ Id: 'prod-123' }] })
        .mockResolvedValueOnce({ recordset: [mockProduct] });

      const result = await repository.create(input);

      expect(mockRequest.execute).toHaveBeenCalledWith('sp_Products_Create');
      expect(mockRequest.input).toHaveBeenCalledWith('storeId', input.storeId);
      expect(mockRequest.input).toHaveBeenCalledWith('name', input.name);
      expect(mockRequest.input).toHaveBeenCalledWith('price', input.price);
      expect(result.name).toBe(input.name);
      expect(result.storeId).toBe(input.storeId);
    });

    it('should throw error when product creation fails', async () => {
      const input: CreateProductSPInput = {
        storeId: 'store-123',
        name: 'Test Product',
        price: 100,
        costPrice: 80,
      };

      // Create returns ID but getById returns nothing
      mockRequest.execute
        .mockResolvedValueOnce({ recordset: [{ Id: 'prod-123' }] })
        .mockResolvedValueOnce({ recordset: [] });

      await expect(repository.create(input)).rejects.toThrow('Failed to create product');
    });
  });

  describe('update', () => {
    it('should call sp_Products_Update with correct parameters', async () => {
      const id = 'prod-123';
      const storeId = 'store-123';
      const data: UpdateProductSPInput = {
        name: 'Updated Product',
        price: 150,
      };

      const mockProduct = {
        id,
        store_id: storeId,
        name: data.name,
        price: data.price,
        cost_price: 80,
        stock_quantity: 50,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRequest.execute
        .mockResolvedValueOnce({ recordset: [{ AffectedRows: 1 }] })
        .mockResolvedValueOnce({ recordset: [mockProduct] });

      const result = await repository.update(id, storeId, data);

      expect(mockRequest.execute).toHaveBeenCalledWith('sp_Products_Update');
      expect(mockRequest.input).toHaveBeenCalledWith('id', id);
      expect(mockRequest.input).toHaveBeenCalledWith('storeId', storeId);
      expect(result?.name).toBe(data.name);
      expect(result?.price).toBe(data.price);
    });

    it('should return null when product not found', async () => {
      mockRequest.execute.mockResolvedValueOnce({ recordset: [{ AffectedRows: 0 }] });

      const result = await repository.update('non-existent', 'store-123', { name: 'Test' });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should call sp_Products_Delete and return true on success', async () => {
      mockRequest.execute.mockResolvedValueOnce({ recordset: [{ AffectedRows: 1 }] });

      const result = await repository.delete('prod-123', 'store-123');

      expect(mockRequest.execute).toHaveBeenCalledWith('sp_Products_Delete');
      expect(mockRequest.input).toHaveBeenCalledWith('id', 'prod-123');
      expect(mockRequest.input).toHaveBeenCalledWith('storeId', 'store-123');
      expect(result).toBe(true);
    });

    it('should return false when product not found', async () => {
      mockRequest.execute.mockResolvedValueOnce({ recordset: [{ AffectedRows: 0 }] });

      const result = await repository.delete('non-existent', 'store-123');

      expect(result).toBe(false);
    });
  });

  describe('getByStore', () => {
    it('should call sp_Products_GetByStore and return products', async () => {
      const mockProducts = [
        {
          id: 'prod-1',
          store_id: 'store-123',
          name: 'Product 1',
          price: 100,
          cost_price: 80,
          stock_quantity: 50,
          status: 'active',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'prod-2',
          store_id: 'store-123',
          name: 'Product 2',
          price: 200,
          cost_price: 160,
          stock_quantity: 30,
          status: 'active',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockRequest.execute.mockResolvedValueOnce({ recordset: mockProducts });

      const result = await repository.getByStore('store-123');

      expect(mockRequest.execute).toHaveBeenCalledWith('sp_Products_GetByStore');
      expect(mockRequest.input).toHaveBeenCalledWith('storeId', 'store-123');
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Product 1');
      expect(result[1].name).toBe('Product 2');
    });

    it('should pass status filter when provided', async () => {
      mockRequest.execute.mockResolvedValueOnce({ recordset: [] });

      await repository.getByStore('store-123', 'active');

      expect(mockRequest.input).toHaveBeenCalledWith('status', 'active');
    });

    it('should pass categoryId filter when provided', async () => {
      mockRequest.execute.mockResolvedValueOnce({ recordset: [] });

      await repository.getByStore('store-123', null, 'cat-123');

      expect(mockRequest.input).toHaveBeenCalledWith('categoryId', 'cat-123');
    });
  });

  describe('getById', () => {
    it('should call sp_Products_GetById and return product', async () => {
      const mockProduct = {
        id: 'prod-123',
        store_id: 'store-123',
        category_id: 'cat-123',
        name: 'Test Product',
        price: 100,
        cost_price: 80,
        stock_quantity: 50,
        status: 'active',
        category_name: 'Test Category',
        current_stock: 50,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRequest.execute.mockResolvedValueOnce({ recordset: [mockProduct] });

      const result = await repository.getById('prod-123', 'store-123');

      expect(mockRequest.execute).toHaveBeenCalledWith('sp_Products_GetById');
      expect(mockRequest.input).toHaveBeenCalledWith('id', 'prod-123');
      expect(mockRequest.input).toHaveBeenCalledWith('storeId', 'store-123');
      expect(result?.id).toBe('prod-123');
      expect(result?.name).toBe('Test Product');
      expect(result?.categoryName).toBe('Test Category');
      expect(result?.currentStock).toBe(50);
    });

    it('should return null when product not found', async () => {
      mockRequest.execute.mockResolvedValueOnce({ recordset: [] });

      const result = await repository.getById('non-existent', 'store-123');

      expect(result).toBeNull();
    });
  });

  describe('getActiveByStore', () => {
    it('should call getByStore with active status', async () => {
      mockRequest.execute.mockResolvedValueOnce({ recordset: [] });

      await repository.getActiveByStore('store-123');

      expect(mockRequest.input).toHaveBeenCalledWith('status', 'active');
    });
  });

  describe('getByCategory', () => {
    it('should call getByStore with categoryId filter', async () => {
      mockRequest.execute.mockResolvedValueOnce({ recordset: [] });

      await repository.getByCategory('store-123', 'cat-123');

      expect(mockRequest.input).toHaveBeenCalledWith('categoryId', 'cat-123');
    });
  });
});
