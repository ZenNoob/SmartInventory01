'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ConversionLogModalProps {
  productId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConversionLogModal({ productId, open, onOpenChange }: ConversionLogModalProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (open) {
      loadLogs();
    }
  }, [open, page, productId]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getProductConversionLogs(productId, {
        page,
        pageSize: 10,
      });
      setLogs(data.logs);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lịch sử Chuyển đổi Đơn vị</DialogTitle>
          <DialogDescription>
            Xem các lần chuyển đổi tự động giữa đơn vị quy đổi và đơn vị lẻ
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">Đang tải...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Chưa có lịch sử chuyển đổi
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Thay đổi</TableHead>
                  <TableHead>Tồn kho trước</TableHead>
                  <TableHead>Tồn kho sau</TableHead>
                  <TableHead>Ghi chú</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {format(new Date(log.conversionDate), 'dd/MM/yyyy HH:mm', { locale: vi })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={log.conversionType === 'auto_deduct' ? 'default' : 'secondary'}>
                        {log.conversionType === 'auto_deduct' ? 'Tự động' : 'Thủ công'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>
                        {log.conversionUnitName}: {log.conversionUnitChange > 0 ? '+' : ''}
                        {log.conversionUnitChange}
                      </div>
                      <div className="text-muted-foreground">
                        {log.baseUnitName}: {log.baseUnitChange > 0 ? '+' : ''}
                        {log.baseUnitChange}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>
                        {log.beforeConversionUnitStock} {log.conversionUnitName}
                      </div>
                      <div className="text-muted-foreground">
                        {log.beforeBaseUnitStock} {log.baseUnitName}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>
                        {log.afterConversionUnitStock} {log.conversionUnitName}
                      </div>
                      <div className="text-muted-foreground">
                        {log.afterBaseUnitStock} {log.baseUnitName}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm max-w-xs truncate">
                      {log.notes || '-'}
                      {log.salesInvoiceNumber && (
                        <div className="text-muted-foreground">
                          HĐ: {log.salesInvoiceNumber}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Trước
                </Button>
                <span className="py-2 px-4 text-sm">
                  Trang {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Sau
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
