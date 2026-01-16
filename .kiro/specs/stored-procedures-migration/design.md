# Design Document

## Overview

Thiết kế hệ thống Stored Procedures cho SmartInventory, chuyển đổi từ inline SQL queries sang stored procedures để cải thiện hiệu suất, bảo mật và khả năng bảo trì.

## Architecture

### Kiến trúc hiện tại
```
Frontend → API Routes → Inline SQL Queries → SQL Server
```

### Kiến trúc mới
```
Frontend → API Routes → Repository Layer → Stored Procedures → SQL Server
```

### Naming Convention

- **Stored Procedures**: `sp_[TableName]_[Action]`
  - Ví dụ: `sp_Products_Create`, `sp_Sales_GetById`
- **Parameters**: `@paramName` (camelCase)
- **Output Parameters**: `@out_[name]`

## Components and Interfaces

### 1. Database Layer - Stored Procedures

#### 1.1 Products Module

```sql
-- sp_Products_Create
CREATE PROCEDURE sp_Products_Create
    @id UNIQUEIDENTIFIER,
    @storeId UNIQUEIDENTIFIER,
    @categoryId UNIQUEIDENTIFIER = NULL,
    @name NVARCHAR(255),
    @description NVARCHAR(MAX) = NULL,
    @price DECIMAL(18,2),
    @costPrice DECIMAL(18,2),
    @sku NVARCHAR(100) = NULL,
    @unitId UNIQUEIDENTIFIER,
    @stockQuantity DECIMAL(18,4) = 0,
    @status NVARCHAR(20) = 'active',
    @images NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO Products (Id, store_id, category_id, name, description, price, cost_price, sku, unit_id, stock_quantity, status, images, created_at, updated_at)
    VALUES (@id, @storeId, @categoryId, @name, @description, @price, @costPrice, @sku, @unitId, @stockQuantity, @status, @images, GETDATE(), GETDATE());
    
    -- Also create ProductInventory record
    INSERT INTO ProductInventory (Id, ProductId, StoreId, UnitId, Quantity, CreatedAt, UpdatedAt)
    VALUES (NEWID(), @id, @storeId, @unitId, @stockQuantity, GETDATE(), GETDATE());
    
    SELECT @id AS Id;
END

-- sp_Products_Update
CREATE PROCEDURE sp_Products_Update
    @id UNIQUEIDENTIFIER,
    @storeId UNIQUEIDENTIFIER,
    @categoryId UNIQUEIDENTIFIER = NULL,
    @name NVARCHAR(255) = NULL,
    @description NVARCHAR(MAX) = NULL,
    @price DECIMAL(18,2) = NULL,
    @costPrice DECIMAL(18,2) = NULL,
    @sku NVARCHAR(100) = NULL,
    @unitId UNIQUEIDENTIFIER = NULL,
    @status NVARCHAR(20) = NULL,
    @images NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Products SET
        category_id = COALESCE(@categoryId, category_id),
        name = COALESCE(@name, name),
        description = COALESCE(@description, description),
        price = COALESCE(@price, price),
        cost_price = COALESCE(@costPrice, cost_price),
        sku = COALESCE(@sku, sku),
        unit_id = COALESCE(@unitId, unit_id),
        status = COALESCE(@status, status),
        images = COALESCE(@images, images),
        updated_at = GETDATE()
    WHERE Id = @id AND store_id = @storeId;
    
    SELECT @@ROWCOUNT AS AffectedRows;
END

-- sp_Products_Delete
CREATE PROCEDURE sp_Products_Delete
    @id UNIQUEIDENTIFIER,
    @storeId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Soft delete by setting status to 'deleted'
    UPDATE Products SET status = 'deleted', updated_at = GETDATE()
    WHERE Id = @id AND store_id = @storeId;
    
    SELECT @@ROWCOUNT AS AffectedRows;
END

-- sp_Products_GetByStore
CREATE PROCEDURE sp_Products_GetByStore
    @storeId UNIQUEIDENTIFIER,
    @status NVARCHAR(20) = NULL,
    @categoryId UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        p.*,
        c.name AS category_name,
        pi.Quantity AS current_stock
    FROM Products p
    LEFT JOIN Categories c ON p.category_id = c.id
    LEFT JOIN ProductInventory pi ON p.Id = pi.ProductId AND p.unit_id = pi.UnitId
    WHERE p.store_id = @storeId
        AND (@status IS NULL OR p.status = @status)
        AND (@categoryId IS NULL OR p.category_id = @categoryId)
    ORDER BY p.name;
END

-- sp_Products_GetById
CREATE PROCEDURE sp_Products_GetById
    @id UNIQUEIDENTIFIER,
    @storeId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        p.*,
        c.name AS category_name,
        pi.Quantity AS current_stock
    FROM Products p
    LEFT JOIN Categories c ON p.category_id = c.id
    LEFT JOIN ProductInventory pi ON p.Id = pi.ProductId AND p.unit_id = pi.UnitId
    WHERE p.Id = @id AND p.store_id = @storeId;
END
```

