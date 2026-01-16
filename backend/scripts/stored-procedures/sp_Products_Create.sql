-- =============================================
-- Stored Procedure: sp_Products_Create
-- Description: Creates a new product and its corresponding ProductInventory record
-- Requirements: 1.1
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Products_Create')
    DROP PROCEDURE sp_Products_Create;
GO

CREATE PROCEDURE sp_Products_Create
    @id NVARCHAR(36),
    @storeId NVARCHAR(36),
    @categoryId NVARCHAR(36) = NULL,
    @name NVARCHAR(255),
    @description NVARCHAR(MAX) = NULL,
    @price DECIMAL(18,2),
    @costPrice DECIMAL(18,2),
    @sku NVARCHAR(100) = NULL,
    @unitId NVARCHAR(36) = NULL,
    @stockQuantity DECIMAL(18,4) = 0,
    @status NVARCHAR(20) = 'active',
    @images NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Insert into Products table
        INSERT INTO Products (
            id, 
            store_id, 
            category_id, 
            name, 
            description, 
            price, 
            cost_price, 
            sku, 
            stock_quantity, 
            images, 
            status, 
            created_at, 
            updated_at
        )
        VALUES (
            @id, 
            @storeId, 
            @categoryId, 
            @name, 
            @description, 
            @price, 
            @costPrice, 
            @sku, 
            @stockQuantity, 
            @images, 
            @status, 
            GETDATE(), 
            GETDATE()
        );
        
        -- Create ProductInventory record if unitId is provided
        IF @unitId IS NOT NULL
        BEGIN
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
                @id, 
                @storeId, 
                @unitId, 
                @stockQuantity, 
                GETDATE(), 
                GETDATE()
            );
        END
        
        COMMIT TRANSACTION;
        
        -- Return the created product
        SELECT 
            p.id,
            p.store_id AS storeId,
            p.category_id AS categoryId,
            p.name,
            p.description,
            p.price,
            p.cost_price AS costPrice,
            p.sku,
            p.stock_quantity AS stockQuantity,
            p.images,
            p.status,
            p.created_at AS createdAt,
            p.updated_at AS updatedAt,
            c.name AS categoryName,
            ISNULL(pi.Quantity, 0) AS currentStock
        FROM Products p
        LEFT JOIN Categories c ON p.category_id = c.id
        LEFT JOIN ProductInventory pi ON p.id = pi.ProductId AND pi.StoreId = @storeId
        WHERE p.id = @id AND p.store_id = @storeId;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        THROW;
    END CATCH
END
GO
