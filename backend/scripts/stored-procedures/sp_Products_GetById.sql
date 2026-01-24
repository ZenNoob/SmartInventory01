-- =============================================
-- Stored Procedure: sp_Products_GetById
-- Description: Retrieves a single product by ID with stock from ProductInventory
-- Requirements: 1.5
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Products_GetById')
    DROP PROCEDURE sp_Products_GetById;
GO

CREATE PROCEDURE sp_Products_GetById
    @id NVARCHAR(36),
    @storeId NVARCHAR(36)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        p.id,
        p.store_id AS storeId,
        p.category_id AS categoryId,
        p.name,
        p.description,
        p.price,
        p.cost_price AS costPrice,
        p.sku,
        p.unit_id AS unitId,
        p.stock_quantity AS stockQuantity,
        p.images,
        p.status,
        p.created_at AS createdAt,
        p.updated_at AS updatedAt,
        c.name AS categoryName,
        ISNULL(pi.Quantity, p.stock_quantity) AS currentStock
    FROM Products p
    LEFT JOIN Categories c ON p.category_id = c.id
    LEFT JOIN ProductInventory pi ON p.id = pi.ProductId AND pi.StoreId = @storeId
    WHERE p.id = @id AND p.store_id = @storeId;
END
GO