#### 1.2 Sales Module

```sql
-- sp_Sales_Create
CREATE PROCEDURE sp_Sales_Create
    @id UNIQUEIDENTIFIER,
    @storeId UNIQUEIDENTIFIER,
    @invoiceNumber NVARCHAR(50),
    @customerId UNIQUEIDENTIFIER = NULL,
    @shiftId UNIQUEIDENTIFIER = NULL,
    @totalAmount DECIMAL(18,2),
    @vatAmount DECIMAL(18,2) = 0,
    @finalAmount DECIMAL(18,2),
    @discount DECIMAL(18,2) = 0,
    @discountType NVARCHAR(20) = NULL,
    @discountValue DECIMAL(18,2) = NULL,
    @tierDiscountPercentage DECIMAL(5,2) = NULL,
    @tierDiscountAmount DECIMAL(18,2) = NULL,
    @pointsUsed INT = 0,
    @pointsDiscount DECIMAL(18,2) = 0,
    @customerPayment DECIMAL(18,2) = 0,
    @previousDebt DECIMAL(18,2) = 0,
    @remainingDebt DECIMAL(18,2) = 0,
    @status NVARCHAR(20) = 'pending'
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        
        INSERT INTO Sales (
            Id, store_id, invoice_number, customer_id, shift_id, transaction_date,
            status, total_amount, vat_amount, final_amount, discount, discount_type,
            discount_value, tier_discount_percentage, tier_discount_amount,
            points_used, points_discount, customer_payment, previous_debt,
            remaining_debt, created_at, updated_at
        )
        VALUES (
            @id, @storeId, @invoiceNumber, @customerId, @shiftId, GETDATE(),
            @status, @totalAmount, @vatAmount, @finalAmount, @discount, @discountType,
            @discountValue, @tierDiscountPercentage, @tierDiscountAmount,
            @pointsUsed, @pointsDiscount, @customerPayment, @previousDebt,
            @remainingDebt, GETDATE(), GETDATE()
        );
        
        COMMIT TRANSACTION;
        SELECT @id AS Id, @invoiceNumber AS InvoiceNumber;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END

-- sp_SalesItems_Create
CREATE PROCEDURE sp_SalesItems_Create
    @id UNIQUEIDENTIFIER,
    @salesTransactionId UNIQUEIDENTIFIER,
    @productId UNIQUEIDENTIFIER,
    @quantity DECIMAL(18,4),
    @price DECIMAL(18,2),
    @unitId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO SalesItems (Id, sales_transaction_id, product_id, quantity, price, unit_id, created_at)
    VALUES (@id, @salesTransactionId, @productId, @quantity, @price, @unitId, GETDATE());
    
    -- Deduct inventory
    UPDATE ProductInventory 
    SET Quantity = Quantity - @quantity, UpdatedAt = GETDATE()
    WHERE ProductId = @productId AND UnitId = @unitId;
    
    SELECT @id AS Id;
END

-- sp_Sales_GetById
CREATE PROCEDURE sp_Sales_GetById
    @id UNIQUEIDENTIFIER,
    @storeId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get sale
    SELECT s.*, c.full_name AS customer_name
    FROM Sales s
    LEFT JOIN Customers c ON s.customer_id = c.id
    WHERE s.Id = @id AND s.store_id = @storeId;
    
    -- Get items
    SELECT si.*, p.name AS product_name, u.name AS unit_name
    FROM SalesItems si
    LEFT JOIN Products p ON si.product_id = p.id
    LEFT JOIN Units u ON si.unit_id = u.id
    WHERE si.sales_transaction_id = @id;
END

-- sp_Sales_GetByStore
CREATE PROCEDURE sp_Sales_GetByStore
    @storeId UNIQUEIDENTIFIER,
    @startDate DATETIME = NULL,
    @endDate DATETIME = NULL,
    @customerId UNIQUEIDENTIFIER = NULL,
    @status NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT s.*, c.full_name AS customer_name
    FROM Sales s
    LEFT JOIN Customers c ON s.customer_id = c.id
    WHERE s.store_id = @storeId
        AND (@startDate IS NULL OR s.transaction_date >= @startDate)
        AND (@endDate IS NULL OR s.transaction_date <= @endDate)
        AND (@customerId IS NULL OR s.customer_id = @customerId)
        AND (@status IS NULL OR s.status = @status)
    ORDER BY s.transaction_date DESC;
END

-- sp_Sales_UpdateStatus
CREATE PROCEDURE sp_Sales_UpdateStatus
    @id UNIQUEIDENTIFIER,
    @storeId UNIQUEIDENTIFIER,
    @status NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Sales SET status = @status, updated_at = GETDATE()
    WHERE Id = @id AND store_id = @storeId;
    
    SELECT @@ROWCOUNT AS AffectedRows;
END
```

#### 1.3 Inventory Module

```sql
-- sp_Inventory_GetAvailable
CREATE PROCEDURE sp_Inventory_GetAvailable
    @productId UNIQUEIDENTIFIER,
    @storeId UNIQUEIDENTIFIER,
    @unitId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT ISNULL(Quantity, 0) AS AvailableQuantity
    FROM ProductInventory
    WHERE ProductId = @productId AND StoreId = @storeId AND UnitId = @unitId;
END

-- sp_Inventory_Add
CREATE PROCEDURE sp_Inventory_Add
    @productId UNIQUEIDENTIFIER,
    @storeId UNIQUEIDENTIFIER,
    @unitId UNIQUEIDENTIFIER,
    @quantity DECIMAL(18,4)
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM ProductInventory WHERE ProductId = @productId AND StoreId = @storeId AND UnitId = @unitId)
    BEGIN
        UPDATE ProductInventory 
        SET Quantity = Quantity + @quantity, UpdatedAt = GETDATE()
        WHERE ProductId = @productId AND StoreId = @storeId AND UnitId = @unitId;
    END
    ELSE
    BEGIN
        INSERT INTO ProductInventory (Id, ProductId, StoreId, UnitId, Quantity, CreatedAt, UpdatedAt)
        VALUES (NEWID(), @productId, @storeId, @unitId, @quantity, GETDATE(), GETDATE());
    END
    
    SELECT Quantity FROM ProductInventory 
    WHERE ProductId = @productId AND StoreId = @storeId AND UnitId = @unitId;
END

-- sp_Inventory_Deduct
CREATE PROCEDURE sp_Inventory_Deduct
    @productId UNIQUEIDENTIFIER,
    @storeId UNIQUEIDENTIFIER,
    @unitId UNIQUEIDENTIFIER,
    @quantity DECIMAL(18,4)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @currentQty DECIMAL(18,4);
    
    SELECT @currentQty = Quantity FROM ProductInventory 
    WHERE ProductId = @productId AND StoreId = @storeId AND UnitId = @unitId;
    
    IF @currentQty IS NULL OR @currentQty < @quantity
    BEGIN
        RAISERROR('Insufficient stock', 16, 1);
        RETURN;
    END
    
    UPDATE ProductInventory 
    SET Quantity = Quantity - @quantity, UpdatedAt = GETDATE()
    WHERE ProductId = @productId AND StoreId = @storeId AND UnitId = @unitId;
    
    SELECT Quantity FROM ProductInventory 
    WHERE ProductId = @productId AND StoreId = @storeId AND UnitId = @unitId;
END

-- sp_Inventory_Sync
CREATE PROCEDURE sp_Inventory_Sync
    @storeId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Sync from Products.stock_quantity to ProductInventory
    MERGE ProductInventory AS target
    USING (
        SELECT Id, store_id, unit_id, stock_quantity 
        FROM Products 
        WHERE store_id = @storeId
    ) AS source
    ON target.ProductId = source.Id AND target.StoreId = source.store_id AND target.UnitId = source.unit_id
    WHEN MATCHED THEN
        UPDATE SET Quantity = source.stock_quantity, UpdatedAt = GETDATE()
    WHEN NOT MATCHED THEN
        INSERT (Id, ProductId, StoreId, UnitId, Quantity, CreatedAt, UpdatedAt)
        VALUES (NEWID(), source.Id, source.store_id, source.unit_id, source.stock_quantity, GETDATE(), GETDATE());
    
    SELECT @@ROWCOUNT AS SyncedCount;
END
```

