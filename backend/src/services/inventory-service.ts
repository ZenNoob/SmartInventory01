import { withTransaction } from '../db/transaction';
import {
  productInventoryRepository,
  ProductInventory,
} from '../repositories/product-inventory-repository';
import {
  inventorySPRepository,
} from '../repositories/inventory-sp-repository';
import {
  productUnitsRepository,
  ProductUnit,
} from '../repositories/product-units-repository';
import {
  unitConversionLogRepository,
  UnitConversionLog,
} from '../repositories/unit-conversion-log-repository';

/**
 * Result of inventory deduction operation
 */
export interface DeductInventoryResult {
  success: boolean;
  inventory: ProductInventory;
  conversions: UnitConversionLog[];
}

/**
 * Inventory display information
 */
export interface InventoryDisplayInfo {
  conversionUnitStock: number;
  baseUnitStock: number;
  displayText: string;
  totalInBaseUnit: number;
  conversionUnitName?: string;
  baseUnitName?: string;
}

/**
 * Insufficient stock error
 */
export class InsufficientStockError extends Error {
  productId: string;
  requestedQuantity: number;
  availableQuantity: number;
  unitId: string;

  constructor(
    message: string,
    productId: string,
    requestedQuantity: number,
    availableQuantity: number,
    unitId: string
  ) {
    super(message);
    this.name = 'InsufficientStockError';
    this.productId = productId;
    this.requestedQuantity = requestedQuantity;
    this.availableQuantity = availableQuantity;
    this.unitId = unitId;
  }
}

/**
 * Inventory Service
 * Handles inventory management with automatic unit conversion
 */
export class InventoryService {
  /**
   * Check available quantity for a product in a specific unit
   * Returns total quantity available in the requested unit
   * Uses sp_Inventory_GetAvailable stored procedure
   * Requirements: 4.1
   */
  async checkAvailableQuantity(
    productId: string,
    storeId: string,
    unitId: string
  ): Promise<number> {
    // Use SP Repository for inventory operations
    return inventorySPRepository.getAvailable(productId, storeId, unitId);
  }

