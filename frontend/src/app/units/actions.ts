'use client';

import { apiClient } from '@/lib/api-client';

interface Unit {
  id: string;
  name: string;
  description?: string;
  baseUnitId?: string;
  conversionFactor?: number;
}

interface UnitWithBaseUnit extends Unit {
  baseUnitName?: string;
}

/**
 * Fetch all units for the current store
 */
export async function getUnits(): Promise<{
  success: boolean;
  units?: UnitWithBaseUnit[];
  error?: string;
}> {
  try {
    const units = await apiClient.getUnits();
    return { success: true, units };
  } catch (error: unknown) {
    console.error('Error fetching units:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi lấy danh sách đơn vị tính' 
    };
  }
}

/**
 * Create or update a unit
 */
export async function upsertUnit(unit: Partial<Unit>): Promise<{ success: boolean; error?: string }> {
  try {
    if (unit.id) {
      await apiClient.updateUnit(unit.id, {
        name: unit.name,
        description: unit.description,
        baseUnitId: unit.baseUnitId,
        conversionFactor: unit.conversionFactor,
      });
    } else {
      await apiClient.createUnit({
        name: unit.name!,
        description: unit.description,
        baseUnitId: unit.baseUnitId,
        conversionFactor: unit.conversionFactor,
      });
    }
    return { success: true };
  } catch (error: unknown) {
    console.error('Error upserting unit:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Không thể tạo hoặc cập nhật đơn vị tính' 
    };
  }
}

/**
 * Delete a unit
 */
export async function deleteUnit(unitId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await apiClient.deleteUnit(unitId);
    return { success: true };
  } catch (error: unknown) {
    console.error('Error deleting unit:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể xóa đơn vị tính'
    };
  }
}

/**
 * ProductUnit interface for product-specific unit conversions
 */
export interface ProductUnitConfig {
  id: string;
  productId: string;
  productName?: string;
  storeId: string;
  baseUnitId: string;
  baseUnitName?: string;
  conversionUnitId: string;
  conversionUnitName?: string;
  conversionRate: number;
  baseUnitPrice: number;
  conversionUnitPrice: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Fetch all product unit configurations for the current store
 */
export async function getProductUnitConfigs(): Promise<{
  success: boolean;
  data?: ProductUnitConfig[];
  error?: string;
}> {
  try {
    const response = await apiClient.getProductUnitConfigs();
    return { success: true, data: response.data || [] };
  } catch (error: unknown) {
    console.error('Error fetching product unit configs:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi lấy danh sách quy đổi sản phẩm'
    };
  }
}

/**
 * Create or update product unit configuration
 */
export async function upsertProductUnitConfig(
  productId: string,
  config: {
    baseUnitId: string;
    conversionUnitId: string;
    conversionRate: number;
    baseUnitPrice: number;
    conversionUnitPrice: number;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await apiClient.saveProductUnitConfig({ productId, ...config });
    return { success: true };
  } catch (error: unknown) {
    console.error('Error upserting product unit config:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể tạo hoặc cập nhật quy đổi sản phẩm'
    };
  }
}

/**
 * Delete product unit configuration
 */
export async function deleteProductUnitConfig(productId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await apiClient.deleteProductUnitConfig(productId);
    return { success: true };
  } catch (error: unknown) {
    console.error('Error deleting product unit config:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể xóa quy đổi sản phẩm'
    };
  }
}
