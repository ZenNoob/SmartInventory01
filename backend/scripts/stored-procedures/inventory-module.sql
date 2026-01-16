-- =============================================
-- Inventory Module - All Stored Procedures
-- Description: Combined file for all Inventory-related stored procedures
-- Requirements: 4.1, 4.2, 4.3, 4.4
-- =============================================

-- =============================================
-- sp_Inventory_GetAvailable
-- Description: Gets available inventory quantity for a product
-- Requirements: 4.1
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Inventory_GetAvailable')
    DROP PROCEDURE sp_Inventory_GetAvailable;
GO

CREATE PROCEDURE sp_Inventory_GetAvailable
    @productId NVARCHAR(36),
    @storeId NVARCHAR(36),
    @unitId NVARCHAR(36)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        pi.Id AS id,
        pi.ProductId AS productId,
        pi.StoreId AS storeId,
        pi.UnitId AS unitId,
        ISNULL(pi.Quantity, 0) AS availableQuantity,
        p.name AS productName,
        u.name AS unitName,
        pi.CreatedAt AS createdAt,
        pi.UpdatedAt AS updatedAt
    FROM ProductInventory pi
    INNER JOIN Products p ON pi.ProductId = p.id
    LEFT JOIN Units u ON pi.UnitId = u.id
    WHERE pi.ProductId = @productId 
        AND pi.StoreId = @storeId 
        AND pi.UnitId = @unitId;
    
    -- If no record found, return 0 quantity
    IF @@ROWCOUNT = 0
    BEGIN
        SELECT 
            NULL AS id,
            @productId AS productId,
            @storeId AS storeId,
            @unitId AS unitId,
            0 AS availableQuantity,
            p.name AS productName,
            u.name AS unitName,
            NULL AS createdAt,
            NULL AS updatedAt
        FROM Products p
        LEFT JOIN Units u ON u.id = @unitId
        WHERE p.id = @productId;
    END
END
GO

-- =============================================
-- sp_Inventory_Add
-- Description: Adds inventory quantity with UPSERT logic (insert or update)
-- Requirements: 4.2
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Inventory_Add')
    DROP PROCEDURE sp_Inventory_Add;
GO

CREATE PROCEDURE sp_Inventory_Add
    @productId NVARCHAR(36),
    @storeId NVARCHAR(36),
    @unitId NVARCHAR(36),
    @quantity DECIMAL(18,4)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Check if inventory record exists
        IF EXISTS (
            SELECT 1 FROM ProductInventory 
            WHERE ProductId = @productId 
                AND StoreId = @storeId 
                AND UnitId = @unitId
        )
        BEGIN
            -- Update existing record - add to current quantity
            UPDATE ProductInventory 
            SET 
                Quantity = Quantity + @quantity, 
                UpdatedAt = GETDATE()
            WHERE ProductId = @productId 
                AND StoreId = @storeId 
                AND UnitId = @unitId;
        END
        ELSE
        BEGIN
            -- Insert new record
            INSERT INTO ProductInventory (
                Id, 
                ProductId, 
                StoreId, 
                UnitId, 
                Quantity, 
                CreatedAt, 
                UpdatedAt
            )
            VALUES (
                NEWID(), 
                @productId, 
                @storeId, 
                @unitId, 
                @quantity, 
                GETDATE(), 
                GETDATE()
            );
        END
        
        -- Also update the stock_quantity in Products table
        UPDATE Products 
        SET 
            stock_quantity = stock_quantity + @quantity,
            updated_at = GETDATE()
        WHERE id = @productId AND store_id = @storeId;
        
        COMMIT TRANSACTION;
        
        -- Return the updated inventory record
        SELECT 
            pi.Id AS id,
            pi.ProductId AS productId,
            pi.StoreId AS storeId,
            pi.UnitId AS unitId,
            pi.Quantity AS quantity,
            p.name AS productName,
            u.name AS unitName,
            pi.CreatedAt AS createdAt,
            pi.UpdatedAt AS updatedAt
        FROM ProductInventory pi
        INNER JOIN Products p ON pi.ProductId = p.id
        LEFT JOIN Units u ON pi.UnitId = u.id
        WHERE pi.ProductId = @productId 
            AND pi.StoreId = @storeId 
            AND pi.UnitId = @unitId;
            
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        THROW;
    END CATCH
END
GO

-- =============================================
-- sp_Inventory_Deduct
-- Description: Deducts inventory quantity with stock validation
-- Requirements: 4.3
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Inventory_Deduct')
    DROP PROCEDURE sp_Inventory_Deduct;
GO

CREATE PROCEDURE sp_Inventory_Deduct
    @productId NVARCHAR(36),
    @storeId NVARCHAR(36),
    @unitId NVARCHAR(36),
    @quantity DECIMAL(18,4)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @currentQty DECIMAL(18,4);
    DECLARE @productName NVARCHAR(255);
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Get current quantity and product name
        SELECT 
            @currentQty = pi.Quantity,
            @productName = p.name
        FROM ProductInventory pi
        INNER JOIN Products p ON pi.ProductId = p.id
        WHERE pi.ProductId = @productId 
            AND pi.StoreId = @storeId 
            AND pi.UnitId = @unitId;
        
        -- Validate stock availability
        IF @currentQty IS NULL
        BEGIN
            RAISERROR('Inventory record not found for this product/unit combination', 16, 1);
            RETURN;
        END
        
        IF @currentQty < @quantity
        BEGIN
            DECLARE @errorMsg NVARCHAR(500);
            SET @errorMsg = 'Insufficient stock for product "' + ISNULL(@productName, 'Unknown') + 
                           '". Available: ' + CAST(@currentQty AS NVARCHAR(20)) + 
                           ', Requested: ' + CAST(@quantity AS NVARCHAR(20));
            RAISERROR(@errorMsg, 16, 1);
            RETURN;
        END
        
        -- Deduct from ProductInventory
        UPDATE ProductInventory 
        SET 
            Quantity = Quantity - @quantity, 
            UpdatedAt = GETDATE()
        WHERE ProductId = @productId 
            AND StoreId = @storeId 
            AND UnitId = @unitId;
        
        -- Also update the stock_quantity in Products table
        UPDATE Products 
        SET 
            stock_quantity = stock_quantity - @quantity,
            updated_at = GETDATE()
        WHERE id = @productId AND store_id = @storeId;
        
        COMMIT TRANSACTION;
        
        -- Return the updated inventory record
        SELECT 
            pi.Id AS id,
            pi.ProductId AS productId,
            pi.StoreId AS storeId,
            pi.UnitId AS unitId,
            pi.Quantity AS quantity,
            p.name AS productName,
            u.name AS unitName,
            pi.CreatedAt AS createdAt,
            pi.UpdatedAt AS updatedAt
        FROM ProductInventory pi
        INNER JOIN Products p ON pi.ProductId = p.id
        LEFT JOIN Units u ON pi.UnitId = u.id
        WHERE pi.ProductId = @productId 
            AND pi.StoreId = @storeId 
            AND pi.UnitId = @unitId;
            
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        THROW;
    END CATCH
END
GO

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

PRINT 'Inventory module stored procedures created successfully!';
GO

