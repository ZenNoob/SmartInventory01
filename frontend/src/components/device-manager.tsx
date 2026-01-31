'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Printer, CreditCard, Scale, Monitor, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DeviceStatus {
  printer: boolean;
  cardReader: boolean;
  scale: boolean;
  display: boolean;
}

export function DeviceManager() {
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({
    printer: false,
    cardReader: false,
    scale: false,
    display: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDeviceStatus();
  }, []);

  const loadDeviceStatus = async () => {
    try {
      const response = await fetch('/api/devices/status', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setDeviceStatus(result.data);
      }
    } catch (error) {
      console.error('Failed to load device status:', error);
    }
  };

  const configurePrinter = async (config: any) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/devices/printer/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) throw new Error('Failed to configure printer');

      toast({
        title: 'Thành công',
        description: 'Đã cấu hình máy in',
      });

      await loadDeviceStatus();
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể cấu hình máy in',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const configureCardReader = async (config: any) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/devices/card-reader/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) throw new Error('Failed to configure card reader');

      toast({
        title: 'Thành công',
        description: 'Đã cấu hình máy quẹt thẻ',
      });

      await loadDeviceStatus();
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể cấu hình máy quẹt thẻ',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const configureScale = async (config: any) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/devices/scale/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) throw new Error('Failed to configure scale');

      toast({
        title: 'Thành công',
        description: 'Đã cấu hình cân điện tử',
      });

      await loadDeviceStatus();
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể cấu hình cân điện tử',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const configureDisplay = async (config: any) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/devices/display/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) throw new Error('Failed to configure display');

      toast({
        title: 'Thành công',
        description: 'Đã cấu hình màn hình khách hàng',
      });

      await loadDeviceStatus();
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể cấu hình màn hình',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Quản lý thiết bị</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Máy in nhiệt */}
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              <span className="font-medium">Máy in nhiệt</span>
            </div>
            <Badge variant={deviceStatus.printer ? 'default' : 'secondary'}>
              {deviceStatus.printer ? 'Đã kết nối' : 'Chưa kết nối'}
            </Badge>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Settings className="mr-2 h-4 w-4" />
                Cấu hình
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cấu hình máy in nhiệt</DialogTitle>
                <DialogDescription>
                  Thiết lập kết nối với máy in hóa đơn nhiệt
                </DialogDescription>
              </DialogHeader>
              <PrinterConfigForm onSubmit={configurePrinter} isLoading={isLoading} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Máy quẹt thẻ */}
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <span className="font-medium">Máy quẹt thẻ</span>
            </div>
            <Badge variant={deviceStatus.cardReader ? 'default' : 'secondary'}>
              {deviceStatus.cardReader ? 'Đã kết nối' : 'Chưa kết nối'}
            </Badge>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Settings className="mr-2 h-4 w-4" />
                Cấu hình
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cấu hình máy quẹt thẻ</DialogTitle>
                <DialogDescription>
                  Thiết lập kết nối với máy quẹt thẻ thanh toán
                </DialogDescription>
              </DialogHeader>
              <CardReaderConfigForm onSubmit={configureCardReader} isLoading={isLoading} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Cân điện tử */}
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              <span className="font-medium">Cân điện tử</span>
            </div>
            <Badge variant={deviceStatus.scale ? 'default' : 'secondary'}>
              {deviceStatus.scale ? 'Đã kết nối' : 'Chưa kết nối'}
            </Badge>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Settings className="mr-2 h-4 w-4" />
                Cấu hình
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cấu hình cân điện tử</DialogTitle>
                <DialogDescription>
                  Thiết lập kết nối với cân điện tử
                </DialogDescription>
              </DialogHeader>
              <ScaleConfigForm onSubmit={configureScale} isLoading={isLoading} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Màn hình khách hàng */}
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              <span className="font-medium">Màn hình KH</span>
            </div>
            <Badge variant={deviceStatus.display ? 'default' : 'secondary'}>
              {deviceStatus.display ? 'Đã kết nối' : 'Chưa kết nối'}
            </Badge>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Settings className="mr-2 h-4 w-4" />
                Cấu hình
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cấu hình màn hình khách hàng</DialogTitle>
                <DialogDescription>
                  Thiết lập kết nối với màn hình hiển thị khách hàng
                </DialogDescription>
              </DialogHeader>
              <DisplayConfigForm onSubmit={configureDisplay} isLoading={isLoading} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

function PrinterConfigForm({ onSubmit, isLoading }: any) {
  const [config, setConfig] = useState({
    type: 'thermal',
    port: 'COM1',
    baudRate: 9600,
    paperWidth: 80,
  });

  return (
    <div className="space-y-4">
      <div>
        <Label>Loại máy in</Label>
        <Select value={config.type} onValueChange={(value) => setConfig({ ...config, type: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="thermal">Máy in nhiệt</SelectItem>
            <SelectItem value="laser">Máy in laser</SelectItem>
            <SelectItem value="inkjet">Máy in phun</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Cổng kết nối</Label>
        <Input value={config.port} onChange={(e) => setConfig({ ...config, port: e.target.value })} />
      </div>
      <div>
        <Label>Baud Rate</Label>
        <Input type="number" value={config.baudRate} onChange={(e) => setConfig({ ...config, baudRate: parseInt(e.target.value) })} />
      </div>
      <div>
        <Label>Khổ giấy (mm)</Label>
        <Input type="number" value={config.paperWidth} onChange={(e) => setConfig({ ...config, paperWidth: parseInt(e.target.value) })} />
      </div>
      <Button onClick={() => onSubmit(config)} disabled={isLoading} className="w-full">
        Lưu cấu hình
      </Button>
    </div>
  );
}

function CardReaderConfigForm({ onSubmit, isLoading }: any) {
  const [config, setConfig] = useState({
    type: 'magnetic',
    port: 'COM2',
  });

  return (
    <div className="space-y-4">
      <div>
        <Label>Loại máy quẹt</Label>
        <Select value={config.type} onValueChange={(value) => setConfig({ ...config, type: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="magnetic">Thẻ từ</SelectItem>
            <SelectItem value="chip">Thẻ chip</SelectItem>
            <SelectItem value="contactless">Không tiếp xúc</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Cổng kết nối</Label>
        <Input value={config.port} onChange={(e) => setConfig({ ...config, port: e.target.value })} />
      </div>
      <Button onClick={() => onSubmit(config)} disabled={isLoading} className="w-full">
        Lưu cấu hình
      </Button>
    </div>
  );
}

function ScaleConfigForm({ onSubmit, isLoading }: any) {
  const [config, setConfig] = useState({
    type: 'serial',
    port: 'COM3',
    baudRate: 9600,
    unit: 'kg',
  });

  return (
    <div className="space-y-4">
      <div>
        <Label>Loại kết nối</Label>
        <Select value={config.type} onValueChange={(value) => setConfig({ ...config, type: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="serial">Serial</SelectItem>
            <SelectItem value="usb">USB</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Cổng kết nối</Label>
        <Input value={config.port} onChange={(e) => setConfig({ ...config, port: e.target.value })} />
      </div>
      <div>
        <Label>Baud Rate</Label>
        <Input type="number" value={config.baudRate} onChange={(e) => setConfig({ ...config, baudRate: parseInt(e.target.value) })} />
      </div>
      <div>
        <Label>Đơn vị</Label>
        <Select value={config.unit} onValueChange={(value) => setConfig({ ...config, unit: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="kg">Kilogram (kg)</SelectItem>
            <SelectItem value="g">Gram (g)</SelectItem>
            <SelectItem value="lb">Pound (lb)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button onClick={() => onSubmit(config)} disabled={isLoading} className="w-full">
        Lưu cấu hình
      </Button>
    </div>
  );
}

function DisplayConfigForm({ onSubmit, isLoading }: any) {
  const [config, setConfig] = useState({
    type: 'serial',
    port: 'COM4',
    lines: 2,
    columns: 20,
  });

  return (
    <div className="space-y-4">
      <div>
        <Label>Loại kết nối</Label>
        <Select value={config.type} onValueChange={(value) => setConfig({ ...config, type: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="serial">Serial</SelectItem>
            <SelectItem value="usb">USB</SelectItem>
            <SelectItem value="network">Network</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Cổng kết nối</Label>
        <Input value={config.port} onChange={(e) => setConfig({ ...config, port: e.target.value })} />
      </div>
      <div>
        <Label>Số dòng</Label>
        <Input type="number" value={config.lines} onChange={(e) => setConfig({ ...config, lines: parseInt(e.target.value) })} />
      </div>
      <div>
        <Label>Số ký tự/dòng</Label>
        <Input type="number" value={config.columns} onChange={(e) => setConfig({ ...config, columns: parseInt(e.target.value) })} />
      </div>
      <Button onClick={() => onSubmit(config)} disabled={isLoading} className="w-full">
        Lưu cấu hình
      </Button>
    </div>
  );
}
