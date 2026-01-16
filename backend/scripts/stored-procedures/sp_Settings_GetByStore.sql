-- =============================================
-- Stored Procedure: sp_Settings_GetByStore
-- Description: Retrieves settings for a specific store
-- Requirements: 7.1
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Settings_GetByStore')
    DROP PROCEDURE sp_Settings_GetByStore;
GO

CREATE PROCEDURE sp_Settings_GetByStore
    @storeId NVARCHAR(36)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT 
            id,
            store_id AS storeId,
            settings,
            created_at AS createdAt,
            updated_at AS updatedAt
        FROM Settings 
        WHERE store_id = @storeId;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO
