'use client';

import { apiClient } from '@/lib/api-client';

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface CategoryWithProductCount extends Category {
  productCount?: number;
}

/**
 * Fetch all categories for the current store
 */
export async function getCategories(): Promise<{ 
  success: boolean; 
  categories?: CategoryWithProductCount[]; 
  error?: string 
}> {
  try {
    const categories = await apiClient.getCategories();
    return { success: true, categories };
  } catch (error: unknown) {
    console.error('Error fetching categories:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi lấy danh sách danh mục' 
    };
  }
}

/**
 * Create or update a category
 */
export async function upsertCategory(category: Partial<Category>): Promise<{ success: boolean; error?: string }> {
  try {
    if (category.id) {
      await apiClient.updateCategory(category.id, {
        name: category.name,
        description: category.description,
      });
    } else {
      await apiClient.createCategory({
        name: category.name!,
        description: category.description,
      });
    }
    return { success: true };
  } catch (error: unknown) {
    console.error('Error upserting category:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Không thể tạo hoặc cập nhật danh mục' 
    };
  }
}

/**
 * Delete a category
 */
export async function deleteCategory(categoryId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await apiClient.deleteCategory(categoryId);
    return { success: true };
  } catch (error: unknown) {
    console.error('Error deleting category:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Không thể xóa danh mục' 
    };
  }
}
