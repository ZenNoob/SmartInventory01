'use client';

import { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { apiClient } from '@/lib/api-client';

interface InventoryDisplayProps {
  productId: string;
  className?: string;
}

export function InventoryDisplay({ productId, className }: InventoryDisplayProps) {
  const [inventory, setInventory] = useState<{
    displayText: string;
    totalInBaseUnit: number;
    conversionUnitStock: number;
    baseUnitStock: number;
    conversionUnitName?: string;
    baseUnitName?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInventory();
  }, [productId]);

  const loadInventory = async () => {
    try {
      const data = await apiClient.getProductInventory(productId);
      setInventory(data);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <span className={className}>Đang tải...</span>;
  }

  if (!inventory) {
    return <span className={className}>N/A</span>;
  }

  const isLowStock = inventory.conversionUnitStock <= 10;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-2 ${className}`}>
            <Package className="h-4 w-4" />
            <span>{inventory.displayText}</span>
            {isLowStock && (
              <Badge variant="destructive" className="text-xs">
                Sắp hết
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1 text-sm">
            {inventory.conversionUnitName && (
              <p>
                {inventory.conversionUnitName}: {inventory.conversionUnitStock}
              </p>
            )}
            {inventory.baseUnitName && inventory.baseUnitStock > 0 && (
              <p>
                {inventory.baseUnitName}: {inventory.baseUnitStock}
              </p>
            )}
            {inventory.baseUnitName && (
              <p className="text-muted-foreground">
                Tổng: {inventory.totalInBaseUnit} {inventory.baseUnitName}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
