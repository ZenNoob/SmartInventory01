'use client';

import { apiClient } from '@/lib/api-client';

/**
 * Fetch all suppliers for the current store
 */
export async function getSuppliers(): Promise<{
  success: boolean;
  suppliers?: Array<Record<string, unknown>>;
  error?: string;
}> {
  try {
    const suppliers = await apiClient.getSuppliers();
    return { success: true, suppliers };
  } catch (error: unknown) {
    console.error('Error fetching suppliers:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi lấy danh sách nhà cung cấp' 
    };
  }
}

/**
 * Get a single supplier by ID
 */
export async function getSupplier(supplierId: string): Promise<{
  success: boolean;
  supplier?: Record<string, unknown>;
  error?: string;
}> {
  try {
    const supplier = await apiClient.getSupplier(supplierId);
    return { success: true, supplier };
  } catch (error: unknown) {
    console.error('Error fetching supplier:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi lấy thông tin nhà cung cấp' 
    };
  }
}

/**
 * Create or update a supplier
 */
export async function upsertSupplier(supplier: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
  try {
    const id = supplier.id as string | undefined;
    if (id) {
      await apiClient.updateSupplier(id, supplier);
    } else {
      await apiClient.createSupplier(supplier);
    }
    return { success: true };
  } catch (error: unknown) {
    console.error('Error upserting supplier:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Không thể tạo hoặc cập nhật nhà cung cấp' 
    };
  }
}

/**
 * Delete a supplier
 */
export async function deleteSupplier(supplierId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await apiClient.deleteSupplier(supplierId);
    return { success: true };
  } catch (error: unknown) {
    console.error('Error deleting supplier:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Không thể xóa nhà cung cấp' 
    };
  }
}


/**
 * Add supplier payment
 */
export async function addSupplierPayment(payment: Record<string, unknown>): Promise<{ 
  success: boolean; 
  payment?: Record<string, unknown>;
  error?: string 
}> {
  try {
    const result = await apiClient.createSupplierPayment(payment);
    return { success: true, payment: result as Record<string, unknown> };
  } catch (error: unknown) {
    console.error('Error adding supplier payment:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Không thể thêm thanh toán cho nhà cung cấp' 
    };
  }
}

/**
 * Get supplier payments
 */
export async function getSupplierPayments(): Promise<{
  success: boolean;
  payments?: Array<Record<string, unknown>>;
  error?: string;
}> {
  try {
    const payments = await apiClient.getSupplierPayments();
    return { success: true, payments };
  } catch (error: unknown) {
    console.error('Error fetching supplier payments:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi lấy danh sách thanh toán' 
    };
  }
}
