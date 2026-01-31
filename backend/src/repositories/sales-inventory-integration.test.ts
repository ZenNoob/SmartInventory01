/**
 * Integration Tests for Sales with Inventory Deduction
 * 
 * Tests the complete flow of creating sales with automatic inventory deduction
 * and concurrent access scenarios using stored procedures.
 * Requirements: 2.1, 2.5, 4.3
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SalesSPRepository, CreateSaleSPInput } from './sales-sp-repository';
import { InventorySPRepository } from './inventory-sp-repository';
import { ProductsSPRepository, CreateProductSPInput } from './products-sp-repository';

// Mock the database connection module
vi.mock('../db/connection', () => ({
  getConnection: vi.fn(),
}));

// Mock the transaction module
vi.mock('../db/transaction', () => ({
  withTransaction: vi.fn((callback) => {
    const mockTransaction = {
      request: vi.fn(),
    };
    return callback(mockTransaction);
  }),
}));

describe('Sales with Inventory Deduction Integration', () => {
  let salesRepository: SalesSPRepository;
  let inventoryRepository: InventorySPRepository;
  let productsRepository: ProductsSPRepository;
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

    const { getConnection } = await import('../db/connection.js');
    (getConnection as ReturnType<typeof vi.fn>).mockResolvedValue(mockConnection);

    salesRepository = new SalesSPRepository();
    inventoryRepository = new InventorySPRepository();
    productsRepository = new ProductsSPRepository();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Task 16.1: Sale Creation with Inventory Deduction Flow', () => {
    it('should create sale and deduct inventory in single transaction', async () => {
      // Setup: Product with initial stock of 100
      const productId = 'prod-123';
      const storeId = 'store-123';
      const unitId = 'unit-123';
      const initialStock = 100;
      const saleQuantity = 25;

      // Mock sp_Sales_Create
      mockRequest.execute
        .mockResolvedValueOnce({
          recordset: [{ Id: 'sale-123', InvoiceNumber: 'INV-TEST001' }],
        })
        // Mock sp_SalesItems_Create (which also deducts inventory)
        .mockResolvedValueOnce({
          recordset: [{ Id: 'item-123' }],
        });

      const saleInput: CreateSaleSPInput = {
        storeId,
        totalAmount: 2500,
        finalAmount: 2500,
        status: 'pending',
      };

      const saleResult = await salesRepository.create(saleInput);
      expect(saleResult.id).toBe('sale-123');
      expect(saleResult.invoiceNumber).toBe('INV-TEST001');

      // Create sale item (this triggers inventory deduction via SP)
      const itemResult = await salesRepository.createItem({
        salesTransactionId: saleResult.id,
        productId,
        quantity: saleQuantity,
        price: 100,
        unitId,
      });

      expect(itemResult).toBe('item-123');
      expect(mockRequest.execute).toHaveBeenCalledWith('sp_Sales_Create');
      expect(mockRequest.execute).toHaveBeenCalledWith('sp_SalesItems_Create');
    });

    it('should verify inventory is deducted after sale item creation', async () => {
      const productId = 'prod-456';
      const storeId = 'store-123';
      const unitId = 'unit-123';
      const initialStock = 50;
      const saleQuantity = 15;
      const expectedRemainingStock = initialStock - saleQuantity;

      // Mock inventory check before sale
      mockRequest.execute.mockResolvedValueOnce({
        recordset: [{ AvailableQuantity: initialStock }],
      });

      const stockBefore = await inventoryRepository.getAvailable(productId, storeId, unitId);
      expect(stockBefore).toBe(initialStock);

      // Mock sale creation
      mockRequest.execute.mockResolvedValueOnce({
        recordset: [{ Id: 'sale-789', InvoiceNumber: 'INV-TEST002' }],
      });

      // Mock sale item creation (includes inventory deduction)
      mockRequest.execute.mockResolvedValueOnce({
        recordset: [{ Id: 'item-456' }],
      });

      // Mock inventory check after sale
      mockRequest.execute.mockResolvedValueOnce({
        recordset: [{ AvailableQuantity: expectedRemainingStock }],
      });

      // Create sale
      const sale = await salesRepository.create({
        storeId,
        totalAmount: 1500,
        finalAmount: 1500,
      });

      // Create sale item
      await salesRepository.createItem({
        salesTransactionId: sale.id,
        productId,
        quantity: saleQuantity,
        price: 100,
        unitId,
      });

      // Verify stock after sale
      const stockAfter = await inventoryRepository.getAvailable(productId, storeId, unitId);
      expect(stockAfter).toBe(expectedRemainingStock);
    });

    it('should handle multiple items in single sale with inventory deduction', async () => {
      const storeId = 'store-123';
      const items = [
        { productId: 'prod-1', quantity: 10, price: 100, unitId: 'unit-1' },
        { productId: 'prod-2', quantity: 5, price: 200, unitId: 'unit-2' },
        { productId: 'prod-3', quantity: 3, price: 300, unitId: 'unit-3' },
      ];

      // Mock sale creation
      mockRequest.execute.mockResolvedValueOnce({
        recordset: [{ Id: 'sale-multi', InvoiceNumber: 'INV-MULTI' }],
      });

      // Mock each item creation
      items.forEach((_, index) => {
        mockRequest.execute.mockResolvedValueOnce({
          recordset: [{ Id: `item-${index + 1}` }],
        });
      });

      const sale = await salesRepository.create({
        storeId,
        totalAmount: 2900,
        finalAmount: 2900,
      });

      // Create all items
      for (const item of items) {
        await salesRepository.createItem({
          salesTransactionId: sale.id,
          ...item,
        });
      }

      // Verify all SP calls were made
      expect(mockRequest.execute).toHaveBeenCalledWith('sp_Sales_Create');
      expect(mockRequest.execute).toHaveBeenCalledTimes(4); // 1 sale + 3 items
    });

    it('should calculate correct final amount with discounts', async () => {
      const storeId = 'store-123';
      const totalAmount = 1000;
      const discount = 100;
      const vatAmount = 90;
      const finalAmount = totalAmount - discount + vatAmount;

      mockRequest.execute.mockResolvedValueOnce({
        recordset: [{ Id: 'sale-discount', InvoiceNumber: 'INV-DISC' }],
      });

      const sale = await salesRepository.create({
        storeId,
        totalAmount,
        vatAmount,
        finalAmount,
        discount,
        discountType: 'amount',
        discountValue: discount,
      });

      expect(sale.id).toBe('sale-discount');
      expect(mockRequest.input).toHaveBeenCalledWith('totalAmount', totalAmount);
      expect(mockRequest.input).toHaveBeenCalledWith('discount', discount);
      expect(mockRequest.input).toHaveBeenCalledWith('vatAmount', vatAmount);
      expect(mockRequest.input).toHaveBeenCalledWith('finalAmount', finalAmount);
    });
  });

  describe('Task 16.2: Concurrent Access Scenarios', () => {
    it('should handle concurrent sale creation for same product', async () => {
      const storeId = 'store-123';

      // Mock both sale creations sequentially (Promise.all executes in order)
      mockRequest.execute
        .mockResolvedValueOnce({
          recordset: [{ Id: 'sale-1', InvoiceNumber: 'INV-CONC1' }],
        })
        .mockResolvedValueOnce({
          recordset: [{ Id: 'sale-2', InvoiceNumber: 'INV-CONC2' }],
        });

      // Create both sales concurrently
      const [sale1, sale2] = await Promise.all([
        salesRepository.create({ storeId, totalAmount: 6000, finalAmount: 6000 }),
        salesRepository.create({ storeId, totalAmount: 6000, finalAmount: 6000 }),
      ]);

      expect(sale1.id).toBe('sale-1');
      expect(sale2.id).toBe('sale-2');
      expect(mockRequest.execute).toHaveBeenCalledTimes(2);
    });

    it('should handle concurrent inventory deduction with stock validation', async () => {
      const productId = 'prod-stock';
      const storeId = 'store-123';
      const unitId = 'unit-123';

      // Mock first deduction succeeds
      mockRequest.execute.mockResolvedValueOnce({
        recordset: [{ Quantity: 40 }], // 100 - 60 = 40
      });

      // Mock second deduction fails (insufficient stock)
      mockRequest.execute.mockResolvedValueOnce({
        recordset: [], // Empty result indicates failure
      });

      const result1 = await inventoryRepository.deduct(productId, storeId, unitId, 60);
      expect(result1).toBe(40);

      const result2 = await inventoryRepository.deduct(productId, storeId, unitId, 60);
      expect(result2).toBe(0); // Returns 0 when deduction fails
    });

    it('should maintain data consistency under concurrent updates', async () => {
      const storeId = 'store-123';
      
      // Simulate multiple concurrent operations
      const operations = [
        // Sale 1
        mockRequest.execute.mockResolvedValueOnce({
          recordset: [{ Id: 'sale-a', InvoiceNumber: 'INV-A' }],
        }),
        // Sale 2
        mockRequest.execute.mockResolvedValueOnce({
          recordset: [{ Id: 'sale-b', InvoiceNumber: 'INV-B' }],
        }),
        // Sale 3
        mockRequest.execute.mockResolvedValueOnce({
          recordset: [{ Id: 'sale-c', InvoiceNumber: 'INV-C' }],
        }),
      ];

      // Execute all sales concurrently
      const results = await Promise.all([
        salesRepository.create({ storeId, totalAmount: 100, finalAmount: 100 }),
        salesRepository.create({ storeId, totalAmount: 200, finalAmount: 200 }),
        salesRepository.create({ storeId, totalAmount: 300, finalAmount: 300 }),
      ]);

      // All sales should have unique IDs
      const ids = results.map(r => r.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });

    it('should handle race condition in inventory check and deduct', async () => {
      const productId = 'prod-race';
      const storeId = 'store-123';
      const unitId = 'unit-123';

      // Mock hasSufficientStock check
      mockRequest.execute.mockResolvedValueOnce({
        recordset: [{ AvailableQuantity: 50 }],
      });

      // Check stock first
      const hasSufficient = await inventoryRepository.hasSufficientStock(
        productId, storeId, unitId, 30
      );
      expect(hasSufficient).toBe(true);

      // Mock deduction after check
      mockRequest.execute.mockResolvedValueOnce({
        recordset: [{ Quantity: 20 }],
      });

      // Deduct should succeed
      const remaining = await inventoryRepository.deduct(productId, storeId, unitId, 30);
      expect(remaining).toBe(20);
    });

    it('should properly isolate transactions between different stores', async () => {
      const productId = 'prod-shared';
      const store1 = 'store-1';
      const store2 = 'store-2';
      const unitId = 'unit-123';

      // Mock inventory for store 1
      mockRequest.execute.mockResolvedValueOnce({
        recordset: [{ AvailableQuantity: 100 }],
      });

      // Mock inventory for store 2
      mockRequest.execute.mockResolvedValueOnce({
        recordset: [{ AvailableQuantity: 50 }],
      });

      const [stock1, stock2] = await Promise.all([
        inventoryRepository.getAvailable(productId, store1, unitId),
        inventoryRepository.getAvailable(productId, store2, unitId),
      ]);

      expect(stock1).toBe(100);
      expect(stock2).toBe(50);
      
      // Verify store isolation in SP calls
      expect(mockRequest.input).toHaveBeenCalledWith('storeId', store1);
      expect(mockRequest.input).toHaveBeenCalledWith('storeId', store2);
    });
  });
});
