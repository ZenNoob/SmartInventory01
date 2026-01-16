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

PRINT 'sp_Inventory_Add created successfully!';
GO
