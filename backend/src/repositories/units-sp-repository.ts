/**
 * Units SP Repository
 * 
 * Repository for unit operations using stored procedures.
 * Implements CRUD operations via sp_Units_* stored procedures.
 * Requirements: 8.1-8.4
 */

import { SPBaseRepository, SPParams } from './sp-base-repository';

/**
 * Database record interface for Units from stored procedures (snake_case)
 */
interface UnitSPRecord {
  id: string; // SP returns lowercase
  Id?: string; // Fallback for PascalCase
  store_id: string;
  storeId?: string; // Fallback
  name: string;
  description: string | null;
  base_unit_id: string | null;
  baseUnitId?: string; // Fallback
  conversion_factor: number;
  conversionFactor?: number; // Fallback
  created_at: Date;
  createdAt?: Date; // Fallback
  updated_at: Date;
  updatedAt?: Date; // Fallback
}

/**
 * Unit entity interface
 */
export interface Unit {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  baseUnitId?: string;
  conversionFactor: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Input for creating a unit via stored procedure
 */
export interface CreateUnitSPInput {
  id?: string;
  storeId: string;
  name: string;
  description?: string | null;
  baseUnitId?: string | null;
  conversionFactor?: number;
}

/**
 * Input for updating a unit via stored procedure
 */
export interface UpdateUnitSPInput {
  name?: string;
  description?: string | null;
  baseUnitId?: string | null;
  conversionFactor?: number;
}

/**
 * Result from create stored procedure
 */
interface CreateResult {
  Id: string;
}

/**
 * Result from update/delete stored procedures
 */
interface AffectedRowsResult {
  AffectedRows: number;
}

/**
 * Units repository using stored procedures
 */
export class UnitsSPRepository extends SPBaseRepository<Unit> {
  protected tableName = 'Units';

  /**
   * Map database record to Unit entity
   */
  private mapToEntity(record: UnitSPRecord): Unit {
    return {
      id: record.id || record.Id || '',
      storeId: record.store_id || record.storeId || '',
      name: record.name,
      description: record.description || undefined,
      baseUnitId: record.base_unit_id || record.baseUnitId || undefined,
      conversionFactor: record.conversion_factor ?? record.conversionFactor ?? 1,
      createdAt: (record.created_at || record.createdAt)
        ? (record.created_at || record.createdAt) instanceof Date
          ? (record.created_at || record.createdAt).toISOString()
          : String(record.created_at || record.createdAt)
        : undefined,
      updatedAt: (record.updated_at || record.updatedAt)
        ? (record.updated_at || record.updatedAt) instanceof Date
          ? (record.updated_at || record.updatedAt).toISOString()
          : String(record.updated_at || record.updatedAt)
        : undefined,
    };
  }

  /**
   * Create a new unit using sp_Units_Create
   * Requirements: 8.1
   *
   * @param input - Unit data to create
   * @returns Created unit
   */
  async create(input: CreateUnitSPInput): Promise<Unit> {
    const id = input.id || crypto.randomUUID();

    const params: SPParams = {
      id,
      storeId: input.storeId,
      name: input.name,
      description: input.description || null,
      baseUnitId: input.baseUnitId || null,
      conversionFactor: input.conversionFactor ?? 1,
    };

    // sp_Units_Create returns the created unit directly
    const result = await this.executeSPSingle<UnitSPRecord>('sp_Units_Create', params);

    if (result) {
      return this.mapToEntity(result);
    }

    // Fallback: fetch by id (case-insensitive comparison)
    const units = await this.getByStore(input.storeId);
    const unit = units.find((u) => u.id.toLowerCase() === id.toLowerCase());
    if (!unit) {
      throw new Error('Failed to create unit');
    }
    return unit;
  }

