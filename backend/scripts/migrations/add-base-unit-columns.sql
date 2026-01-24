-- =============================================
-- Migration: Add base unit columns to PurchaseOrderItems
-- Description: Store both original unit and base unit for proper inventory tracking
-- Date: 2026-01-23
-- =============================================

-- Check if PurchaseOrderItems table exists
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'PurchaseOrderItems')
BEGIN
    -- Add base_quantity column if it doesn't exist
    IF NOT EXISTS (
        SELECT * FROM sys.columns 
        WHERE object_id = OBJECT_ID('PurchaseOrderItems') 
        AND name = 'base_quantity'
    )
    BEGIN
        ALTER TABLE PurchaseOrderItems
        ADD base_quantity DECIMAL(18, 4) NULL;
        
        PRINT 'Added base_quantity column to PurchaseOrderItems table';
    END
    ELSE
    BEGIN
        PRINT 'base_quantity column already exists in PurchaseOrderItems';
    END

    -- Add base_cost column if it doesn't exist
    IF NOT EXISTS (
        SELECT * FROM sys.columns 
        WHERE object_id = OBJECT_ID('PurchaseOrderItems') 
        AND name = 'base_cost'
    )
    BEGIN
        ALTER TABLE PurchaseOrderItems
        ADD base_cost DECIMAL(18, 4) NULL;
        
        PRINT 'Added base_cost column to PurchaseOrderItems table';
    END
    ELSE
    BEGIN
        PRINT 'base_cost column already exists in PurchaseOrderItems';
    END

    -- Add base_unit_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT * FROM sys.columns 
        WHERE object_id = OBJECT_ID('PurchaseOrderItems') 
        AND name = 'base_unit_id'
    )
    BEGIN
        ALTER TABLE PurchaseOrderItems
        ADD base_unit_id UNIQUEIDENTIFIER NULL;
        
        PRINT 'Added base_unit_id column to PurchaseOrderItems table';
        
        -- Add foreign key constraint
        IF NOT EXISTS (
            SELECT * FROM sys.foreign_keys 
            WHERE name = 'FK_PurchaseOrderItems_BaseUnit'
        )
        BEGIN
            ALTER TABLE PurchaseOrderItems
            ADD CONSTRAINT FK_PurchaseOrderItems_BaseUnit
            FOREIGN KEY (base_unit_id) REFERENCES Units(id);
            
            PRINT 'Added foreign key constraint FK_PurchaseOrderItems_BaseUnit';
        END
    END
    ELSE
    BEGIN
        PRINT 'base_unit_id column already exists in PurchaseOrderItems';
    END
END
ELSE
BEGIN
    PRINT 'PurchaseOrderItems table does not exist - skipping migration';
END
GO

-- Update existing records to populate base values
-- This assumes that existing records were entered in base units
UPDATE PurchaseOrderItems
SET 
    base_quantity = quantity,
    base_cost = cost,
    base_unit_id = unit_id
WHERE base_quantity IS NULL;

PRINT 'Updated existing records with base values';
GO

PRINT 'Migration completed: base unit columns added to PurchaseOrderItems';
GO
