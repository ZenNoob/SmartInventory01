-- =============================================
-- Settings Module Stored Procedures
-- Description: All stored procedures for Settings operations
-- Requirements: 7.1, 7.2
-- =============================================

-- =============================================
-- sp_Settings_GetByStore
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

-- =============================================
-- sp_Settings_Upsert
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Settings_Upsert')
    DROP PROCEDURE sp_Settings_Upsert;
GO

CREATE PROCEDURE sp_Settings_Upsert
    @storeId NVARCHAR(36),
    @settings NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Check if settings exist for this store
        IF EXISTS (SELECT 1 FROM Settings WHERE store_id = @storeId)
        BEGIN
            -- Update existing settings
            UPDATE Settings 
            SET 
                settings = @settings, 
                updated_at = GETDATE()
            WHERE store_id = @storeId;
        END
        ELSE
        BEGIN
            -- Insert new settings
            INSERT INTO Settings (
                id, 
                store_id, 
                settings, 
                created_at, 
                updated_at
            )
            VALUES (
                NEWID(), 
                @storeId, 
                @settings, 
                GETDATE(), 
                GETDATE()
            );
        END
        
        -- Return the updated/created settings
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
