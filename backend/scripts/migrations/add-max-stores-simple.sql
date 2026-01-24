-- =============================================
-- Migration: Add max_stores to Stores table (Simple version)
-- Description: Add store limit for single database setup
-- Date: 2026-01-19
-- =============================================

-- Check if StoreOwners table exists
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'StoreOwners')
BEGIN
    -- Add max_stores column to StoreOwners if it doesn't exist
    IF NOT EXISTS (
        SELECT * FROM sys.columns 
        WHERE object_id = OBJECT_ID('StoreOwners') 
        AND name = 'max_stores'
    )
    BEGIN
        ALTER TABLE StoreOwners
        ADD max_stores INT NOT NULL DEFAULT 3;
        
        PRINT 'Added max_stores column to StoreOwners table';
    END
    ELSE
    BEGIN
        PRINT 'max_stores column already exists in StoreOwners';
    END
END
ELSE
BEGIN
    PRINT 'StoreOwners table does not exist - skipping migration';
END
GO

PRINT 'Migration completed: max_stores configuration';
GO
