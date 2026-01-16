-- =============================================
-- Stored Procedure: sp_Units_GetByStore
-- Description: Retrieves all units for a specific store
-- Requirements: 8.4
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Units_GetByStore')
    DROP PROCEDURE sp_Units_GetByStore;
GO

CREATE PROCEDURE sp_Units_GetByStore
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
            base_unit_id AS baseUnitId,
            conversion_factor AS conversionFactor,
            created_at AS createdAt,
            updated_at AS updatedAt
        FROM Units 
        WHERE store_id = @storeId
        ORDER BY name;
        
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO
