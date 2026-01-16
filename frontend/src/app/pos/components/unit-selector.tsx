'use client';

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';

interface UnitSelectorProps {
  productId: string;
  value?: string;
  onChange: (unitId: string, unitName: string, price: number) => void;
  className?: string;
}

export function UnitSelector({ productId, value, onChange, className }: UnitSelectorProps) {
  const [units, setUnits] = useState<Array<{
    id: string;
    name: string;
    price: number;
    isBase: boolean;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUnits();
  }, [productId]);

  const loadUnits = async () => {
    try {
      // Get product units config
      const { productUnit } = await apiClient.getProductUnits(productId);
      
      if (productUnit) {
        // Product has unit conversion configured
        const availableUnits = [
          {
            id: productUnit.conversionUnitId,
            name: productUnit.conversionUnitName || 'Đơn vị quy đổi',
            price: productUnit.conversionUnitPrice,
            isBase: false,
          },
          {
            id: productUnit.baseUnitId,
            name: productUnit.baseUnitName || 'Đơn vị cơ bản',
            price: productUnit.baseUnitPrice,
            isBase: true,
          },
        ];
        setUnits(availableUnits);
        
        // Auto-select conversion unit by default
        if (!value && availableUnits.length > 0) {
          onChange(
            availableUnits[0].id,
            availableUnits[0].name,
            availableUnits[0].price
          );
        }
      } else {
        // No unit conversion, use default
        setUnits([]);
      }
    } catch (error) {
      console.error('Failed to load units:', error);
      setUnits([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className={className}>Đang tải...</div>;
  }

  if (units.length === 0) {
    return null; // No unit conversion configured
  }

  return (
    <Select
      value={value}
      onValueChange={(unitId) => {
        const unit = units.find((u) => u.id === unitId);
        if (unit) {
          onChange(unit.id, unit.name, unit.price);
        }
      }}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder="Chọn đơn vị" />
      </SelectTrigger>
      <SelectContent>
        {units.map((unit) => (
          <SelectItem key={unit.id} value={unit.id}>
            {unit.name} - {unit.price.toLocaleString('vi-VN')}đ
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
