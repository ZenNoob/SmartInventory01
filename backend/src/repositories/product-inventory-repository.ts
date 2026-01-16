import { BaseRepository } from './base-repository';
import { query, queryOne } from '../db';

/**
 * ProductInventory entity interface
 */
export interface ProductInventory {
  id: string;
  productId: string;
  storeId: string;
  unitId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * ProductInventory with product and unit information
 */
export interface ProductInventoryWithDetails extends ProductInventory {
  productName?: string;
  unitName?: string;
}

/**
 * Database record interface for ProductInventory table (PascalCase)
 */
interface ProductInventoryRecord {
  Id: string;
  ProductId: string;
  StoreId: string;
  UnitId: string;
  Quantity: number;
  CreatedAt: Date;
  UpdatedAt: Date;
}

/**
 * ProductInventory repository for managing detailed inventory tracking
 */
export class ProductInventoryRepository extends BaseRepository<ProductInventory> {
  constructor() {
    super('ProductInventory', 'Id');
  }

  /**
   * Map database record to ProductInventory entity
   */
  protected mapToEntity(record: Record<string, unknown>): ProductInventory {
    const r = record as any as ProductInventoryRecord;
    return {
      id: r.Id,
      productId: r.ProductId,
      storeId: r.StoreId,
      unitId: r.UnitId,
      quantity: r.Quantity || 0,
      createdAt: r.CreatedAt
        ? r.CreatedAt instanceof Date
          ? r.CreatedAt.toISOString()
          : String(r.CreatedAt)
        : new Date().toISOString(),
      updatedAt: r.UpdatedAt
        ? r.UpdatedAt instanceof Date
          ? r.UpdatedAt.toISOString()
          : String(r.UpdatedAt)
        : new Date().toISOString(),
    };
  }

  /**
   * Map ProductInventory entity to database record
   */
  protected mapToRecord(
    entity: Partial<ProductInventory>
  ): Record<string, unknown> {
    const record: Record<string, unknown> = {};

    if (entity.id !== undefined) record.Id = entity.id;
    if (entity.productId !== undefined) record.ProductId = entity.productId;
    if (entity.storeId !== undefined) record.StoreId = entity.storeId;
    if (entity.unitId !== undefined) record.UnitId = entity.unitId;
    if (entity.quantity !== undefined) record.Quantity = entity.quantity;

    return record;
  }

  /**
   * Find inventory by product ID
   */
  async findByProduct(
    productId: string,
    storeId: string,
    unitId?: string
  ): Promise<ProductInventory | null> {
    let sql = `SELECT * FROM ProductInventory 
       WHERE ProductId = @productId AND StoreId = @storeId`;
    
    const params: any = { productId, storeId };
    
    if (unitId) {
      sql += ` AND UnitId = @unitId`;
      params.unitId = unitId;
    }
    
    const result = await queryOne<ProductInventoryRecord>(sql, params);
    return result ? this.mapToEntity(result as any) : null;
  }

  /**
   * Find inventory by product ID with details
   */
  async findByProductWithDetails(
    productId: string,
    storeId: string
  ): Promise<ProductInventoryWithDetails[]> {
    const results = await query<
      ProductInventoryRecord & {
        ProductName: string;
        UnitName: string;
      }
    >(
      `SELECT pi.*, 
              p.Name as ProductName,
              u.Name as UnitName
       FROM ProductInventory pi
       LEFT JOIN Products p ON pi.ProductId = p.Id
       LEFT JOIN Units u ON pi.UnitId = u.Id
       WHERE pi.ProductId = @productId AND pi.StoreId = @storeId`,
      { productId, storeId }
    );

    return results.map((r) => ({
      ...this.mapToEntity(r as any),
      productName: r.ProductName,
      unitName: r.UnitName,
    }));
  }

  /**
   * Get available quantity for a product in a specific unit
   * Returns total quantity available in the requested unit
   */
  async getAvailableQuantity(
    productId: string,
    storeId: string,
    unitId: string
  ): Promise<number> {
    // Get inventory for this product, store, and unit
    const result = await queryOne<{ Quantity: number }>(
      `SELECT Quantity FROM ProductInventory 
       WHERE ProductId = @productId AND StoreId = @storeId AND UnitId = @unitId`,
      { productId, storeId, unitId }
    );

    return result?.Quantity ?? 0;
  }

