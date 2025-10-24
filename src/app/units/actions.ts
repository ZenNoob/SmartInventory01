'use server'

import { Unit } from "@/lib/types";
import { getAdminServices } from "@/lib/admin-actions";

export async function upsertUnit(unit: Partial<Unit>): Promise<{ success: boolean; error?: string }> {
  try {
    const { firestore } = await getAdminServices();

    if (unit.id) {
      // Update existing unit
      const unitRef = firestore.collection('units').doc(unit.id);
      await unitRef.set(unit, { merge: true });
    } else {
      // Create new unit
      const unitRef = firestore.collection('units').doc();
      await unitRef.set({ ...unit, id: unitRef.id });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error upserting unit:", error);
    return { success: false, error: error.message || 'Không thể tạo hoặc cập nhật đơn vị tính.' };
  }
}

export async function deleteUnit(unitId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { firestore } = await getAdminServices();
    
    // TODO: Check if any product is using this unit before deleting.
    // For now, we will delete it directly.

    await firestore.collection('units').doc(unitId).delete();
    
    return { success: true };
  } catch (error: any) {
      console.error("Error deleting unit:", error);
      return { success: false, error: error.message || 'Không thể xóa đơn vị tính.' };
  }
}