#### 1.4 Customers Module

```sql
-- sp_Customers_Create
CREATE PROCEDURE sp_Customers_Create
    @id UNIQUEIDENTIFIER,
    @storeId UNIQUEIDENTIFIER,
    @name NVARCHAR(255),
    @phone NVARCHAR(20) = NULL,
    @email NVARCHAR(255) = NULL,
    @address NVARCHAR(500) = NULL,
    @customerType NVARCHAR(20) = 'retail',
    @loyaltyTier NVARCHAR(20) = 'bronze'
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO Customers (Id, store_id, name, full_name, phone, email, address, customer_type, loyalty_tier, total_spent, total_paid, total_debt, created_at, updated_at)
    VALUES (@id, @storeId, @name, @name, @phone, @email, @address, @customerType, @loyaltyTier, 0, 0, 0, GETDATE(), GETDATE());
    
    SELECT @id AS Id;
END

-- sp_Customers_Update
CREATE PROCEDURE sp_Customers_Update
    @id UNIQUEIDENTIFIER,
    @storeId UNIQUEIDENTIFIER,
    @name NVARCHAR(255) = NULL,
    @phone NVARCHAR(20) = NULL,
    @email NVARCHAR(255) = NULL,
    @address NVARCHAR(500) = NULL,
    @customerType NVARCHAR(20) = NULL,
    @loyaltyTier NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Customers SET
        name = COALESCE(@name, name),
        full_name = COALESCE(@name, full_name),
        phone = COALESCE(@phone, phone),
        email = COALESCE(@email, email),
        address = COALESCE(@address, address),
        customer_type = COALESCE(@customerType, customer_type),
        loyalty_tier = COALESCE(@loyaltyTier, loyalty_tier),
        updated_at = GETDATE()
    WHERE Id = @id AND store_id = @storeId;
    
    SELECT @@ROWCOUNT AS AffectedRows;
END

-- sp_Customers_Delete
CREATE PROCEDURE sp_Customers_Delete
    @id UNIQUEIDENTIFIER,
    @storeId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM Customers WHERE Id = @id AND store_id = @storeId;
    
    SELECT @@ROWCOUNT AS AffectedRows;
END

-- sp_Customers_GetByStore
CREATE PROCEDURE sp_Customers_GetByStore
    @storeId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT * FROM Customers 
    WHERE store_id = @storeId
    ORDER BY name;
END

-- sp_Customers_UpdateDebt
CREATE PROCEDURE sp_Customers_UpdateDebt
    @id UNIQUEIDENTIFIER,
    @storeId UNIQUEIDENTIFIER,
    @spentAmount DECIMAL(18,2) = 0,
    @paidAmount DECIMAL(18,2) = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Customers SET
        total_spent = total_spent + @spentAmount,
        total_paid = total_paid + @paidAmount,
        total_debt = total_spent + @spentAmount - total_paid - @paidAmount,
        updated_at = GETDATE()
    WHERE Id = @id AND store_id = @storeId;
    
    SELECT total_debt FROM Customers WHERE Id = @id;
END
```

#### 1.5 Settings Module

