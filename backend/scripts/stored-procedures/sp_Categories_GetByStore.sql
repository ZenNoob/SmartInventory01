-- =============================================
-- Stored Procedure: sp_Categories_GetByStore
-- Description: Retrieves all categories for a specific store
-- Requirements: 9.4
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Categories_GetByStore')
    DROP PROCEDURE sp_Categories_GetByStore;
GO

CREATE PROCEDURE sp_Categories_GetByStore
    @storeId NVARCHAR(36)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT 
            id,
            store_id AS storeId,
            name,
            description,
            parent_id AS parentId,
            created_at AS createdAt,
            updated_at AS updatedAt
        FROM Categories 
        WHERE store_id = @storeId
        ORDER BY name;
        
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO
