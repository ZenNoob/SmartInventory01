-- =============================================
-- Stored Procedure: sp_Units_Update
-- Description: Updates an existing unit with partial update support
-- Requirements: 8.2
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Units_Update')
    DROP PROCEDURE sp_Units_Update;
GO

CREATE PROCEDURE sp_Units_Update
    @id NVARCHAR(36),
    @storeId NVARCHAR(36),
    @name NVARCHAR(255) = NULL,
    @description NVARCHAR(500) = NULL,
    @baseUnitId NVARCHAR(36) = NULL,
    @conversionFactor DECIMAL(18,6) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Check if unit exists
        IF NOT EXISTS (SELECT 1 FROM Units WHERE id = @id AND store_id = @storeId)
        BEGIN
            RAISERROR('Unit not found', 16, 1);
            RETURN;
        END
        
        -- Update unit with COALESCE for partial updates
        UPDATE Units SET
            name = COALESCE(@name, name),
            description = COALESCE(@description, description),
            base_unit_id = COALESCE(@baseUnitId, base_unit_id),
            conversion_factor = COALESCE(@conversionFactor, conversion_factor),
            updated_at = GETDATE()
        WHERE id = @id AND store_id = @storeId;
        
        -- Return the updated unit
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
        WHERE id = @id AND store_id = @storeId;
        
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO
