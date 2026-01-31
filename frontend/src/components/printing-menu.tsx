'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Printer, FileDown, Barcode, Tag, FileText, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PrintingMenuProps {
  type: 'product' | 'sale' | 'purchase' | 'inventory';
  data: any;
  selectedIds?: string[];
}

export function PrintingMenu({ type, data, selectedIds = [] }: PrintingMenuProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const { toast } = useToast();

  const handlePrintBarcode = async () => {
    if (!selectedIds.length) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng chọn sản phẩm để in mã vạch',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/printing/barcode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ productIds: selectedIds }),
      });

      if (!response.ok) throw new Error('Failed to print barcode');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'barcode-labels.pdf';
      a.click();

      toast({
        title: 'Thành công',
        description: 'Đã tạo tem mã vạch',
      });
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể in mã vạch',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintPriceLabel = async () => {
    if (!selectedIds.length) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng chọn sản phẩm để in nhãn giá',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/printing/price-label', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ productIds: selectedIds }),
      });

      if (!response.ok) throw new Error('Failed to print price label');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'price-labels.pdf';
      a.click();

      toast({
        title: 'Thành công',
        description: 'Đã tạo nhãn giá',
      });
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể in nhãn giá',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintReceipt = async (orderId: string, receiptType: 'purchase' | 'delivery') => {
    setIsLoading(true);
    try {
      const endpoint = receiptType === 'purchase' 
        ? `/api/printing/purchase-receipt/${orderId}`
        : `/api/printing/delivery-note/${orderId}`;

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to print receipt');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${receiptType}-receipt.pdf`;
      a.click();

      toast({
        title: 'Thành công',
        description: 'Đã tạo phiếu',
      });
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể in phiếu',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintPriceList = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/printing/price-list', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to print price list');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'price-list.pdf';
      a.click();

      toast({
        title: 'Thành công',
        description: 'Đã tạo bảng giá',
      });
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể in bảng giá',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: 'excel' | 'pdf' | 'csv') => {
    setIsLoading(true);
    try {
      let endpoint = '';
      let body: any = { format };

      switch (type) {
        case 'sale':
          endpoint = '/api/printing/export/sales';
          body = { ...body, startDate: data.startDate, endDate: data.endDate };
          break;
        case 'purchase':
          endpoint = '/api/printing/export/purchases';
          body = { ...body, startDate: data.startDate, endDate: data.endDate };
          break;
        case 'inventory':
          endpoint = '/api/printing/export/inventory';
          break;
        case 'product':
          endpoint = '/api/printing/export/products';
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Failed to export');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report.${format === 'excel' ? 'xlsx' : format}`;
      a.click();

      toast({
        title: 'Thành công',
        description: `Đã xuất báo cáo ${format.toUpperCase()}`,
      });
      setShowExportDialog(false);
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể xuất báo cáo',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={isLoading}>
            <Printer className="mr-2 h-4 w-4" />
            In & Xuất
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>In ấn</DropdownMenuLabel>
          
          {type === 'product' && (
            <>
              <DropdownMenuItem onClick={handlePrintBarcode}>
                <Barcode className="mr-2 h-4 w-4" />
                In tem mã vạch
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePrintPriceLabel}>
                <Tag className="mr-2 h-4 w-4" />
                In nhãn giá
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePrintPriceList}>
                <FileText className="mr-2 h-4 w-4" />
                In bảng giá
              </DropdownMenuItem>
            </>
          )}

          {type === 'purchase' && data?.id && (
            <DropdownMenuItem onClick={() => handlePrintReceipt(data.id, 'purchase')}>
              <Package className="mr-2 h-4 w-4" />
              In phiếu nhập kho
            </DropdownMenuItem>
          )}

          {type === 'sale' && data?.id && (
            <DropdownMenuItem onClick={() => handlePrintReceipt(data.id, 'delivery')}>
              <Package className="mr-2 h-4 w-4" />
              In phiếu xuất kho
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Xuất dữ liệu</DropdownMenuLabel>
          
          <DropdownMenuItem onClick={() => setShowExportDialog(true)}>
            <FileDown className="mr-2 h-4 w-4" />
            Xuất báo cáo
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xuất báo cáo</DialogTitle>
            <DialogDescription>
              Chọn định dạng file để xuất báo cáo
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button onClick={() => handleExport('excel')} disabled={isLoading}>
              <FileDown className="mr-2 h-4 w-4" />
              Xuất Excel (.xlsx)
            </Button>
            <Button onClick={() => handleExport('pdf')} disabled={isLoading}>
              <FileDown className="mr-2 h-4 w-4" />
              Xuất PDF
            </Button>
            <Button onClick={() => handleExport('csv')} disabled={isLoading}>
              <FileDown className="mr-2 h-4 w-4" />
              Xuất CSV
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
