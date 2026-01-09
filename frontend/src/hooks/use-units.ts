'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '@/lib/api-client';

export interface Unit {
  id: string;
  name: string;
  description?: string;
  baseUnitId?: string;
  conversionFactor?: number;
  baseUnitName?: string;
}

interface UseUnitsResult {
  units: Unit[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  unitsMap: Map<string, string>;
}

/**
 * Hook to fetch units from backend API
 */
export function useUnits(): UseUnitsResult {
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUnits = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.getUnits();
      setUnits(data);
    } catch (err) {
      console.error('Error fetching units:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setUnits([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  // Create a map of unit ID to unit name for easy lookup
  const unitsMap = useMemo(() => {
    return units.reduce((map, unit) => {
      map.set(unit.id, unit.name);
      return map;
    }, new Map<string, string>());
  }, [units]);

  return {
    units,
    isLoading,
    error,
    refetch: fetchUnits,
    unitsMap,
  };
}

/**
 * Hook to get a single unit by ID
 */
export function useUnit(unitId: string | null): {
  unit: Unit | null;
  isLoading: boolean;
  error: string | null;
} {
  const [unit, setUnit] = useState<Unit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!unitId) {
      setUnit(null);
      setIsLoading(false);
      return;
    }

    const fetchUnit = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await apiClient.getUnit(unitId);
        setUnit(data);
      } catch (err) {
        console.error('Error fetching unit:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setUnit(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnit();
  }, [unitId]);

  return { unit, isLoading, error };
}

/**
 * Hook to get base units only
 */
export function useBaseUnits(): UseUnitsResult {
  return useUnits();
}
