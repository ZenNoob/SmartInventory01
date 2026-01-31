import { query } from '../db';

export interface UnitConversion {
  fromUnitId: string;
  fromUnitName: string;
  toUnitId: string;
  toUnitName: string;
  conversionFactor: number;
  fromQuantity: number;
  toQuantity: number;
}

export interface ProductUnit {
  id: string;
  name: string;
  isBase: boolean;
  conversionFactor: number;
}

export class UnitConversionService {
  /**
   * Get all available units for a product
   */
  async getProductUnits(productId: string): Promise<{
    baseUnit: ProductUnit;
    availableUnits: ProductUnit[];
  }> {
    // Get product's base unit
    const productResult = await query<{ unit_id: string; unit_name: string }>(
      `SELECT p.unit_id, u.name as unit_name
       FROM Products p
       JOIN Units u ON p.unit_id = u.id
       WHERE p.id = @productId`,
      { productId }
    );

    if (productResult.length === 0) {
      throw new Error('Product not found');
    }

    const baseUnitId: string = productResult[0].unit_id;
    const baseUnitName: string = productResult[0].unit_name;

    // Get all units that can convert to this base unit
    const unitsResult = await query<{
      id: string;
      name: string;
      is_base: number;
      conversion_factor: number;
    }>(
      `SELECT id, name,
              CASE WHEN base_unit_id IS NULL THEN 1 ELSE 0 END as is_base,
              ISNULL(conversion_factor, 1) as conversion_factor
       FROM Units
       WHERE (base_unit_id = @baseUnitId OR id = @baseUnitId)
         AND store_id = (SELECT store_id FROM Products WHERE id = @productId)
       ORDER BY conversion_factor`,
      { baseUnitId, productId }
    );

    const baseUnit: ProductUnit = {
      id: baseUnitId,
      name: baseUnitName,
      isBase: true,
      conversionFactor: 1,
    };

    const availableUnits: ProductUnit[] = unitsResult.map((u) => ({
      id: u.id,
      name: u.name,
      isBase: u.is_base === 1,
      conversionFactor: Number(u.conversion_factor),
    }));

    return { baseUnit, availableUnits };
  }

  /**
   * Convert quantity from one unit to another
   */
  async convertQuantity(
    productId: string,
    fromUnitId: string,
    toUnitId: string,
    quantity: number
  ): Promise<UnitConversion> {
    // Get conversion factors
    const fromUnitResult = await query<{ name: string; conversion_factor: number }>(
      `SELECT name, ISNULL(conversion_factor, 1) as conversion_factor
       FROM Units WHERE id = @fromUnitId`,
      { fromUnitId }
    );

    const toUnitResult = await query<{ name: string; conversion_factor: number }>(
      `SELECT name, ISNULL(conversion_factor, 1) as conversion_factor
       FROM Units WHERE id = @toUnitId`,
      { toUnitId }
    );

    if (fromUnitResult.length === 0 || toUnitResult.length === 0) {
      throw new Error('Unit not found');
    }

    const fromFactor = Number(fromUnitResult[0].conversion_factor);
    const toFactor = Number(toUnitResult[0].conversion_factor);

    // Convert: quantity * fromFactor / toFactor
    const convertedQuantity = (quantity * fromFactor) / toFactor;

    return {
      fromUnitId,
      fromUnitName: fromUnitResult[0].name,
      toUnitId,
      toUnitName: toUnitResult[0].name,
      conversionFactor: fromFactor / toFactor,
      fromQuantity: quantity,
      toQuantity: convertedQuantity,
    };
  }

  /**
   * Calculate price in different units
   */
  async calculatePrice(
    productId: string,
    unitId: string,
    quantity: number,
    priceType: 'cost' | 'selling'
  ): Promise<{
    unitPrice: number;
    baseUnitPrice: number;
    quantity: number;
    baseQuantity: number;
    totalAmount: number;
  }> {
    // Get product's base unit price
    const productResult = await query(
      `SELECT unit_id, 
              ${priceType === 'cost' ? 'cost_price' : 'price'} as base_price
       FROM Products WHERE id = @productId`,
      { productId }
    );

    if (productResult.length === 0) {
      throw new Error('Product not found');
    }

    const baseUnitPrice = Number(productResult[0].base_price) || 0;

    // Get conversion factor
    const unitResult = await query(
      `SELECT ISNULL(conversion_factor, 1) as conversion_factor
       FROM Units WHERE id = @unitId`,
      { unitId }
    );

    const conversionFactor = Number(unitResult[0]?.conversion_factor || 1);

    // Calculate
    const unitPrice = baseUnitPrice * conversionFactor;
    const baseQuantity = quantity * conversionFactor;
    const totalAmount = unitPrice * quantity;

    return {
      unitPrice,
      baseUnitPrice,
      quantity,
      baseQuantity,
      totalAmount,
    };
  }

  /**
   * Convert purchase order item to base unit
   */
  async convertPurchaseItem(
    productId: string,
    unitId: string,
    quantity: number,
    unitPrice: number
  ): Promise<{
    quantity: number;
    unitId: string;
    unitPrice: number;
    baseQuantity: number;
    baseUnitPrice: number;
    totalAmount: number;
  }> {
    // Get product's base unit
    const productResult = await query(
      `SELECT unit_id FROM Products WHERE id = @productId`,
      { productId }
    );

    if (productResult.length === 0) {
      throw new Error('Product not found');
    }

    const baseUnitId = productResult[0].unit_id;

    // Get conversion factor
    const unitResult = await query(
      `SELECT ISNULL(conversion_factor, 1) as conversion_factor
       FROM Units WHERE id = @unitId`,
      { unitId }
    );

    const conversionFactor = Number(unitResult[0]?.conversion_factor || 1);

    // Calculate
    const baseQuantity = quantity * conversionFactor;
    const baseUnitPrice = unitPrice / conversionFactor;
    const totalAmount = quantity * unitPrice;

    return {
      quantity,
      unitId,
      unitPrice,
      baseQuantity,
      baseUnitPrice,
      totalAmount,
    };
  }
}

export const unitConversionService = new UnitConversionService();