  /**
   * Update stock levels
   */
  async updateStock(
    productId: string,
    storeId: string,
    unitId: string,
    quantity: number
  ): Promise<ProductInventory> {
    const existing = await this.findByProduct(productId, storeId, unitId);

    if (existing) {
      // Update existing record
      await query(
        `UPDATE ProductInventory SET 
          Quantity = @quantity,
          UpdatedAt = GETDATE()
         WHERE ProductId = @productId AND StoreId = @storeId AND UnitId = @unitId`,
        {
          productId,
          storeId,
          unitId,
          quantity,
        }
      );
    } else {
      // Create new record
      const id = crypto.randomUUID();
      await query(
        `INSERT INTO ProductInventory 
         (Id, ProductId, StoreId, UnitId, Quantity, CreatedAt, UpdatedAt)
         VALUES (@id, @productId, @storeId, @unitId, @quantity, GETDATE(), GETDATE())`,
        {
          id,
          productId,
          storeId,
          unitId,
          quantity,
        }
      );
    }

    return this.findByProduct(productId, storeId, unitId) as Promise<ProductInventory>;
  }

  /**
   * Deduct stock when selling
   */
  async deductStock(
    productId: string,
    storeId: string,
    quantity: number,
    unitId: string
  ): Promise<ProductInventory> {
    const inventory = await this.findByProduct(productId, storeId, unitId);
    if (!inventory) {
      throw new Error('Product inventory not found');
    }

    const newQuantity = inventory.quantity - quantity;

    if (newQuantity < 0) {
      throw new Error('Insufficient stock');
    }

    return this.updateStock(productId, storeId, unitId, newQuantity);
  }

  /**
   * Add stock (for purchase orders or adjustments)
   */
  async addStock(
    productId: string,
    storeId: string,
    quantity: number,
    unitId: string
  ): Promise<ProductInventory> {
    const inventory = await this.findByProduct(productId, storeId, unitId);

    if (!inventory) {
      // Create new inventory record
      return this.updateStock(productId, storeId, unitId, quantity);
    }

    const newQuantity = inventory.quantity + quantity;
    return this.updateStock(productId, storeId, unitId, newQuantity);
  }

  /**
   * Get all inventory records for a store
   */
  async findAllByStore(storeId: string): Promise<ProductInventory[]> {
    const results = await query<ProductInventoryRecord>(
      `SELECT * FROM ProductInventory WHERE StoreId = @storeId ORDER BY UpdatedAt DESC`,
      { storeId }
    );
    return results.map((r) => this.mapToEntity(r as any));
  }

  /**
   * Get low stock products (quantity below threshold)
   */
  async findLowStock(
    storeId: string,
    threshold: number = 10
  ): Promise<ProductInventoryWithDetails[]> {
    const results = await query<
      ProductInventoryRecord & {
        ProductName: string;
        UnitName: string;
      }
    >(
      `SELECT pi.*, 
              p.Name as ProductName,
              u.Name as UnitName
       FROM ProductInventory pi
       LEFT JOIN Products p ON pi.ProductId = p.Id
       LEFT JOIN Units u ON pi.UnitId = u.Id
       WHERE pi.StoreId = @storeId AND pi.Quantity <= @threshold
       ORDER BY pi.Quantity ASC`,
      { storeId, threshold }
    );

    return results.map((r) => ({
      ...this.mapToEntity(r as any),
      productName: r.ProductName,
      unitName: r.UnitName,
    }));
  }

  /**
   * Get total inventory value for a store
   */
  async getTotalInventoryValue(storeId: string): Promise<number> {
    const result = await queryOne<{ total: number }>(
      `SELECT SUM(pi.Quantity * p.cost_price) as total
       FROM ProductInventory pi
       LEFT JOIN Products p ON pi.ProductId = p.Id
       WHERE pi.StoreId = @storeId`,
      { storeId }
    );
    return result?.total ?? 0;
  }
}

// Export singleton instance
export const productInventoryRepository = new ProductInventoryRepository();
