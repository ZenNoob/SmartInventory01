-- =============================================
-- Stored Procedure: sp_SalesItems_Create
-- Description: Creates a sale item and deducts inventory
-- Requirements: 2.1, 2.5
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_SalesItems_Create')
    DROP PROCEDURE sp_SalesItems_Create;
GO

CREATE PROCEDURE sp_SalesItems_Create
    @id NVARCHAR(36),
    @salesTransactionId NVARCHAR(36),
    @productId NVARCHAR(36),
    @quantity DECIMAL(18,4),
    @price DECIMAL(18,2),
    @unitId NVARCHAR(36) = NULL,
    @storeId NVARCHAR(36)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @currentStock DECIMAL(18,4);
    DECLARE @productName NVARCHAR(255);
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Get product name for error messages
        SELECT @productName = name FROM Products WHERE id = @productId;
        
        -- Check available stock in ProductInventory
        IF @unitId IS NOT NULL
        BEGIN
            SELECT @currentStock = Quantity 
            FROM ProductInventory 
            WHERE ProductId = @productId AND StoreId = @storeId AND UnitId = @unitId;
        END
        ELSE
        BEGIN
            SELECT @currentStock = stock_quantity 
            FROM Products 
            WHERE id = @productId AND store_id = @storeId;
        END
        
        -- Validate stock availability
        IF @currentStock IS NULL
            SET @currentStock = 0;
            
        IF @currentStock < @quantity
        BEGIN
            DECLARE @errorMsg NVARCHAR(500);
            SET @errorMsg = 'Insufficient stock for product: ' + ISNULL(@productName, @productId) + 
                           '. Available: ' + CAST(@currentStock AS NVARCHAR(20)) + 
                           ', Requested: ' + CAST(@quantity AS NVARCHAR(20));
            RAISERROR(@errorMsg, 16, 1);
            RETURN;
        END
        
        -- Insert into SalesItems table
        INSERT INTO SalesItems (
            Id,
            SalesTransactionId,
            ProductId,
            Quantity,
            Price,
            CreatedAt
        )
        VALUES (
            @id,
            @salesTransactionId,
            @productId,
            @quantity,
            @price,
            GETDATE()
        );
        
        -- Deduct inventory from ProductInventory if unitId is provided
        IF @unitId IS NOT NULL
        BEGIN
            UPDATE ProductInventory 
            SET Quantity = Quantity - @quantity, 
                UpdatedAt = GETDATE()
            WHERE ProductId = @productId AND StoreId = @storeId AND UnitId = @unitId;
        END
        
        -- Also update stock_quantity in Products table
        UPDATE Products 
        SET stock_quantity = stock_quantity - @quantity,
            updated_at = GETDATE()
        WHERE id = @productId AND store_id = @storeId;
        
        COMMIT TRANSACTION;
        
        -- Return the created sale item with product info
        SELECT 
            si.Id AS id,
            si.SalesTransactionId AS salesTransactionId,
            si.ProductId AS productId,
            p.name AS productName,
            si.Quantity AS quantity,
            si.Price AS price,
            (si.Quantity * si.Price) AS totalPrice,
            si.CreatedAt AS createdAt
        FROM SalesItems si
        LEFT JOIN Products p ON si.ProductId = p.id
        WHERE si.Id = @id;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        THROW;
    END CATCH
END
GO