  /**
   * Update a unit using sp_Units_Update
   * Requirements: 8.2
   * 
   * @param id - Unit ID
   * @param storeId - Store ID
   * @param data - Fields to update
   * @returns Updated unit or null if not found
   */
  async update(
    id: string,
    storeId: string,
    data: UpdateUnitSPInput
  ): Promise<Unit | null> {
    const params: SPParams = {
      id,
      storeId,
      name: data.name,
      description: data.description,
      baseUnitId: data.baseUnitId,
      conversionFactor: data.conversionFactor,
    };

    const result = await this.executeSPSingle<AffectedRowsResult>(
      'sp_Units_Update',
      params
    );

    if (!result || result.AffectedRows === 0) {
      return null;
    }

    return this.getById(id, storeId);
  }

  /**
   * Delete a unit using sp_Units_Delete
   * Requirements: 8.3
   * 
   * @param id - Unit ID
   * @param storeId - Store ID
   * @returns True if deleted, false if not found
   */
  async delete(id: string, storeId: string): Promise<boolean> {
    const result = await this.executeSPSingle<AffectedRowsResult>(
      'sp_Units_Delete',
      { id, storeId }
    );

    return (result?.AffectedRows ?? 0) > 0;
  }

  /**
   * Get all units for a store using sp_Units_GetByStore
   * Requirements: 8.4
   * 
   * @param storeId - Store ID
   * @returns Array of units
   */
  async getByStore(storeId: string): Promise<Unit[]> {
    const params: SPParams = {
      storeId,
    };

    const results = await this.executeSP<UnitSPRecord>(
      'sp_Units_GetByStore',
      params
    );

    return results.map((r) => this.mapToEntity(r));
  }

  /**
   * Get a single unit by ID
   *
   * @param id - Unit ID
   * @param storeId - Store ID
   * @returns Unit or null if not found
   */
  async getById(id: string, storeId: string): Promise<Unit | null> {
    const units = await this.getByStore(storeId);
    return units.find((u) => u.id.toLowerCase() === id.toLowerCase()) || null;
  }

  /**
   * Find unit by name within a store
   * 
   * @param name - Unit name
   * @param storeId - Store ID
   * @returns Unit or null if not found
   */
  async findByName(name: string, storeId: string): Promise<Unit | null> {
    const units = await this.getByStore(storeId);
    return units.find((u) => u.name.toLowerCase() === name.toLowerCase()) || null;
  }

  /**
   * Check if unit name exists (for validation)
   * 
   * @param name - Unit name
   * @param storeId - Store ID
   * @param excludeId - Optional ID to exclude from check
   * @returns True if name exists
   */
  async nameExists(
    name: string,
    storeId: string,
    excludeId?: string
  ): Promise<boolean> {
    const units = await this.getByStore(storeId);
    return units.some(
      (u) => u.name.toLowerCase() === name.toLowerCase() && u.id !== excludeId
    );
  }

  /**
   * Get base units only (units without a base unit reference)
   * 
   * @param storeId - Store ID
   * @returns Array of base units
   */
  async getBaseUnits(storeId: string): Promise<Unit[]> {
    const units = await this.getByStore(storeId);
    return units.filter((u) => !u.baseUnitId);
  }

  /**
   * Convert quantity from one unit to another
   * 
   * @param quantity - Quantity to convert
   * @param fromUnitId - Source unit ID
   * @param toUnitId - Target unit ID
   * @param storeId - Store ID
   * @returns Converted quantity or null if conversion not possible
   */
  async convertQuantity(
    quantity: number,
    fromUnitId: string,
    toUnitId: string,
    storeId: string
  ): Promise<number | null> {
    if (fromUnitId === toUnitId) {
      return quantity;
    }

    const fromUnit = await this.getById(fromUnitId, storeId);
    const toUnit = await this.getById(toUnitId, storeId);

    if (!fromUnit || !toUnit) {
      return null;
    }

    // Check if units share the same base
    const fromBaseId = fromUnit.baseUnitId || fromUnitId;
    const toBaseId = toUnit.baseUnitId || toUnitId;

    if (fromBaseId !== toBaseId) {
      return null;
    }

    const fromFactor = fromUnit.conversionFactor;
    const toFactor = toUnit.conversionFactor;
    
    return (quantity * fromFactor) / toFactor;
  }
}

// Export singleton instance
export const unitsSPRepository = new UnitsSPRepository();
