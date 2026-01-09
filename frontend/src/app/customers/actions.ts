'use client';

import { apiClient } from '@/lib/api-client';

/**
 * Fetch all customers for the current store
 */
export async function getCustomers(): Promise<{
  success: boolean;
  customers?: Array<Record<string, unknown>>;
  error?: string;
}> {
  try {
    const customers = await apiClient.getCustomers();
    return { success: true, customers };
  } catch (error: unknown) {
    console.error('Error fetching customers:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi lấy danh sách khách hàng' 
    };
  }
}

/**
 * Get a single customer by ID
 */
export async function getCustomer(customerId: string): Promise<{
  success: boolean;
  customer?: Record<string, unknown>;
  error?: string;
}> {
  try {
    const customer = await apiClient.getCustomer(customerId);
    return { success: true, customer };
  } catch (error: unknown) {
    console.error('Error fetching customer:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi lấy thông tin khách hàng' 
    };
  }
}

/**
 * Create or update a customer
 */
export async function upsertCustomer(customer: Record<string, unknown>): Promise<{ success: boolean; customerId?: string; error?: string }> {
  try {
    const id = customer.id as string | undefined;
    if (id) {
      await apiClient.updateCustomer(id, customer);
      return { success: true, customerId: id };
    } else {
      const result = await apiClient.createCustomer(customer) as { id: string };
      return { success: true, customerId: result.id };
    }
  } catch (error: unknown) {
    console.error('Error upserting customer:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Không thể tạo hoặc cập nhật khách hàng' 
    };
  }
}

/**
 * Delete a customer
 */
export async function deleteCustomer(customerId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await apiClient.deleteCustomer(customerId);
    return { success: true };
  } catch (error: unknown) {
    console.error('Error deleting customer:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Không thể xóa khách hàng' 
    };
  }
}


/**
 * Update customer status
 */
export async function updateCustomerStatus(
  customerId: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await apiClient.updateCustomer(customerId, { status });
    return { success: true };
  } catch (error: unknown) {
    console.error('Error updating customer status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể cập nhật trạng thái khách hàng',
    };
  }
}

/**
 * Generate customer template for import
 */
export async function generateCustomerTemplate(): Promise<{
  success: boolean;
  data?: string;
  error?: string;
}> {
  return {
    success: true,
    data: '', // Base64 encoded Excel data would go here
  };
}

/**
 * Get customer debt information
 */
export async function getCustomerDebt(customerId: string): Promise<{
  success: boolean;
  debt?: number;
  error?: string;
}> {
  try {
    const customer = await apiClient.getCustomer(customerId);
    return { 
      success: true, 
      debt: (customer as { debt?: number }).debt || 0 
    };
  } catch (error: unknown) {
    console.error('Error fetching customer debt:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi lấy công nợ khách hàng' 
    };
  }
}


/**
 * Import customers from file
 */
export async function importCustomers(
  customers: Array<Record<string, unknown>>
): Promise<{ success: boolean; imported?: number; error?: string }> {
  try {
    let imported = 0;
    for (const customer of customers) {
      await apiClient.createCustomer(customer);
      imported++;
    }
    return { success: true, imported };
  } catch (error: unknown) {
    console.error('Error importing customers:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể import khách hàng',
    };
  }
}
