import { BaseRepository, QueryOptions } from './base-repository';
import { query, queryOne } from '../db';

/**
 * ProductUnit entity interface
 */
export interface ProductUnit {
  id: string;
  productId: string;
  storeId: string;
  baseUnitId: string;
  conversionUnitId: string;
  conversionRate: number;
  baseUnitPrice: number;
  conversionUnitPrice: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * ProductUnit with unit names for display
 */
export interface ProductUnitWithNames extends ProductUnit {
  baseUnitName?: string;
  conversionUnitName?: string;
  productName?: string;
}

/**
 * Database record interface for ProductUnits table (PascalCase)
 */
interface ProductUnitRecord {
  Id: string;
  ProductId: string;
  StoreId: string;
  BaseUnitId: string;
  ConversionUnitId: string;
  ConversionRate: number;
  BaseUnitPrice: number;
  ConversionUnitPrice: number;
  IsActive: boolean;
  CreatedAt: Date;
  UpdatedAt: Date;
}

/**
 * ProductUnits repository for managing unit conversion configuration
 */
export class ProductUnitsRepository extends BaseRepository<ProductUnit> {
  constructor() {
    super('ProductUnits', 'Id');
  }

  /**
   * Map database record to ProductUnit entity
   */
  protected mapToEntity(record: Record<string, unknown>): ProductUnit {
    const r = record as any as ProductUnitRecord;
    return {
      id: r.Id,
      productId: r.ProductId,
      storeId: r.StoreId,
      baseUnitId: r.BaseUnitId,
      conversionUnitId: r.ConversionUnitId,
      conversionRate: r.ConversionRate,
      baseUnitPrice: r.BaseUnitPrice || 0,
      conversionUnitPrice: r.ConversionUnitPrice || 0,
      isActive: r.IsActive ?? true,
      createdAt: r.CreatedAt
        ? r.CreatedAt instanceof Date
          ? r.CreatedAt.toISOString()
          : String(r.CreatedAt)
        : undefined,
      updatedAt: r.UpdatedAt
        ? r.UpdatedAt instanceof Date
          ? r.UpdatedAt.toISOString()
          : String(r.UpdatedAt)
        : undefined,
    };
  }

  /**
   * Map ProductUnit entity to database record
   */
  protected mapToRecord(entity: Partial<ProductUnit>): Record<string, unknown> {
    const record: Record<string, unknown> = {};

    if (entity.id !== undefined) record.Id = entity.id;
    if (entity.productId !== undefined) record.ProductId = entity.productId;
    if (entity.storeId !== undefined) record.StoreId = entity.storeId;
    if (entity.baseUnitId !== undefined) record.BaseUnitId = entity.baseUnitId;
    if (entity.conversionUnitId !== undefined)
      record.ConversionUnitId = entity.conversionUnitId;
    if (entity.conversionRate !== undefined)
      record.ConversionRate = entity.conversionRate;
    if (entity.baseUnitPrice !== undefined)
      record.BaseUnitPrice = entity.baseUnitPrice;
    if (entity.conversionUnitPrice !== undefined)
      record.ConversionUnitPrice = entity.conversionUnitPrice;
    if (entity.isActive !== undefined) record.IsActive = entity.isActive;

    return record;
  }

  /**
   * Find ProductUnit configuration by product ID
   */
  async findByProduct(
    productId: string,
    storeId: string
  ): Promise<ProductUnit | null> {
    const result = await queryOne<ProductUnitRecord>(
      `SELECT * FROM ProductUnits 
       WHERE ProductId = @productId AND StoreId = @storeId`,
      { productId, storeId }
    );
    return result ? this.mapToEntity(result as any) : null;
  }

  /**
   * Find ProductUnit configuration by product ID with unit names
   */
  async findByProductWithNames(
    productId: string,
    storeId: string
  ): Promise<ProductUnitWithNames | null> {
    const result = await queryOne<
      ProductUnitRecord & {
        BaseUnitName: string;
        ConversionUnitName: string;
        ProductName: string;
      }
    >(
      `SELECT pu.*, 
              bu.Name as BaseUnitName, 
              cu.Name as ConversionUnitName,
              p.Name as ProductName
       FROM ProductUnits pu
       LEFT JOIN Units bu ON pu.BaseUnitId = bu.Id
       LEFT JOIN Units cu ON pu.ConversionUnitId = cu.Id
       LEFT JOIN Products p ON pu.ProductId = p.Id
       WHERE pu.ProductId = @productId AND pu.StoreId = @storeId`,
      { productId, storeId }
    );

    if (!result) return null;

    return {
      ...this.mapToEntity(result as any),
      baseUnitName: result.BaseUnitName,
      conversionUnitName: result.ConversionUnitName,
      productName: result.ProductName,
    };
  }

  /**
   * Find all active ProductUnit configurations for a store
   */
  async findAllActive(
    storeId: string,
    options?: QueryOptions
  ): Promise<ProductUnit[]> {
    let queryString = `SELECT * FROM ProductUnits WHERE StoreId = @storeId AND IsActive = 1`;

    if (options?.orderBy) {
      const direction = options.orderDirection || 'ASC';
      queryString += ` ORDER BY ${options.orderBy} ${direction}`;
    } else {
      queryString += ` ORDER BY CreatedAt DESC`;
    }

    const results = await query<ProductUnitRecord>(queryString, { storeId });
    return results.map((r) => this.mapToEntity(r as any));
  }

