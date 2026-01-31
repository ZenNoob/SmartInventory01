/**
 * Unit Tests for SalesSPRepository
 * 
 * Tests stored procedure repository operations for sales.
 * Requirements: 2.1-2.5
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  SalesSPRepository,
  CreateSaleSPInput,
  CreateSalesItemSPInput,
} from './sales-sp-repository';

// Mock the database connection module
vi.mock('../db/connection', () => ({
  getConnection: vi.fn(),
}));

// Mock the transaction module
vi.mock('../db/transaction', () => ({
  withTransaction: vi.fn((callback) => {
    const mockTransaction = {};
    return callback(mockTransaction);
  }),
}));

describe('SalesSPRepository', () => {
  let repository: SalesSPRepository;
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

    repository = new SalesSPRepository();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });


  describe('create', () => {
    it('should call sp_Sales_Create with correct parameters', async () => {
      const input: CreateSaleSPInput = {
        storeId: 'store-123',
        totalAmount: 1000,
        finalAmount: 900,
        customerId: 'cust-123',
        discount: 100,
        status: 'pending',
      };

      mockRequest.execute.mockResolvedValueOnce({
        recordset: [{ Id: 'sale-123', InvoiceNumber: 'INV-TEST' }],
      });

      const result = await repository.create(input);

      expect(mockRequest.execute).toHaveBeenCalledWith('sp_Sales_Create');
      expect(mockRequest.input).toHaveBeenCalledWith('storeId', input.storeId);
      expect(mockRequest.input).toHaveBeenCalledWith('totalAmount', input.totalAmount);
      expect(mockRequest.input).toHaveBeenCalledWith('finalAmount', input.finalAmount);
      expect(mockRequest.input).toHaveBeenCalledWith('customerId', input.customerId);
      expect(result.id).toBe('sale-123');
      expect(result.invoiceNumber).toBe('INV-TEST');
    });

    it('should generate invoice number if not provided', async () => {
      const input: CreateSaleSPInput = {
        storeId: 'store-123',
        totalAmount: 500,
        finalAmount: 500,
      };

      mockRequest.execute.mockResolvedValueOnce({
        recordset: [{ Id: 'sale-456', InvoiceNumber: 'INV-AUTO' }],
      });

      const result = await repository.create(input);

      expect(result.invoiceNumber).toBe('INV-AUTO');
    });
  });

  describe('createItem', () => {
    it('should call sp_SalesItems_Create with correct parameters', async () => {
      const input: CreateSalesItemSPInput = {
        salesTransactionId: 'sale-123',
        productId: 'prod-123',
        quantity: 5,
        price: 100,
        unitId: 'unit-123',
      };

      mockRequest.execute.mockResolvedValueOnce({
        recordset: [{ Id: 'item-123' }],
      });

      const result = await repository.createItem(input);

      expect(mockRequest.execute).toHaveBeenCalledWith('sp_SalesItems_Create');
      expect(mockRequest.input).toHaveBeenCalledWith('salesTransactionId', input.salesTransactionId);
      expect(mockRequest.input).toHaveBeenCalledWith('productId', input.productId);
      expect(mockRequest.input).toHaveBeenCalledWith('quantity', input.quantity);
      expect(mockRequest.input).toHaveBeenCalledWith('price', input.price);
      expect(mockRequest.input).toHaveBeenCalledWith('unitId', input.unitId);
      expect(result).toBe('item-123');
    });
  });


  describe('getById', () => {
    it('should call sp_Sales_GetById and return sale with items', async () => {
      const mockSale = {
        id: 'sale-123',
        store_id: 'store-123',
        invoice_number: 'INV-001',
        customer_id: 'cust-123',
        transaction_date: new Date(),
        status: 'pending',
        total_amount: 1000,
        vat_amount: 100,
        final_amount: 900,
        discount: 100,
        points_used: 0,
        points_discount: 0,
        created_at: new Date(),
        updated_at: new Date(),
        customer_name: 'John Doe',
      };

      const mockItems = [
        {
          id: 'item-1',
          sales_transaction_id: 'sale-123',
          product_id: 'prod-1',
          quantity: 2,
          price: 300,
          unit_id: 'unit-1',
          product_name: 'Product 1',
          unit_name: 'Cái',
        },
        {
          id: 'item-2',
          sales_transaction_id: 'sale-123',
          product_id: 'prod-2',
          quantity: 1,
          price: 400,
          unit_id: 'unit-2',
          product_name: 'Product 2',
          unit_name: 'Hộp',
        },
      ];

      mockRequest.execute.mockResolvedValueOnce({
        recordsets: [[mockSale], mockItems],
        recordset: [mockSale],
        rowsAffected: [1, 2],
        output: {},
      });

      const result = await repository.getById('sale-123', 'store-123');

      expect(mockRequest.execute).toHaveBeenCalledWith('sp_Sales_GetById');
      expect(mockRequest.input).toHaveBeenCalledWith('id', 'sale-123');
      expect(mockRequest.input).toHaveBeenCalledWith('storeId', 'store-123');
      expect(result).not.toBeNull();
      expect(result?.sale.id).toBe('sale-123');
      expect(result?.sale.customerName).toBe('John Doe');
      expect(result?.items).toHaveLength(2);
      expect(result?.items[0].productName).toBe('Product 1');
    });

    it('should return null when sale not found', async () => {
      mockRequest.execute.mockResolvedValueOnce({
        recordsets: [[], []],
        recordset: [],
        rowsAffected: [0, 0],
        output: {},
      });

      const result = await repository.getById('non-existent', 'store-123');

      expect(result).toBeNull();
    });
  });

  describe('getByStore', () => {
    it('should call sp_Sales_GetByStore and return sales', async () => {
      const mockSales = [
        {
          id: 'sale-1',
          store_id: 'store-123',
          invoice_number: 'INV-001',
          transaction_date: new Date(),
          status: 'pending',
          total_amount: 1000,
          vat_amount: 100,
          final_amount: 900,
          discount: 100,
          points_used: 0,
          points_discount: 0,
          created_at: new Date(),
          updated_at: new Date(),
          customer_name: 'Customer 1',
        },
        {
          id: 'sale-2',
          store_id: 'store-123',
          invoice_number: 'INV-002',
          transaction_date: new Date(),
          status: 'printed',
          total_amount: 500,
          vat_amount: 50,
          final_amount: 500,
          discount: 0,
          points_used: 0,
          points_discount: 0,
          created_at: new Date(),
          updated_at: new Date(),
          customer_name: 'Customer 2',
        },
      ];

      mockRequest.execute.mockResolvedValueOnce({ recordset: mockSales });

      const result = await repository.getByStore('store-123');

      expect(mockRequest.execute).toHaveBeenCalledWith('sp_Sales_GetByStore');
      expect(mockRequest.input).toHaveBeenCalledWith('storeId', 'store-123');
      expect(result).toHaveLength(2);
      expect(result[0].invoiceNumber).toBe('INV-001');
      expect(result[1].invoiceNumber).toBe('INV-002');
    });

    it('should pass date filters when provided', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      mockRequest.execute.mockResolvedValueOnce({ recordset: [] });

      await repository.getByStore('store-123', { startDate, endDate });

      expect(mockRequest.input).toHaveBeenCalledWith('startDate', startDate);
      expect(mockRequest.input).toHaveBeenCalledWith('endDate', endDate);
    });

    it('should pass customer filter when provided', async () => {
      mockRequest.execute.mockResolvedValueOnce({ recordset: [] });

      await repository.getByStore('store-123', { customerId: 'cust-123' });

      expect(mockRequest.input).toHaveBeenCalledWith('customerId', 'cust-123');
    });

    it('should pass status filter when provided', async () => {
      mockRequest.execute.mockResolvedValueOnce({ recordset: [] });

      await repository.getByStore('store-123', { status: 'printed' });

      expect(mockRequest.input).toHaveBeenCalledWith('status', 'printed');
    });
  });


  describe('updateStatus', () => {
    it('should call sp_Sales_UpdateStatus and return true on success', async () => {
      mockRequest.execute.mockResolvedValueOnce({
        recordset: [{ AffectedRows: 1 }],
      });

      const result = await repository.updateStatus('sale-123', 'store-123', 'printed');

      expect(mockRequest.execute).toHaveBeenCalledWith('sp_Sales_UpdateStatus');
      expect(mockRequest.input).toHaveBeenCalledWith('id', 'sale-123');
      expect(mockRequest.input).toHaveBeenCalledWith('storeId', 'store-123');
      expect(mockRequest.input).toHaveBeenCalledWith('status', 'printed');
      expect(result).toBe(true);
    });

    it('should return false when sale not found', async () => {
      mockRequest.execute.mockResolvedValueOnce({
        recordset: [{ AffectedRows: 0 }],
      });

      const result = await repository.updateStatus('non-existent', 'store-123', 'printed');

      expect(result).toBe(false);
    });
  });

  describe('getByDateRange', () => {
    it('should call getByStore with date filters', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      mockRequest.execute.mockResolvedValueOnce({ recordset: [] });

      await repository.getByDateRange('store-123', startDate, endDate);

      expect(mockRequest.input).toHaveBeenCalledWith('startDate', startDate);
      expect(mockRequest.input).toHaveBeenCalledWith('endDate', endDate);
    });
  });

  describe('getByCustomer', () => {
    it('should call getByStore with customer filter', async () => {
      mockRequest.execute.mockResolvedValueOnce({ recordset: [] });

      await repository.getByCustomer('store-123', 'cust-123');

      expect(mockRequest.input).toHaveBeenCalledWith('customerId', 'cust-123');
    });
  });
});
