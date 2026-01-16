-- =============================================
-- Stored Procedure: sp_Units_Create
-- Description: Creates a new unit
-- Requirements: 8.1
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Units_Create')
    DROP PROCEDURE sp_Units_Create;
GO

CREATE PROCEDURE sp_Units_Create
    @id NVARCHAR(36),
    @storeId NVARCHAR(36),
    @name NVARCHAR(255),
    @description NVARCHAR(500) = NULL,
    @baseUnitId NVARCHAR(36) = NULL,
    @conversionFactor DECIMAL(18,6) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Insert into Units table
        INSERT INTO Units (
            id,
            store_id,
            name,
            description,
            base_unit_id,
            conversion_factor,
            created_at,
            updated_at
        )
        VALUES (
            @id,
            @storeId,
            @name,
            @description,
            @baseUnitId,
            @conversionFactor,
            GETDATE(),
            GETDATE()
        );
        
        -- Return the created unit
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
