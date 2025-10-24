'use server'

import { Category } from "@/lib/types";
import { getAdminServices } from "@/lib/admin-actions";

export async function upsertCategory(category: Partial<Category>): Promise<{ success: boolean; error?: string }> {
  try {
    const { firestore } = await getAdminServices();

    if (category.id) {
      // Update existing category
      const categoryRef = firestore.collection('categories').doc(category.id);
      await categoryRef.set(category, { merge: true });
    } else {
      // Create new category
      const categoryRef = firestore.collection('categories').doc();
      await categoryRef.set({ ...category, id: categoryRef.id });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error upserting category:", error);
    return { success: false, error: error.message || 'Không thể tạo hoặc cập nhật danh mục.' };
  }
}

export async function deleteCategory(categoryId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { firestore } = await getAdminServices();
    
    // TODO: Check if any product is using this category before deleting.
    // For now, we will delete it directly.

    await firestore.collection('categories').doc(categoryId).delete();
    
    return { success: true };
  } catch (error: any) {
      console.error("Error deleting category:", error);
      return { success: false, error: error.message || 'Không thể xóa danh mục.' };
  }
}
