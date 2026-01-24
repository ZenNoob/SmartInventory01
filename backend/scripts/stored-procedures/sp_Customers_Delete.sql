-- =============================================
-- Stored Procedure: sp_Customers_Delete
-- Description: Deletes a customer
-- Requirements: 3.3
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Customers_Delete')
    DROP PROCEDURE sp_Customers_Delete;
GO

CREATE PROCEDURE sp_Customers_Delete
    @id NVARCHAR(36),
    @storeId NVARCHAR(36)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if customer exists
    IF NOT EXISTS (SELECT 1 FROM Customers WHERE id = @id AND store_id = @storeId)
    BEGIN
        RAISERROR('Customer not found', 16, 1);
        RETURN;
    END
    
    -- Soft delete by setting status to 'deleted'
    UPDATE Customers 
    SET status = 'deleted', updated_at = GETDATE()
    WHERE id = @id AND store_id = @storeId;
    
    -- Return affected rows count
    SELECT @@ROWCOUNT AS AffectedRows;
END
GO
