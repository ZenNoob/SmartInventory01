                                                                            -- =============================================
-- Migration: Add max_stores to Tenants table
-- Description: Add store limit based on subscription plan
-- Date: 2026-01-19
-- =============================================

USE SmartInventory_Master;
GO

-- Add max_stores column if it doesn't exist
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('Tenants') 
    AND name = 'max_stores'
)
BEGIN
    ALTER TABLE Tenants
    ADD max_stores INT NOT NULL DEFAULT 1;
    
    PRINT 'Added max_stores column to Tenants table';
END
ELSE
BEGIN
    PRINT 'max_stores column already exists';
END
GO

-- Update existing tenants based on subscription plan
UPDATE Tenants
SET max_stores = CASE subscription_plan
    WHEN 'basic' THEN 1
    WHEN 'standard' THEN 3
    WHEN 'advanced' THEN 10
    WHEN 'enterprise' THEN 999
    ELSE 1
END
WHERE max_stores = 1; -- Only update if still default value
GO

PRINT 'Migration completed: max_stores added to Tenants';
GO