  /**
   * Deduct inventory when selling
   * Uses sp_Inventory_Deduct stored procedure with stock validation
   * Requirements: 4.3
   */
  async deductInventory(
    productId: string,
    storeId: string,
    quantity: number,
    unitId: string,
    salesTransactionId?: string
  ): Promise<DeductInventoryResult> {
    return withTransaction(async (transaction) => {
      // Check available quantity using SP Repository
      const available = await this.checkAvailableQuantity(
        productId,
        storeId,
        unitId
      );

      if (available < quantity) {
        throw new InsufficientStockError(
          `Không đủ hàng. Chỉ còn ${available} đơn vị`,
          productId,
          quantity,
          available,
          unitId
        );
      }

      // Deduct stock using SP Repository
      const newQuantity = await inventorySPRepository.deduct(
        productId,
        storeId,
        unitId,
        quantity
      );

      // Get updated inventory record for response
      const updatedInventory = await productInventoryRepository.findByProduct(
        productId,
        storeId,
        unitId
      );

      return {
        success: true,
        inventory: updatedInventory || {
          id: '',
          productId,
          storeId,
          unitId,
          quantity: newQuantity,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        conversions: [],
      };
    });
  }

  /**
   * Perform automatic unit conversion
   * Converts base units to conversion units when threshold is reached
   */
  private async performAutoConversion(
    productId: string,
    storeId: string,
    currentInventory: ProductInventory,
    productUnit: ProductUnit,
    salesTransactionId?: string
  ): Promise<UnitConversionLog | null> {
    // Check if we have enough base units to convert
    if (currentInventory.baseUnitStock < productUnit.conversionRate) {
      return null;
    }

    // Check if we have conversion units to deduct
    if (currentInventory.conversionUnitStock <= 0) {
      return null;
    }

    // Calculate how many conversion units we can deduct
    const conversionsToPerform = Math.floor(
      currentInventory.baseUnitStock / productUnit.conversionRate
    );

    // Limit to available conversion units
    const actualConversions = Math.min(
      conversionsToPerform,
      currentInventory.conversionUnitStock
    );

    if (actualConversions <= 0) {
      return null;
    }

    // Calculate new stock levels
    const newConversionStock =
      currentInventory.conversionUnitStock - actualConversions;
    const newBaseStock =
      currentInventory.baseUnitStock -
      actualConversions * productUnit.conversionRate;

    // Create conversion log
    const conversionLog = await unitConversionLogRepository.create(
      {
        productId,
        storeId,
        salesTransactionId,
        conversionType: 'auto_deduct',
        conversionUnitChange: -actualConversions,
        baseUnitChange: -actualConversions * productUnit.conversionRate,
        beforeConversionUnitStock: currentInventory.conversionUnitStock,
        beforeBaseUnitStock: currentInventory.baseUnitStock,
        afterConversionUnitStock: newConversionStock,
        afterBaseUnitStock: newBaseStock,
        notes: `Tự động chuyển đổi ${actualConversions} ${productUnit.conversionUnitId} sau khi bán ${actualConversions * productUnit.conversionRate} ${productUnit.baseUnitId}`,
      },
      storeId
    );

    return conversionLog;
  }

  /**
   * Get inventory display text
   * Returns formatted string like "21 Thùng + 3 Hộp" or "21 Thùng"
   */
  async getInventoryDisplay(
    productId: string,
    storeId: string
  ): Promise<InventoryDisplayInfo> {
    const inventoryWithDetails =
      await productInventoryRepository.findByProductWithDetails(
        productId,
        storeId
      );

    if (!inventoryWithDetails) {
      return {
        conversionUnitStock: 0,
        baseUnitStock: 0,
        displayText: '0',
        totalInBaseUnit: 0,
      };
    }

    const {
      conversionUnitStock,
      baseUnitStock,
      conversionUnitName,
      baseUnitName,
      conversionRate,
    } = inventoryWithDetails;

    // Calculate total in base units
    const totalInBaseUnit = conversionRate
      ? conversionUnitStock * conversionRate + baseUnitStock
      : conversionUnitStock;

    // Build display text
    let displayText = '';
    if (conversionUnitName) {
      displayText = `${conversionUnitStock} ${conversionUnitName}`;
      if (baseUnitStock > 0 && baseUnitName) {
        displayText += ` + ${baseUnitStock} ${baseUnitName}`;
      }
    } else {
      displayText = `${conversionUnitStock}`;
    }

    return {
      conversionUnitStock,
      baseUnitStock,
      displayText,
      totalInBaseUnit,
      conversionUnitName,
      baseUnitName,
    };
  }

  /**
   * Restore inventory when cancelling a sale
   * Reverses the deduction operation
   */
  async restoreInventory(
    productId: string,
    storeId: string,
    quantity: number,
    unitId: string
  ): Promise<ProductInventory> {
    return withTransaction(async (transaction) => {
      // Get current inventory
      const inventory = await productInventoryRepository.findByProduct(
        productId,
        storeId
      );

      if (!inventory) {
        throw new Error(`Inventory not found for product ${productId}`);
      }

      // Get unit configuration
      const productUnit = await productUnitsRepository.findByProduct(
        productId,
        storeId
      );

      let newConversionStock = inventory.conversionUnitStock;
      let newBaseStock = inventory.baseUnitStock;

      if (!productUnit) {
        // No unit conversion configured, add to conversion unit stock
        newConversionStock += quantity;
      } else if (unitId === productUnit.baseUnitId) {
        // Restoring base units - subtract from base stock (reverse the addition)
        newBaseStock -= quantity;
      } else if (unitId === productUnit.conversionUnitId) {
        // Restoring conversion units
        newConversionStock += quantity;
      } else {
        throw new Error('Invalid unit ID for this product');
      }

      // Update inventory
      return productInventoryRepository.updateStock(
        productId,
        storeId,
        newConversionStock,
        newBaseStock
      );
    });
  }

  /**
   * Add inventory (for purchase orders or manual adjustments)
   * Uses sp_Inventory_Add stored procedure with UPSERT logic
   * Requirements: 4.2
   */
  async addInventory(
    productId: string,
    storeId: string,
    quantity: number,
    unitId: string,
    notes?: string
  ): Promise<ProductInventory> {
    // Use SP Repository for inventory add operation
    const newQuantity = await inventorySPRepository.add(
      productId,
      storeId,
      unitId,
      quantity
    );

    // Get updated inventory record for response
    const updatedInventory = await productInventoryRepository.findByProduct(
      productId,
      storeId,
      unitId
    );

    return updatedInventory || {
      id: '',
      productId,
      storeId,
      unitId,
      quantity: newQuantity,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Manual inventory adjustment with conversion log
   */
  async adjustInventory(
    productId: string,
    storeId: string,
    newConversionStock: number,
    newBaseStock: number,
    reason: string
  ): Promise<{ inventory: ProductInventory; log: UnitConversionLog }> {
    return withTransaction(async (transaction) => {
      // Get current inventory
      const currentInventory = await productInventoryRepository.findByProduct(
        productId,
        storeId
      );

      if (!currentInventory) {
        throw new Error(`Inventory not found for product ${productId}`);
      }

      // Calculate changes
      const conversionUnitChange =
        newConversionStock - currentInventory.conversionUnitStock;
      const baseUnitChange = newBaseStock - currentInventory.baseUnitStock;

      // Update inventory
      const updatedInventory = await productInventoryRepository.updateStock(
        productId,
        storeId,
        newConversionStock,
        newBaseStock
      );

      // Create adjustment log
      const log = await unitConversionLogRepository.create(
        {
          productId,
          storeId,
          conversionType: 'manual_adjust',
          conversionUnitChange,
          baseUnitChange,
          beforeConversionUnitStock: currentInventory.conversionUnitStock,
          beforeBaseUnitStock: currentInventory.baseUnitStock,
          afterConversionUnitStock: newConversionStock,
          afterBaseUnitStock: newBaseStock,
          notes: reason,
        },
        storeId
      );

      return {
        inventory: updatedInventory,
        log,
      };
    });
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(
    storeId: string,
    threshold: number = 10
  ): Promise<ProductInventory[]> {
    return productInventoryRepository.findLowStock(storeId, threshold);
  }

  /**
   * Initialize inventory for a product
   * Creates inventory record if it doesn't exist
   */
  async initializeInventory(
    productId: string,
    storeId: string,
    initialStock: number = 0,
    unitId?: string
  ): Promise<ProductInventory> {
    const existing = await productInventoryRepository.findByProduct(
      productId,
      storeId
    );

    if (existing) {
      return existing;
    }

    // Check if product has unit conversion configured
    const productUnit = await productUnitsRepository.findByProduct(
      productId,
      storeId
    );

    let conversionUnitStock = initialStock;
    let baseUnitStock = 0;

    if (productUnit && unitId === productUnit.baseUnitId) {
      // Initial stock is in base units
      conversionUnitStock = 0;
      baseUnitStock = initialStock;
    }

    return productInventoryRepository.updateStock(
      productId,
      storeId,
      conversionUnitStock,
      baseUnitStock
    );
  }

  /**
   * Sync inventory from Products.stock_quantity to ProductInventory
   * Uses sp_Inventory_Sync stored procedure with MERGE statement
   * Requirements: 4.4
   */
  async syncInventoryFromProducts(
    productId: string,
    storeId: string,
    stockQuantity: number
  ): Promise<ProductInventory> {
    // Use SP Repository for sync operation (syncs all products in store)
    await inventorySPRepository.sync(storeId);

    // Get updated inventory record for response
    const updatedInventory = await productInventoryRepository.findByProduct(
      productId,
      storeId
    );

    return updatedInventory || {
      id: '',
      productId,
      storeId,
      unitId: '',
      quantity: stockQuantity,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Sync all inventory for a store
   * Uses sp_Inventory_Sync stored procedure with MERGE statement
   * Requirements: 4.4
   */
  async syncAllInventory(storeId: string): Promise<number> {
    return inventorySPRepository.sync(storeId);
  }
}

// Export singleton instance
export const inventoryService = new InventoryService();
