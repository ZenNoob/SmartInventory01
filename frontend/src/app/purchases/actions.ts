'use client';

import { apiClient } from '@/lib/api-client';

/**
 * Fetch all purchase orders for the current store
 */
export async function getPurchases(): Promise<{
  success: boolean;
  purchases?: Array<Record<string, unknown>>;
  error?: string;
}> {
  try {
    const purchases = await apiClient.getPurchases();
    return { success: true, purchases };
  } catch (error: unknown) {
    console.error('Error fetching purchases:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi lấy danh sách nhập hàng' 
    };
  }
}

/**
 * Get a single purchase order by ID
 */
export async function getPurchase(purchaseId: string): Promise<{
  success: boolean;
  purchase?: Record<string, unknown>;
  error?: string;
}> {
  try {
    const purchase = await apiClient.getPurchase(purchaseId);
    return { success: true, purchase };
  } catch (error: unknown) {
    console.error('Error fetching purchase:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi lấy thông tin phiếu nhập' 
    };
  }
}

/**
 * Create a new purchase order
 */
export async function createPurchase(purchase: Record<string, unknown>): Promise<{ 
  success: boolean; 
  purchase?: Record<string, unknown>;
  error?: string 
}> {
  try {
    const result = await apiClient.createPurchase(purchase);
    return { success: true, purchase: result as Record<string, unknown> };
  } catch (error: unknown) {
    console.error('Error creating purchase:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Không thể tạo phiếu nhập' 
    };
  }
}

/**
 * Update a purchase order
 */
export async function updatePurchase(purchaseId: string, data: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
  try {
    await apiClient.updatePurchase(purchaseId, data);
    return { success: true };
  } catch (error: unknown) {
    console.error('Error updating purchase:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Không thể cập nhật phiếu nhập' 
    };
  }
}

/**
 * Delete a purchase order
 */
export async function deletePurchase(purchaseId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await apiClient.deletePurchase(purchaseId);
    return { success: true };
  } catch (error: unknown) {
    console.error('Error deleting purchase:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Không thể xóa phiếu nhập' 
    };
  }
}


/**
 * Delete a purchase order (alias for deletePurchase)
 */
export async function deletePurchaseOrder(purchaseId: string): Promise<{ success: boolean; error?: string }> {
  return deletePurchase(purchaseId);
}

/**
 * Generate purchase orders Excel template
 */
export async function generatePurchaseOrdersExcel(): Promise<{
  success: boolean;
  data?: string;
  error?: string;
}> {
  // Return a placeholder - actual implementation would generate Excel
  return {
    success: true,
    data: '', // Base64 encoded Excel data would go here
  };
}
