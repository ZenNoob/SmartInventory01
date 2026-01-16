-- =============================================
-- sp_Inventory_Sync
-- Description: Syncs inventory from Products.stock_quantity to ProductInventory using MERGE
-- Requirements: 4.4
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Inventory_Sync')
    DROP PROCEDURE sp_Inventory_Sync;
GO

CREATE PROCEDURE sp_Inventory_Sync
    @storeId NVARCHAR(36)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @syncedCount INT = 0;
    DECLARE @insertedCount INT = 0;
    DECLARE @updatedCount INT = 0;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Use MERGE to sync Products.stock_quantity to ProductInventory
        -- This handles both insert (new products) and update (existing products)
        MERGE ProductInventory AS target
        USING (
            SELECT 
                p.id AS ProductId,
                p.store_id AS StoreId,
                COALESCE(p.unit_id, (SELECT TOP 1 id FROM Units WHERE store_id = p.store_id)) AS UnitId,
                p.stock_quantity AS Quantity
            FROM Products p
            WHERE p.store_id = @storeId
                AND p.status != 'deleted'
        ) AS source
        ON (
            target.ProductId = source.ProductId 
            AND target.StoreId = source.StoreId 
            AND target.UnitId = source.UnitId
        )
        WHEN MATCHED AND target.Quantity != source.Quantity THEN
            UPDATE SET 
                Quantity = source.Quantity, 
                UpdatedAt = GETDATE()
        WHEN NOT MATCHED BY TARGET AND source.UnitId IS NOT NULL THEN
            INSERT (Id, ProductId, StoreId, UnitId, Quantity, CreatedAt, UpdatedAt)
            VALUES (NEWID(), source.ProductId, source.StoreId, source.UnitId, source.Quantity, GETDATE(), GETDATE());
        
        SET @syncedCount = @@ROWCOUNT;
        
        COMMIT TRANSACTION;
        
        -- Return sync summary
        SELECT 
            @syncedCount AS syncedCount,
            @storeId AS storeId,
            GETDATE() AS syncedAt,
            (SELECT COUNT(*) FROM ProductInventory WHERE StoreId = @storeId) AS totalInventoryRecords,
            (SELECT COUNT(*) FROM Products WHERE store_id = @storeId AND status != 'deleted') AS totalProducts;
            
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        THROW;
    END CATCH
END
GO

PRINT 'sp_Inventory_Sync created successfully!';
GO
