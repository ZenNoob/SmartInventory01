import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export interface ProductUnit {
  id: string;
  name: string;
  isBase: boolean;
  conversionFactor: number;
}

export interface ProductUnitsData {
  baseUnit: ProductUnit;
  availableUnits: ProductUnit[];
}

export function useProductUnits(productId: string | undefined) {
  const [data, setData] = useState<ProductUnitsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      setData(null);
      return;
    }

    const fetchUnits = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await apiClient.request<{
          success: boolean;
          baseUnit: ProductUnit;
          availableUnits: ProductUnit[];
        }>(`/products/${productId}/units`);
        
        if (response.success) {
          setData({
            baseUnit: response.baseUnit,
            availableUnits: response.availableUnits,
          });
        }
      } catch (err: any) {
        console.error('Error fetching product units:', err);
        setError(err.message || 'Failed to fetch units');
      } finally {
        setLoading(false);
      }
    };

    fetchUnits();
  }, [productId]);

  return { data, loading, error };
}
