-- =============================================
-- Stored Procedure: sp_Products_Delete
-- Description: Soft deletes a product by setting status to 'deleted'
-- Requirements: 1.3
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Products_Delete')
    DROP PROCEDURE sp_Products_Delete;
GO

CREATE PROCEDURE sp_Products_Delete
    @id NVARCHAR(36),
    @storeId NVARCHAR(36)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if product exists
    IF NOT EXISTS (SELECT 1 FROM Products WHERE id = @id AND store_id = @storeId)
    BEGIN
        RAISERROR('Product not found', 16, 1);
        RETURN;
    END
    
    -- Soft delete by setting status to 'deleted'
    UPDATE Products 
    SET status = 'deleted', updated_at = GETDATE()
    WHERE id = @id AND store_id = @storeId;
    
    -- Return affected rows count
    SELECT @@ROWCOUNT AS AffectedRows;
END
GO