  /**
   * Create a new ProductUnit configuration
   */
  async create(
    entity: Omit<ProductUnit, 'id' | 'createdAt' | 'updatedAt'>,
    storeId: string
  ): Promise<ProductUnit> {
    // Check if configuration already exists for this product
    const existing = await this.findByProduct(entity.productId, storeId);
    if (existing) {
      throw new Error(
        'Unit conversion configuration already exists for this product'
      );
    }

    const id = crypto.randomUUID();
    await query(
      `INSERT INTO ProductUnits 
       (Id, ProductId, StoreId, BaseUnitId, ConversionUnitId, ConversionRate, 
        BaseUnitPrice, ConversionUnitPrice, IsActive, CreatedAt, UpdatedAt)
       VALUES (@id, @productId, @storeId, @baseUnitId, @conversionUnitId, @conversionRate,
               @baseUnitPrice, @conversionUnitPrice, @isActive, GETDATE(), GETDATE())`,
      {
        id,
        productId: entity.productId,
        storeId,
        baseUnitId: entity.baseUnitId,
        conversionUnitId: entity.conversionUnitId,
        conversionRate: entity.conversionRate,
        baseUnitPrice: entity.baseUnitPrice,
        conversionUnitPrice: entity.conversionUnitPrice,
        isActive: entity.isActive ?? true,
      }
    );

    return this.findByProduct(entity.productId, storeId) as Promise<ProductUnit>;
  }

  /**
   * Update an existing ProductUnit configuration
   */
  async update(
    id: string,
    entity: Partial<ProductUnit>,
    storeId: string
  ): Promise<ProductUnit | null> {
    const existing = await queryOne<ProductUnitRecord>(
      `SELECT * FROM ProductUnits WHERE Id = @id AND StoreId = @storeId`,
      { id, storeId }
    );

    if (!existing) return null;

    const mapped = this.mapToEntity(existing as any);

    await query(
      `UPDATE ProductUnits SET 
        BaseUnitId = @baseUnitId,
        ConversionUnitId = @conversionUnitId,
        ConversionRate = @conversionRate,
        BaseUnitPrice = @baseUnitPrice,
        ConversionUnitPrice = @conversionUnitPrice,
        IsActive = @isActive,
        UpdatedAt = GETDATE()
       WHERE Id = @id AND StoreId = @storeId`,
      {
        id,
        storeId,
        baseUnitId: entity.baseUnitId ?? mapped.baseUnitId,
        conversionUnitId: entity.conversionUnitId ?? mapped.conversionUnitId,
        conversionRate: entity.conversionRate ?? mapped.conversionRate,
        baseUnitPrice: entity.baseUnitPrice ?? mapped.baseUnitPrice,
        conversionUnitPrice:
          entity.conversionUnitPrice ?? mapped.conversionUnitPrice,
        isActive: entity.isActive ?? mapped.isActive,
      }
    );

    return queryOne<ProductUnitRecord>(
      `SELECT * FROM ProductUnits WHERE Id = @id AND StoreId = @storeId`,
      { id, storeId }
    ).then((r) => (r ? this.mapToEntity(r as any) : null));
  }

  /**
   * Delete a ProductUnit configuration
   */
  async delete(id: string, storeId: string): Promise<boolean> {
    await query(
      `DELETE FROM ProductUnits WHERE Id = @id AND StoreId = @storeId`,
      { id, storeId }
    );
    return true;
  }

  /**
   * Deactivate a ProductUnit configuration (soft delete)
   */
  async deactivate(id: string, storeId: string): Promise<ProductUnit | null> {
    return this.update(id, { isActive: false }, storeId);
  }

  /**
   * Activate a ProductUnit configuration
   */
  async activate(id: string, storeId: string): Promise<ProductUnit | null> {
    return this.update(id, { isActive: true }, storeId);
  }

  /**
   * Check if a product has unit conversion configured
   */
  async hasUnitConversion(
    productId: string,
    storeId: string
  ): Promise<boolean> {
    const result = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM ProductUnits 
       WHERE ProductId = @productId AND StoreId = @storeId AND IsActive = 1`,
      { productId, storeId }
    );
    return (result?.count ?? 0) > 0;
  }

  /**
   * Get all products with unit conversion configured
   */
  async findAllProductsWithConversion(
    storeId: string
  ): Promise<ProductUnitWithNames[]> {
    const results = await query<
      ProductUnitRecord & {
        BaseUnitName: string;
        ConversionUnitName: string;
        ProductName: string;
      }
    >(
      `SELECT pu.*, 
              bu.Name as BaseUnitName, 
              cu.Name as ConversionUnitName,
              p.Name as ProductName
       FROM ProductUnits pu
       LEFT JOIN Units bu ON pu.BaseUnitId = bu.Id
       LEFT JOIN Units cu ON pu.ConversionUnitId = cu.Id
       LEFT JOIN Products p ON pu.ProductId = p.Id
       WHERE pu.StoreId = @storeId AND pu.IsActive = 1
       ORDER BY p.Name ASC`,
      { storeId }
    );

    return results.map((r) => ({
      ...this.mapToEntity(r as any),
      baseUnitName: r.BaseUnitName,
      conversionUnitName: r.ConversionUnitName,
      productName: r.ProductName,
    }));
  }
}

// Export singleton instance
export const productUnitsRepository = new ProductUnitsRepository();
