'use client';

import { apiClient } from '@/lib/api-client';

export interface OnlineStore {
  id: string;
  storeId: string;
  slug: string;
  customDomain?: string;
  isActive: boolean;
  storeName: string;
  logo?: string;
  favicon?: string;
  description?: string;
  themeId: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  currency: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
  productCount?: number;
  orderCount?: number;
}

/**
 * Fetch all online stores
 */
export async function getOnlineStores(): Promise<{
  success: boolean;
  data?: OnlineStore[];
  error?: string;
}> {
  try {
    const stores = await apiClient.getOnlineStores();
    return { success: true, data: stores as OnlineStore[] };
  } catch (error: unknown) {
    console.error('Error fetching online stores:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi lấy danh sách cửa hàng online' 
    };
  }
}

/**
 * Get a single online store by ID
 */
export async function getOnlineStore(storeId: string): Promise<{
  success: boolean;
  store?: Record<string, unknown>;
  error?: string;
}> {
  try {
    const store = await apiClient.getOnlineStore(storeId);
    return { success: true, store };
  } catch (error: unknown) {
    console.error('Error fetching online store:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi lấy thông tin cửa hàng online' 
    };
  }
}

/**
 * Create a new online store
 */
export async function createOnlineStore(store: Record<string, unknown>): Promise<{ 
  success: boolean; 
  store?: Record<string, unknown>;
  error?: string 
}> {
  try {
    const result = await apiClient.createOnlineStore(store);
    return { success: true, store: result as Record<string, unknown> };
  } catch (error: unknown) {
    console.error('Error creating online store:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Không thể tạo cửa hàng online' 
    };
  }
}

/**
 * Update an online store
 */
export async function updateOnlineStore(storeId: string, data: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
  try {
    await apiClient.updateOnlineStore(storeId, data);
    return { success: true };
  } catch (error: unknown) {
    console.error('Error updating online store:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Không thể cập nhật cửa hàng online' 
    };
  }
}

/**
 * Delete an online store (soft delete)
 */
export async function deleteOnlineStore(storeId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await apiClient.updateOnlineStore(storeId, { isActive: false });
    return { success: true };
  } catch (error: unknown) {
    console.error('Error deleting online store:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Không thể xóa cửa hàng online' 
    };
  }
}

/**
 * Permanently delete an online store
 */
export async function permanentDeleteOnlineStore(storeId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // For now, just deactivate since we don't have a delete endpoint
    await apiClient.updateOnlineStore(storeId, { isActive: false });
    return { success: true };
  } catch (error: unknown) {
    console.error('Error permanently deleting online store:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Không thể xóa vĩnh viễn cửa hàng online' 
    };
  }
}