```sql
-- sp_Settings_GetByStore
CREATE PROCEDURE sp_Settings_GetByStore
    @storeId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT settings FROM Settings WHERE store_id = @storeId;
END

-- sp_Settings_Upsert
CREATE PROCEDURE sp_Settings_Upsert
    @storeId UNIQUEIDENTIFIER,
    @settings NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM Settings WHERE store_id = @storeId)
    BEGIN
        UPDATE Settings SET settings = @settings, updated_at = GETDATE()
        WHERE store_id = @storeId;
    END
    ELSE
    BEGIN
        INSERT INTO Settings (Id, store_id, settings, created_at, updated_at)
        VALUES (NEWID(), @storeId, @settings, GETDATE(), GETDATE());
    END
    
    SELECT 1 AS Success;
END
```

### 2. Backend Layer - Repository Pattern

#### 2.1 Base Repository với SP Support

```typescript
// backend/src/repositories/sp-base-repository.ts
import { query, queryOne } from '../db';

export abstract class SPBaseRepository<T> {
  protected abstract tableName: string;
  
  protected async executeSP<R>(
    spName: string, 
    params: Record<string, unknown>
  ): Promise<R[]> {
    const paramList = Object.entries(params)
      .map(([key, _]) => `@${key}`)
      .join(', ');
    
    return query<R>(`EXEC ${spName} ${paramList}`, params);
  }
  
  protected async executeSPSingle<R>(
    spName: string, 
    params: Record<string, unknown>
  ): Promise<R | null> {
    const results = await this.executeSP<R>(spName, params);
    return results[0] || null;
  }
}
```

#### 2.2 Products Repository

```typescript
// backend/src/repositories/products-sp-repository.ts
import { SPBaseRepository } from './sp-base-repository';
import { Product } from './products-repository';

export class ProductsSPRepository extends SPBaseRepository<Product> {
  protected tableName = 'Products';
  
  async create(product: Omit<Product, 'createdAt' | 'updatedAt'>): Promise<Product> {
    const result = await this.executeSPSingle<{ Id: string }>('sp_Products_Create', {
      id: product.id,
      storeId: product.storeId,
      categoryId: product.categoryId,
      name: product.name,
      description: product.description,
      price: product.price,
      costPrice: product.costPrice,
      sku: product.sku,
      unitId: product.unitId,
      stockQuantity: product.stockQuantity,
      status: product.status,
      images: product.images,
    });
    
    return this.getById(result!.Id, product.storeId);
  }
  
  async update(id: string, storeId: string, data: Partial<Product>): Promise<Product> {
    await this.executeSP('sp_Products_Update', {
      id,
      storeId,
      ...data,
    });
    
    return this.getById(id, storeId);
  }
  
  async delete(id: string, storeId: string): Promise<boolean> {
    const result = await this.executeSPSingle<{ AffectedRows: number }>('sp_Products_Delete', {
      id,
      storeId,
    });
    
    return result?.AffectedRows > 0;
  }
  
  async getByStore(storeId: string, status?: string, categoryId?: string): Promise<Product[]> {
    return this.executeSP('sp_Products_GetByStore', {
      storeId,
      status,
      categoryId,
    });
  }
  
  async getById(id: string, storeId: string): Promise<Product> {
    return this.executeSPSingle('sp_Products_GetById', { id, storeId });
  }
}
```

## Data Models

Không thay đổi - sử dụng các models hiện có.

## Error Handling

### SQL Server Errors
- Stored procedures sử dụng `TRY...CATCH` blocks
- Errors được throw với `RAISERROR` hoặc `THROW`
- Backend catch errors và trả về HTTP status codes phù hợp

### Error Codes
- `50001`: Insufficient stock
- `50002`: Record not found
- `50003`: Duplicate entry
- `50004`: Invalid parameter

## Testing Strategy

### Unit Tests
- Test từng stored procedure với các input khác nhau
- Test error handling
- Test transaction rollback

### Integration Tests
- Test flow hoàn chỉnh từ API đến database
- Test concurrent access
- Test performance

## Migration Strategy

1. **Phase 1**: Tạo tất cả stored procedures
2. **Phase 2**: Tạo repository layer mới
3. **Phase 3**: Chuyển đổi từng route sang SP
4. **Phase 4**: Test và verify
5. **Phase 5**: Xóa inline queries cũ
