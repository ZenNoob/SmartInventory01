'use client'

import { useState, useMemo, useEffect, useCallback } from "react"
import {
  MoreHorizontal,
  PlusCircle,
  Search,
  ArrowUp,
  ArrowDown,
  Package,
  Ruler,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { UnitForm } from "./components/unit-form"
import { ProductUnitForm } from "./components/product-unit-form"
import { deleteUnit, getProductUnitConfigs, deleteProductUnitConfig, ProductUnitConfig } from "./actions"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useUserRole } from "@/hooks/use-user-role"
import { useUnits, type Unit } from "@/hooks/use-units"
import { apiClient } from "@/lib/api-client"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"

type SortKey = 'name' | 'description' | 'quyDoi';

interface Product {
  id: string;
  name: string;
  unitId?: string;
  price?: number;
}

export default function UnitsPage() {
  const [activeTab, setActiveTab] = useState("units");

  // Units tab state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | undefined>(undefined);
  const [unitToDelete, setUnitToDelete] = useState<Unit | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Product Units tab state
  const [isProductUnitFormOpen, setIsProductUnitFormOpen] = useState(false);
  const [selectedProductUnit, setSelectedProductUnit] = useState<ProductUnitConfig | undefined>(undefined);
  const [productUnitToDelete, setProductUnitToDelete] = useState<ProductUnitConfig | null>(null);
  const [productUnitConfigs, setProductUnitConfigs] = useState<ProductUnitConfig[]>([]);
  const [productUnitConfigsLoading, setProductUnitConfigsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState("");

  const { toast } = useToast();
  const { permissions, isLoading: isRoleLoading } = useUserRole();
  const { units, isLoading: unitsLoading, refetch, unitsMap } = useUnits();

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const response = await apiClient.getProducts();
      const data = (response as any).data || response || [];
      setProducts(data.map((p: any) => ({
        id: p.id,
        name: p.name,
        unitId: p.unitId,
        price: p.price,
      })));
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  // Fetch product unit configs
  const fetchProductUnitConfigs = useCallback(async () => {
    setProductUnitConfigsLoading(true);
    try {
      const result = await getProductUnitConfigs();
      if (result.success && result.data) {
        setProductUnitConfigs(result.data);
      }
    } catch (error) {
      console.error('Error fetching product unit configs:', error);
    } finally {
      setProductUnitConfigsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'product-units') {
      fetchProducts();
      fetchProductUnitConfigs();
    }
  }, [activeTab, fetchProducts, fetchProductUnitConfigs]);

  const filteredUnits = units?.filter(unit => {
    const term = searchTerm.toLowerCase();
    const baseUnitName = unit.baseUnitId ? unitsMap.get(unit.baseUnitId)?.toLowerCase() : '';
    return (
      unit.name.toLowerCase().includes(term) ||
      (unit.description && unit.description.toLowerCase().includes(term)) ||
      (baseUnitName && baseUnitName.includes(term))
    );
  })

  const filteredProductUnitConfigs = productUnitConfigs.filter(config => {
    const term = productSearchTerm.toLowerCase();
    return (
      (config.productName?.toLowerCase().includes(term)) ||
      (config.baseUnitName?.toLowerCase().includes(term)) ||
      (config.conversionUnitName?.toLowerCase().includes(term))
    );
  });

  const handleAddUnit = () => {
    setSelectedUnit(undefined);
    setIsFormOpen(true);
  }

  const handleEditUnit = (unit: Unit) => {
    setSelectedUnit(unit);
    setIsFormOpen(true);
  }

  const handleFormSuccess = () => {
    refetch();
  }

  const handleDelete = async () => {
    if (!unitToDelete) return;
    setIsDeleting(true);
    const result = await deleteUnit(unitToDelete.id);
    if (result.success) {
      toast({
        title: "Thành công!",
        description: `Đã xóa đơn vị tính "${unitToDelete.name}".`,
      });
      refetch();
    } else {
      toast({
        variant: "destructive",
        title: "Ôi! Đã có lỗi xảy ra.",
        description: result.error,
      });
    }
    setIsDeleting(false);
    setUnitToDelete(null);
  }

  // Product Unit handlers
  const handleAddProductUnit = () => {
    setSelectedProductUnit(undefined);
    setIsProductUnitFormOpen(true);
  }

  const handleEditProductUnit = (config: ProductUnitConfig) => {
    setSelectedProductUnit(config);
    setIsProductUnitFormOpen(true);
  }

  const handleProductUnitFormSuccess = () => {
    fetchProductUnitConfigs();
  }

  const handleDeleteProductUnit = async () => {
    if (!productUnitToDelete) return;
    setIsDeleting(true);
    const result = await deleteProductUnitConfig(productUnitToDelete.productId);
    if (result.success) {
      toast({
        title: "Thành công!",
        description: `Đã xóa quy đổi sản phẩm "${productUnitToDelete.productName}".`,
      });
      fetchProductUnitConfigs();
    } else {
      toast({
        variant: "destructive",
        title: "Ôi! Đã có lỗi xảy ra.",
        description: result.error,
      });
    }
    setIsDeleting(false);
    setProductUnitToDelete(null);
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedUnits = useMemo(() => {
    let sortableItems = [...(filteredUnits || [])];
    if (sortKey) {
      sortableItems.sort((a, b) => {
        let valA: string | number | undefined, valB: string | number | undefined;

        switch (sortKey) {
          case 'name':
            valA = a.name.toLowerCase();
            valB = b.name.toLowerCase();
            break;
          case 'description':
            valA = a.description?.toLowerCase() || '';
            valB = b.description?.toLowerCase() || '';
            break;
          case 'quyDoi':
            valA = a.conversionFactor || 0;
            valB = b.conversionFactor || 0;
            break;
          default:
            return 0;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredUnits, sortKey, sortDirection]);

  const SortableHeader = ({ sortKey: key, children }: { sortKey: SortKey; children: React.ReactNode }) => (
    <TableHead>
      <Button variant="ghost" onClick={() => handleSort(key)} className="px-2 py-1 h-auto">
        {children}
        {sortKey === key && (
          sortDirection === 'asc' ? <ArrowUp className="h-4 w-4 ml-2" /> : <ArrowDown className="h-4 w-4 ml-2" />
        )}
      </Button>
    </TableHead>
  );

  const isLoading = unitsLoading || isRoleLoading;
  const canView = permissions?.units?.includes('view');
  const canAdd = permissions?.units?.includes('add');
  const canEdit = permissions?.units?.includes('edit');
  const canDelete = permissions?.units?.includes('delete');

  if (isLoading) {
      return <p>Đang tải...</p>
  }

  if (!canView) {
      return (
          <Card>
              <CardHeader>
                  <CardTitle>Truy cập bị từ chối</CardTitle>
                  <CardDescription>Bạn không có quyền xem trang này.</CardDescription>
              </CardHeader>
              <CardContent>
                  <Button asChild><Link href="/dashboard">Quay lại Bảng điều khiển</Link></Button>
              </CardContent>
          </Card>
      )
  }

  return (
    <>
      <UnitForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        unit={selectedUnit}
        allUnits={units || []}
        onSuccess={handleFormSuccess}
      />
      <ProductUnitForm
        isOpen={isProductUnitFormOpen}
        onOpenChange={setIsProductUnitFormOpen}
        config={selectedProductUnit}
        products={products}
        units={units || []}
        onSuccess={handleProductUnitFormSuccess}
      />
      <AlertDialog open={!!unitToDelete} onOpenChange={(open) => !open && setUnitToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn không?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể được hoàn tác. Thao tác này sẽ xóa vĩnh viễn đơn vị tính{' '}
              <strong>{unitToDelete?.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!productUnitToDelete} onOpenChange={(open) => !open && setProductUnitToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn không?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể được hoàn tác. Thao tác này sẽ xóa cấu hình quy đổi đơn vị của sản phẩm{' '}
              <strong>{productUnitToDelete?.productName}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProductUnit} disabled={isDeleting}>
              {isDeleting ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center gap-2 mb-4">
        <div className="grid gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Đơn vị tính</h1>
            <p className="text-sm text-muted-foreground">
                Quản lý đơn vị tính và quy đổi đơn vị cho sản phẩm.
            </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="units" className="gap-2">
              <Ruler className="h-4 w-4" />
              Đơn vị tính
            </TabsTrigger>
            <TabsTrigger value="product-units" className="gap-2">
              <Package className="h-4 w-4" />
              Quy đổi sản phẩm
            </TabsTrigger>
          </TabsList>
          {canAdd && activeTab === 'units' && (
            <Button size="sm" className="h-8 gap-1" onClick={handleAddUnit}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Thêm đơn vị
              </span>
            </Button>
          )}
          {canAdd && activeTab === 'product-units' && (
            <Button size="sm" className="h-8 gap-1" onClick={handleAddProductUnit}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Thêm quy đổi
              </span>
            </Button>
          )}
        </div>

        <TabsContent value="units">
          <Card>
            <CardHeader>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Tìm kiếm theo tên, mô tả, đơn vị cơ sở..."
                    className="w-full rounded-lg bg-background pl-8 md:w-1/3"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">STT</TableHead>
                    <SortableHeader sortKey="name">Tên</SortableHeader>
                    <SortableHeader sortKey="description">Mô tả</SortableHeader>
                    <SortableHeader sortKey="quyDoi">Quy đổi</SortableHeader>
                    <TableHead>
                      <span className="sr-only">Hành động</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow key="loading">
                      <TableCell colSpan={5} className="text-center">Đang tải...</TableCell>
                    </TableRow>
                  ) : sortedUnits && sortedUnits.length > 0 ? (
                    sortedUnits.map((unit, index) => (
                      <TableRow key={unit.id || `unit-${index}`}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell className="font-medium">
                          {unit.name}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {unit.description}
                        </TableCell>
                        <TableCell>
                          {unit.baseUnitId && unit.conversionFactor && (
                            <Badge variant="secondary">
                              1 {unit.name} = {unit.conversionFactor} {unitsMap.get(unit.baseUnitId)}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                aria-haspopup="true"
                                size="icon"
                                variant="ghost"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Chuyển đổi menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                              {canEdit && <DropdownMenuItem onClick={() => handleEditUnit(unit)}>Sửa</DropdownMenuItem>}
                              {canDelete && <DropdownMenuItem className="text-destructive" onClick={() => setUnitToDelete(unit)}>Xóa</DropdownMenuItem>}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow key="empty">
                      <TableCell colSpan={5} className="text-center h-24">
                        Không tìm thấy đơn vị tính nào. Hãy thử một từ khóa tìm kiếm khác hoặc thêm một đơn vị mới.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <div className="text-xs text-muted-foreground">
                Hiển thị <strong>{sortedUnits?.length || 0}</strong> trên <strong>{units?.length || 0}</strong> đơn vị tính
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="product-units">
          <Card>
            <CardHeader>
              <CardDescription>
                Cấu hình đơn vị quy đổi cho từng sản phẩm. Ví dụ: 1 Thùng Coca = 24 Lon.
              </CardDescription>
              <div className="relative mt-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Tìm kiếm theo tên sản phẩm..."
                    className="w-full rounded-lg bg-background pl-8 md:w-1/3"
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">STT</TableHead>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Đơn vị cơ sở</TableHead>
                    <TableHead>Đơn vị quy đổi</TableHead>
                    <TableHead>Hệ số</TableHead>
                    <TableHead className="text-right">Giá cơ sở</TableHead>
                    <TableHead className="text-right">Giá quy đổi</TableHead>
                    <TableHead>
                      <span className="sr-only">Hành động</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productUnitConfigsLoading ? (
                    <TableRow key="loading">
                      <TableCell colSpan={8} className="text-center">Đang tải...</TableCell>
                    </TableRow>
                  ) : filteredProductUnitConfigs.length > 0 ? (
                    filteredProductUnitConfigs.map((config, index) => (
                      <TableRow key={config.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell className="font-medium">{config.productName}</TableCell>
                        <TableCell>{config.baseUnitName}</TableCell>
                        <TableCell>{config.conversionUnitName}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            1 {config.conversionUnitName} = {config.conversionRate} {config.baseUnitName}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(config.baseUnitPrice)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(config.conversionUnitPrice)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                aria-haspopup="true"
                                size="icon"
                                variant="ghost"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Chuyển đổi menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                              {canEdit && <DropdownMenuItem onClick={() => handleEditProductUnit(config)}>Sửa</DropdownMenuItem>}
                              {canDelete && <DropdownMenuItem className="text-destructive" onClick={() => setProductUnitToDelete(config)}>Xóa</DropdownMenuItem>}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow key="empty">
                      <TableCell colSpan={8} className="text-center h-24">
                        Chưa có cấu hình quy đổi nào. Nhấn "Thêm quy đổi" để thêm mới.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <div className="text-xs text-muted-foreground">
                Hiển thị <strong>{filteredProductUnitConfigs.length}</strong> trên <strong>{productUnitConfigs.length}</strong> cấu hình quy đổi
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}
