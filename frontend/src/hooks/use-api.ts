'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: unknown[]) => Promise<T | null>;
  reset: () => void;
}

export function useApi<T>(
  apiMethod: (...args: unknown[]) => Promise<T>
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | null> => {
      setState(prev => ({ ...prev, loading: true, error: null }));
      try {
        const result = await apiMethod(...args);
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setState(prev => ({ ...prev, loading: false, error: errorMessage }));
        return null;
      }
    },
    [apiMethod]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}

// Specific hooks for common operations
export function useCategories() {
  const [categories, setCategories] = useState<Array<{ id: string; name: string; description?: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getCategories();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  }, []);

  const createCategory = useCallback(async (data: { name: string; description?: string }) => {
    try {
      const newCategory = await apiClient.createCategory(data);
      setCategories(prev => [...prev, newCategory]);
      return newCategory;
    } catch (err) {
      throw err;
    }
  }, []);

  const updateCategory = useCallback(async (id: string, data: { name?: string; description?: string }) => {
    try {
      const updated = await apiClient.updateCategory(id, data);
      setCategories(prev => prev.map(c => c.id === id ? updated : c));
      return updated;
    } catch (err) {
      throw err;
    }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    try {
      await apiClient.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      throw err;
    }
  }, []);

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}

export function useUnits() {
  const [units, setUnits] = useState<Array<{ id: string; name: string; description?: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUnits = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getUnits();
      setUnits(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch units');
    } finally {
      setLoading(false);
    }
  }, []);

  const createUnit = useCallback(async (data: { name: string; description?: string }) => {
    try {
      const newUnit = await apiClient.createUnit(data);
      setUnits(prev => [...prev, newUnit as { id: string; name: string; description?: string }]);
      return newUnit;
    } catch (err) {
      throw err;
    }
  }, []);

  const updateUnit = useCallback(async (id: string, data: { name?: string; description?: string }) => {
    try {
      const updated = await apiClient.updateUnit(id, data);
      setUnits(prev => prev.map(u => u.id === id ? updated as { id: string; name: string; description?: string } : u));
      return updated;
    } catch (err) {
      throw err;
    }
  }, []);

  const deleteUnit = useCallback(async (id: string) => {
    try {
      await apiClient.deleteUnit(id);
      setUnits(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      throw err;
    }
  }, []);

  return {
    units,
    loading,
    error,
    fetchUnits,
    createUnit,
    updateUnit,
    deleteUnit,
  };
}

export function useProducts() {
  const [products, setProducts] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getProducts();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, []);

  return { products, loading, error, fetchProducts };
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getCustomers();
      setCustomers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  }, []);

  return { customers, loading, error, fetchCustomers };
}

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getSuppliers();
      setSuppliers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  }, []);

  return { suppliers, loading, error, fetchSuppliers };
}
