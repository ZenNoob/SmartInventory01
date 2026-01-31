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
   * Note: This method is deprecated and kept for backward compatibility
   * The new model uses quantity per unit instead of baseUnitStock/conversionUnitStock
   */
  private async performAutoConversion(
    productId: string,
    storeId: string,
    currentInventory: ProductInventory,
    productUnit: ProductUnit,
    salesTransactionId?: string
  ): Promise<UnitConversionLog | null> {
    // Get inventory for base unit
    const baseUnitInventory = await productInventoryRepository.findByProduct(
      productId,
      storeId,
      productUnit.baseUnitId
    );
    // Get inventory for conversion unit
    const conversionUnitInventory = await productInventoryRepository.findByProduct(
      productId,
      storeId,
      productUnit.conversionUnitId
    );

    const baseUnitStock = baseUnitInventory?.quantity || 0;
    const conversionUnitStock = conversionUnitInventory?.quantity || 0;

    // Check if we have enough base units to convert
    if (baseUnitStock < productUnit.conversionRate) {
      return null;
    }

    // Check if we have conversion units to deduct
    if (conversionUnitStock <= 0) {
      return null;
    }

    // Calculate how many conversion units we can deduct
    const conversionsToPerform = Math.floor(
      baseUnitStock / productUnit.conversionRate
    );

    // Limit to available conversion units
    const actualConversions = Math.min(
      conversionsToPerform,
      conversionUnitStock
    );

    if (actualConversions <= 0) {
      return null;
    }

    // Calculate new stock levels
    const newConversionStock =
      conversionUnitStock - actualConversions;
    const newBaseStock =
      baseUnitStock -
      actualConversions * productUnit.conversionRate;

    // Update inventory for both units
    await productInventoryRepository.updateStock(
      productId,
      storeId,
      productUnit.conversionUnitId,
      newConversionStock
    );
    await productInventoryRepository.updateStock(
      productId,
      storeId,
      productUnit.baseUnitId,
      newBaseStock
    );

    // Create conversion log
    const conversionLog = await unitConversionLogRepository.create(
      {
        productId,
        storeId,
        salesTransactionId,
        conversionType: 'auto_deduct',
        conversionUnitChange: -actualConversions,
        baseUnitChange: -actualConversions * productUnit.conversionRate,
        beforeConversionUnitStock: conversionUnitStock,
        beforeBaseUnitStock: baseUnitStock,
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
    // Get product unit configuration
    const productUnit = await productUnitsRepository.findByProduct(
      productId,
      storeId
    );

    if (!productUnit) {
      // No unit conversion - just get single inventory
      const inventoryList = await productInventoryRepository.findByProductWithDetails(
        productId,
        storeId
      );
      const inventory = inventoryList.length > 0 ? inventoryList[0] : null;
      const quantity = inventory?.quantity || 0;
      return {
        conversionUnitStock: quantity,
        baseUnitStock: 0,
        displayText: `${quantity}`,
        totalInBaseUnit: quantity,
        conversionUnitName: inventory?.unitName,
      };
    }

    // Get inventory for both units
    const baseUnitInventory = await productInventoryRepository.findByProduct(
      productId,
      storeId,
      productUnit.baseUnitId
    );
    const conversionUnitInventory = await productInventoryRepository.findByProduct(
      productId,
      storeId,
      productUnit.conversionUnitId
    );

    const baseUnitStock = baseUnitInventory?.quantity || 0;
    const conversionUnitStock = conversionUnitInventory?.quantity || 0;

    // Calculate total in base units
    const totalInBaseUnit = conversionUnitStock * productUnit.conversionRate + baseUnitStock;

    // Build display text (we need unit names, fetch them separately if needed)
    let displayText = `${conversionUnitStock}`;
    if (baseUnitStock > 0) {
      displayText += ` + ${baseUnitStock}`;
    }

    return {
      conversionUnitStock,
      baseUnitStock,
      displayText,
      totalInBaseUnit,
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
      // Get current inventory for this unit
      const inventory = await productInventoryRepository.findByProduct(
        productId,
        storeId,
        unitId
      );

      const currentQuantity = inventory?.quantity || 0;
      const newQuantity = currentQuantity + quantity;

      // Update inventory
      return productInventoryRepository.updateStock(
        productId,
        storeId,
        unitId,
        newQuantity
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
   * Note: This method uses the new model with quantity per unit
   */
  async adjustInventory(
    productId: string,
    storeId: string,
    newConversionStock: number,
    newBaseStock: number,
    reason: string
  ): Promise<{ inventory: ProductInventory; log: UnitConversionLog }> {
    return withTransaction(async (transaction) => {
      // Get product unit configuration
      const productUnit = await productUnitsRepository.findByProduct(
        productId,
        storeId
      );

      // Get current inventory for both units
      let currentConversionStock = 0;
      let currentBaseStock = 0;

      if (productUnit) {
        const conversionUnitInventory = await productInventoryRepository.findByProduct(
          productId,
          storeId,
          productUnit.conversionUnitId
        );
        const baseUnitInventory = await productInventoryRepository.findByProduct(
          productId,
          storeId,
          productUnit.baseUnitId
        );
        currentConversionStock = conversionUnitInventory?.quantity || 0;
        currentBaseStock = baseUnitInventory?.quantity || 0;

        // Update inventory for both units
        await productInventoryRepository.updateStock(
          productId,
          storeId,
          productUnit.conversionUnitId,
          newConversionStock
        );
        await productInventoryRepository.updateStock(
          productId,
          storeId,
          productUnit.baseUnitId,
          newBaseStock
        );
      } else {
        // No unit conversion - update single inventory
        const inventory = await productInventoryRepository.findByProduct(
          productId,
          storeId
        );
        currentConversionStock = inventory?.quantity || 0;
        await productInventoryRepository.updateStock(
          productId,
          storeId,
          inventory?.unitId || '',
          newConversionStock
        );
      }

      // Calculate changes
      const conversionUnitChange = newConversionStock - currentConversionStock;
      const baseUnitChange = newBaseStock - currentBaseStock;

      // Create adjustment log
      const log = await unitConversionLogRepository.create(
        {
          productId,
          storeId,
          conversionType: 'manual_adjust',
          conversionUnitChange,
          baseUnitChange,
          beforeConversionUnitStock: currentConversionStock,
          beforeBaseUnitStock: currentBaseStock,
          afterConversionUnitStock: newConversionStock,
          afterBaseUnitStock: newBaseStock,
          notes: reason,
        },
        storeId
      );

      // Get updated inventory for response
      const updatedInventory = await productInventoryRepository.findByProduct(
        productId,
        storeId
      );

      return {
        inventory: updatedInventory || {
          id: '',
          productId,
          storeId,
          unitId: '',
          quantity: newConversionStock,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
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
    // Check if inventory already exists for this unit
    const targetUnitId = unitId || '';
    const existing = await productInventoryRepository.findByProduct(
      productId,
      storeId,
      targetUnitId || undefined
    );

    if (existing) {
      return existing;
    }

    // Get product unit configuration if no unitId specified
    if (!unitId) {
      const productUnit = await productUnitsRepository.findByProduct(
        productId,
        storeId
      );
      if (productUnit) {
        // Create inventory for conversion unit by default
        return productInventoryRepository.updateStock(
          productId,
          storeId,
          productUnit.conversionUnitId,
          initialStock
        );
      }
    }

    // Create inventory for specified unit
    return productInventoryRepository.updateStock(
      productId,
      storeId,
      unitId || '',
      initialStock
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
