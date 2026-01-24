'use client';

import { useMemo } from 'react';
import { Unit } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface UnitConversionDisplayProps {
  quantity: number;
  unitPrice: number;
  selectedUnit: Unit | undefined;
  baseUnit: Unit | undefined;
  conversionFactor: number;
}

export function UnitConversionDisplay({
  quantity,
  unitPrice,
  selectedUnit,
  baseUnit,
  conversionFactor,
}: UnitConversionDisplayProps) {
  const calculations = useMemo(() => {
    const baseQuantity = quantity * conversionFactor;
    const baseUnitPrice = unitPrice / conversionFactor;
    const totalAmount = quantity * unitPrice;

    return {
      baseQuantity,
      baseUnitPrice,
      totalAmount,
    };
  }, [quantity, unitPrice, conversionFactor]);

  // Don't show if same unit or no conversion
  if (!selectedUnit || !baseUnit || conversionFactor === 1 || selectedUnit.id === baseUnit.id) {
    return null;
  }

  return (
    <div className="text-xs text-muted-foreground space-y-1 mt-2 p-2 bg-muted/50 rounded">
      <div className="font-medium">Chuyển đổi về đơn vị cơ sở:</div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="text-foreground font-medium">{calculations.baseQuantity.toLocaleString()}</span>
          {' '}{baseUnit.name}
        </div>
        <div>
          <span className="text-foreground font-medium">{formatCurrency(calculations.baseUnitPrice)}</span>
          /{baseUnit.name}
        </div>
      </div>
      <div className="text-xs opacity-75">
        (1 {selectedUnit.name} = {conversionFactor} {baseUnit.name})
      </div>
    </div>
  );
}
