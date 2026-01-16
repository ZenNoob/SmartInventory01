-- =============================================
-- Stored Procedure: sp_Products_Update
-- Description: Updates an existing product with COALESCE for partial updates
-- Requirements: 1.2
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Products_Update')
    DROP PROCEDURE sp_Products_Update;
GO

CREATE PROCEDURE sp_Products_Update
    @id NVARCHAR(36),
    @storeId NVARCHAR(36),
    @categoryId NVARCHAR(36) = NULL,
    @name NVARCHAR(255) = NULL,
    @description NVARCHAR(MAX) = NULL,
    @price DECIMAL(18,2) = NULL,
    @costPrice DECIMAL(18,2) = NULL,
    @sku NVARCHAR(100) = NULL,
    @unitId NVARCHAR(36) = NULL,
    @stockQuantity DECIMAL(18,4) = NULL,
    @status NVARCHAR(20) = NULL,
    @images NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if product exists
    IF NOT EXISTS (SELECT 1 FROM Products WHERE id = @id AND store_id = @storeId)
    BEGIN
        RAISERROR('Product not found', 16, 1);
        RETURN;
    END
    
    -- Update product with COALESCE for partial updates
    UPDATE Products SET
        category_id = COALESCE(@categoryId, category_id),
        name = COALESCE(@name, name),
        description = COALESCE(@description, description),
        price = COALESCE(@price, price),
        cost_price = COALESCE(@costPrice, cost_price),
        sku = COALESCE(@sku, sku),
        stock_quantity = COALESCE(@stockQuantity, stock_quantity),
        status = COALESCE(@status, status),
        images = COALESCE(@images, images),
        updated_at = GETDATE()
    WHERE id = @id AND store_id = @storeId;
    
    -- Update ProductInventory if stockQuantity is provided
    IF @stockQuantity IS NOT NULL AND @unitId IS NOT NULL
    BEGIN
        IF EXISTS (SELECT 1 FROM ProductInventory WHERE ProductId = @id AND StoreId = @storeId AND UnitId = @unitId)
        BEGIN
            UPDATE ProductInventory 
            SET Quantity = @stockQuantity, UpdatedAt = GETDATE()
            WHERE ProductId = @id AND StoreId = @storeId AND UnitId = @unitId;
        END
        ELSE
        BEGIN
            INSERT INTO ProductInventory (Id, ProductId, StoreId, UnitId, Quantity, CreatedAt, UpdatedAt)
            VALUES (NEWID(), @id, @storeId, @unitId, @stockQuantity, GETDATE(), GETDATE());
        END
    END
    
    -- Return the updated product
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
END
GO
