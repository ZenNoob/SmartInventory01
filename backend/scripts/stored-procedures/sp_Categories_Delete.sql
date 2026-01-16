-- =============================================
-- Stored Procedure: sp_Categories_Delete
-- Description: Deletes a category
-- Requirements: 9.3
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Categories_Delete')
    DROP PROCEDURE sp_Categories_Delete;
GO

CREATE PROCEDURE sp_Categories_Delete
    @id NVARCHAR(36),
    @storeId NVARCHAR(36)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Check if category exists
        IF NOT EXISTS (SELECT 1 FROM Categories WHERE id = @id AND store_id = @storeId)
        BEGIN
            RAISERROR('Category not found', 16, 1);
            RETURN;
        END
        
        -- Delete the category
        DELETE FROM Categories 
        WHERE id = @id AND store_id = @storeId;
        
        -- Return affected rows count
        SELECT @@ROWCOUNT AS AffectedRows;
        
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO
