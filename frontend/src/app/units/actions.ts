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
