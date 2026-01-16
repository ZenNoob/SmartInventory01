-- =============================================
-- Stored Procedure: sp_Products_GetByStore
-- Description: Retrieves products for a store with optional filters and JOIN ProductInventory
-- Requirements: 1.4
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Products_GetByStore')
    DROP PROCEDURE sp_Products_GetByStore;
GO

CREATE PROCEDURE sp_Products_GetByStore
    @storeId NVARCHAR(36),
    @status NVARCHAR(20) = NULL,
    @categoryId NVARCHAR(36) = NULL,
    @searchTerm NVARCHAR(255) = NULL
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
    WHERE p.store_id = @storeId
        AND (@status IS NULL OR p.status = @status)
        AND (@categoryId IS NULL OR p.category_id = @categoryId)
        AND (@searchTerm IS NULL OR p.name LIKE '%' + @searchTerm + '%' OR p.sku LIKE '%' + @searchTerm + '%')
    ORDER BY p.name ASC;
END
GO
