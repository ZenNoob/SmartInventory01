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

PRINT 'sp_Inventory_Deduct created successfully!';
GO
