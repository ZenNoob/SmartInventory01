-- =============================================
-- Stored Procedure: sp_Customers_UpdateDebt
-- Description: Updates customer debt information
-- Requirements: 3.5
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Customers_UpdateDebt')
    DROP PROCEDURE sp_Customers_UpdateDebt;
GO

CREATE PROCEDURE sp_Customers_UpdateDebt
    @id NVARCHAR(36),
    @storeId NVARCHAR(36),
    @debtAmount DECIMAL(18,2) = 0,
    @paidAmount DECIMAL(18,2) = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if customer exists
    IF NOT EXISTS (SELECT 1 FROM Customers WHERE id = @id AND store_id = @storeId)
    BEGIN
        RAISERROR('Customer not found', 16, 1);
        RETURN;
    END
    
    -- Update debt and paid amounts
    UPDATE Customers SET
        total_debt = ISNULL(total_debt, 0) + @debtAmount,
        total_paid = ISNULL(total_paid, 0) + @paidAmount,
        updated_at = GETDATE()
    WHERE id = @id AND store_id = @storeId;
    
    -- Return updated debt information
    SELECT 
        id,
        store_id AS storeId,
        full_name AS name,
        ISNULL(total_debt, 0) AS totalDebt,
        ISNULL(total_paid, 0) AS totalPaid,
        ISNULL(total_debt, 0) - ISNULL(total_paid, 0) AS currentDebt,
        updated_at AS updatedAt
    FROM Customers
    WHERE id = @id AND store_id = @storeId;
END
GO
