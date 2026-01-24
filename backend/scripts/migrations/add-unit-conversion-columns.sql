-- Migration: Add Unit Conversion Model Columns
-- Date: 2026-01-23
-- Description: Add columns to support unit conversion (nhập theo Thùng, lưu theo Chai)

USE Data_QuanLyBanHang_Online;
GO

PRINT '🔄 Starting Unit Conversion Migration...';
GO

-- ============================================
-- 1. Add is_base_unit to Units table
-- ============================================
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Units' AND COLUMN_NAME = 'is_base_unit'
)
BEGIN
    PRINT '  ➕ Adding is_base_unit to Units table...';
    
    ALTER TABLE Units
    ADD is_base_unit BIT DEFAULT 0;
    
    -- Set is_base_unit = 1 for units where base_unit_id IS NULL
    UPDATE Units
    SET is_base_unit = 1
    WHERE base_unit_id IS NULL;
    
    PRINT '  ✅ Added is_base_unit column';
END
ELSE
BEGIN
    PRINT '  ⏭️  is_base_unit already exists in Units';
END
GO

-- ============================================
-- 2. Add default_purchase_unit_id to Products
-- ============================================
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Products' AND COLUMN_NAME = 'default_purchase_unit_id'
)
BEGIN
    PRINT '  ➕ Adding default_purchase_unit_id to Products table...';
    
    ALTER TABLE Products
    ADD default_purchase_unit_id VARCHAR(36) NULL;
    
    -- Set default to unit_id (same as base unit)
    UPDATE Products
    SET default_purchase_unit_id = unit_id
    WHERE unit_id IS NOT NULL;
    
    -- Add foreign key constraint
    ALTER TABLE Products
    ADD CONSTRAINT FK_Products_DefaultPurchaseUnit
    FOREIGN KEY (default_purchase_unit_id) REFERENCES Units(id);
    
    PRINT '  ✅ Added default_purchase_unit_id column';
END
ELSE
BEGIN
    PRINT '  ⏭️  default_purchase_unit_id already exists in Products';
END
GO

-- ============================================
-- 3. Add default_sales_unit_id to Products
-- ============================================
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Products' AND COLUMN_NAME = 'default_sales_unit_id'
)
BEGIN
    PRINT '  ➕ Adding default_sales_unit_id to Products table...';
    
    ALTER TABLE Products
    ADD default_sales_unit_id VARCHAR(36) NULL;
    
    -- Set default to unit_id (same as base unit)
    UPDATE Products
    SET default_sales_unit_id = unit_id
    WHERE unit_id IS NOT NULL;
    
    -- Add foreign key constraint
    ALTER TABLE Products
    ADD CONSTRAINT FK_Products_DefaultSalesUnit
    FOREIGN KEY (default_sales_unit_id) REFERENCES Units(id);
    
    PRINT '  ✅ Added default_sales_unit_id column';
END
ELSE
BEGIN
    PRINT '  ⏭️  default_sales_unit_id already exists in Products';
END
GO

-- ============================================
-- 4. Add base_unit_price to PurchaseOrderItems
-- ============================================
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'PurchaseOrderItems' AND COLUMN_NAME = 'base_unit_price'
)
BEGIN
    PRINT '  ➕ Adding base_unit_price to PurchaseOrderItems table...';
    
    ALTER TABLE PurchaseOrderItems
    ADD base_unit_price DECIMAL(18, 2) NULL;
    
    -- Calculate base_unit_price from existing data
    -- base_unit_price = cost / conversion_factor
    UPDATE poi
    SET poi.base_unit_price = 
        CASE 
            WHEN u.conversion_factor IS NOT NULL AND u.conversion_factor > 0 
            THEN poi.cost / u.conversion_factor
            ELSE poi.cost
        END
    FROM PurchaseOrderItems poi
    LEFT JOIN Units u ON poi.unit_id = u.id
    WHERE poi.cost IS NOT NULL;
    
    PRINT '  ✅ Added base_unit_price column';
END
ELSE
BEGIN
    PRINT '  ⏭️  base_unit_price already exists in PurchaseOrderItems';
END
GO

-- ============================================
-- 5. Verify and update existing data
-- ============================================
PRINT '';
PRINT '🔍 Verifying data...';

-- Check Units with conversion factors
DECLARE @UnitsCount INT;
SELECT @UnitsCount = COUNT(*) FROM Units WHERE conversion_factor IS NOT NULL AND conversion_factor > 0;
PRINT '  📊 Units with conversion factors: ' + CAST(@UnitsCount AS VARCHAR);

-- Check Products with unit_id
DECLARE @ProductsCount INT;
SELECT @ProductsCount = COUNT(*) FROM Products WHERE unit_id IS NOT NULL;
PRINT '  📊 Products with unit_id: ' + CAST(@ProductsCount AS VARCHAR);

-- Check PurchaseOrderItems with unit conversion
DECLARE @POICount INT;
SELECT @POICount = COUNT(*) FROM PurchaseOrderItems WHERE base_quantity IS NOT NULL;
PRINT '  📊 PurchaseOrderItems with base_quantity: ' + CAST(@POICount AS VARCHAR);

PRINT '';
PRINT '✅ Unit Conversion Migration completed successfully!';
PRINT '';
PRINT '📝 Next steps:';
PRINT '  1. Configure unit conversion factors in Units table';
PRINT '  2. Set default purchase/sales units for products';
PRINT '  3. Test purchase order with unit conversion';
GO
