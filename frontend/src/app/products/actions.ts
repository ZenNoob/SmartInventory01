'use client';

import { apiClient } from '@/lib/api-client';

interface GetProductsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  status?: string;
}

interface ProductWithStock {
  id: string;
  storeId: string;
  name: string;
  barcode?: string;
  description?: string;
  categoryId: string;
  unitId: string;
  sellingPrice?: number;
  status: 'active' | 'draft' | 'archived';
  lowStockThreshold?: number;
  createdAt: string;
  updatedAt: string;
  currentStock: number;
  averageCost: number;
  categoryName?: string;
  unitName?: string;
  avgCostByUnit?: Array<{
    unitId: string;
    unitName: string;
    avgCost: number;
    totalQty: number;
  }>;
}

/**
 * Fetch all products for the current store
 */
export async function getProducts(params?: GetProductsParams): Promise<{
  success: boolean;
  data?: ProductWithStock[];
  total?: number;
  totalPages?: number;
  error?: string;
}> {
  try {
    const rawProducts = await apiClient.getProducts() as Array<{
      id: string;
      storeId: string;
      name: string;
      sku?: string;
      description?: string;
      categoryId: string;
      categoryName?: string;
      price?: number;
      costPrice?: number;
      stockQuantity?: number;
      images?: string;
      status: 'active' | 'draft' | 'archived';
      createdAt: string;
      updatedAt: string;
    }>;
    
    // Debug: log first product to check avgCostByUnit
    if (rawProducts.length > 0) {
      console.log('First product from API:', rawProducts[0]);
      console.log('avgCostByUnit:', (rawProducts[0] as any).avgCostByUnit);
    }
    
    // Map API response to ProductWithStock format
    // Backend already returns products sorted by updated_at DESC, created_at DESC
    const products: ProductWithStock[] = rawProducts.map(p => ({
      id: p.id,
      storeId: p.storeId,
      name: p.name,
      barcode: p.sku,
      description: p.description,
      categoryId: p.categoryId,
      categoryName: p.categoryName,
      unitId: (p as any).unitId || '',
      sellingPrice: p.price || 0,
      status: p.status,
      lowStockThreshold: 10,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      currentStock: p.stockQuantity || 0,
      averageCost: p.costPrice || 0,
      avgCostByUnit: (p as any).avgCostByUnit || [],
    }));
    
    // Apply client-side filtering - preserve order from backend
    let filtered = products;
    
    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        (p.barcode && p.barcode.toLowerCase().includes(searchLower))
      );
    }
    
    if (params?.categoryId) {
      const categoryIds = params.categoryId.split(',').filter(id => id.trim());
      if (categoryIds.length > 0) {
        filtered = filtered.filter(p => categoryIds.includes(p.categoryId));
      }
    }
    
    if (params?.status) {
      filtered = filtered.filter(p => p.status === params.status);
    }
    
    const total = filtered.length;
    const pageSize = params?.pageSize || 20;
    const totalPages = Math.ceil(total / pageSize);
    const page = params?.page || 1;
    
    // Apply pagination
    const start = (page - 1) * pageSize;
    const paginatedData = filtered.slice(start, start + pageSize);
    
    return { 
      success: true, 
      data: paginatedData,
      total,
      totalPages
    };
  } catch (error: unknown) {
    console.error('Error fetching products:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi lấy danh sách sản phẩm' 
    };
  }
}

/**
 * Get a single product by ID
 */
export async function getProduct(productId: string): Promise<{
  success: boolean;
  product?: Record<string, unknown>;
  error?: string;
}> {
  try {
    const product = await apiClient.getProduct(productId);
    return { success: true, product };
  } catch (error: unknown) {
    console.error('Error fetching product:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi lấy thông tin sản phẩm' 
    };
  }
}

/**
 * Create or update a product
 */
export async function upsertProduct(product: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
  try {
    const id = product.id as string | undefined;
    
    // Map frontend field names to backend field names
    const productData = {
      ...product,
      price: product.sellingPrice, // Map sellingPrice -> price
      costPrice: product.costPrice,
      // Remove frontend-only fields
      sellingPrice: undefined,
    };
    
    if (id) {
      await apiClient.updateProduct(id, productData);
    } else {
      await apiClient.createProduct(productData);
    }
    return { success: true };
  } catch (error: unknown) {
    console.error('Error upserting product:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Không thể tạo hoặc cập nhật sản phẩm' 
    };
  }
}

/**
 * Delete a product
 */
export async function deleteProduct(productId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await apiClient.deleteProduct(productId);
    return { success: true };
  } catch (error: unknown) {
    console.error('Error deleting product:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Không thể xóa sản phẩm' 
    };
  }
}

/**
 * Update product status
 */
export async function updateProductStatus(
  productId: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await apiClient.updateProduct(productId, { status });
    return { success: true };
  } catch (error: unknown) {
    console.error('Error updating product status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể cập nhật trạng thái sản phẩm',
    };
  }
}

/**
 * Import products from file
 */
export async function importProducts(
  data: string | Array<Record<string, unknown>>
): Promise<{ success: boolean; imported?: number; createdCount?: number; error?: string }> {
  try {
    // If data is a string (base64), parse it first
    let products: Array<Record<string, unknown>>;
    if (typeof data === 'string') {
      // In real implementation, this would decode base64 and parse Excel/CSV
      // For now, return mock success
      return { success: true, imported: 0, createdCount: 0 };
    } else {
      products = data;
    }

    let imported = 0;
    for (const product of products) {
      await apiClient.createProduct(product);
      imported++;
    }
    return { success: true, imported, createdCount: imported };
  } catch (error: unknown) {
    console.error('Error importing products:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể import sản phẩm',
    };
  }
}

/**
 * Generate product template for import
 */
export async function generateProductTemplate(): Promise<{
  success: boolean;
  template?: Array<Record<string, unknown>>;
  data?: string;
  error?: string;
}> {
  return {
    success: true,
    data: '', // Base64 encoded Excel template
    template: [
      {
        name: 'Tên sản phẩm',
        sku: 'SKU001',
        price: 0,
        costPrice: 0,
        stockQuantity: 0,
        categoryId: '',
        description: '',
      },
    ],
  };
}
