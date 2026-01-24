-- =============================================
-- Stored Procedure: sp_Customers_GetByStore
-- Description: Retrieves all customers for a store with debt information
-- Requirements: 3.4
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Customers_GetByStore')
    DROP PROCEDURE sp_Customers_GetByStore;
GO

CREATE PROCEDURE sp_Customers_GetByStore
    @storeId NVARCHAR(36),
    @status NVARCHAR(20) = NULL,
    @customerType NVARCHAR(50) = NULL,
    @searchTerm NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        c.id,
        c.store_id AS storeId,
        c.full_name AS name,
        c.email,
        c.phone,
        c.address,
        c.customer_type AS customerType,
        c.customer_group AS customerGroup,
        c.status,
        ISNULL(c.lifetime_points, 0) AS lifetimePoints,
        c.loyalty_tier AS loyaltyTier,
        c.notes,
        -- Calculate total spent from Sales
        ISNULL((
            SELECT SUM(s.final_amount) 
            FROM Sales s 
            WHERE s.customer_id = c.id AND s.store_id = c.store_id AND s.status != 'cancelled'
        ), 0) AS totalSales,
        -- Calculate total paid from Sales
        ISNULL((
            SELECT SUM(s.customer_payment) 
            FROM Sales s 
            WHERE s.customer_id = c.id AND s.store_id = c.store_id AND s.status != 'cancelled'
        ), 0) AS totalPaid,
        -- Calculate debt (total sales - total paid)
        ISNULL((
            SELECT SUM(s.final_amount) - SUM(ISNULL(s.customer_payment, 0))
            FROM Sales s 
            WHERE s.customer_id = c.id AND s.store_id = c.store_id AND s.status != 'cancelled'
        ), 0) AS totalDebt,
        c.created_at AS createdAt,
        c.updated_at AS updatedAt
    FROM Customers c
    WHERE c.store_id = @storeId
        AND c.status != 'deleted'
        AND (@status IS NULL OR c.status = @status)
        AND (@customerType IS NULL OR c.customer_type = @customerType)
        AND (@searchTerm IS NULL OR c.full_name LIKE '%' + @searchTerm + '%' OR c.phone LIKE '%' + @searchTerm + '%' OR c.email LIKE '%' + @searchTerm + '%')
    ORDER BY c.full_name ASC;
END
GO
