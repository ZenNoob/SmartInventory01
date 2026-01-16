-- =============================================
-- Stored Procedure: sp_Categories_Create
-- Description: Creates a new category
-- Requirements: 9.1
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Categories_Create')
    DROP PROCEDURE sp_Categories_Create;
GO

CREATE PROCEDURE sp_Categories_Create
    @id NVARCHAR(36),
    @storeId NVARCHAR(36),
    @name NVARCHAR(255),
    @description NVARCHAR(500) = NULL,
    @parentId NVARCHAR(36) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Insert into Categories table
        INSERT INTO Categories (
            id,
            store_id,
            name,
            description,
            parent_id,
            created_at,
            updated_at
        )
        VALUES (
            @id,
            @storeId,
            @name,
            @description,
            @parentId,
            GETDATE(),
            GETDATE()
        );
        
        -- Return the created category
        SELECT 
            id,
            store_id AS storeId,
            name,
            description,
            parent_id AS parentId,
            created_at AS createdAt,
            updated_at AS updatedAt
        FROM Categories
        WHERE id = @id AND store_id = @storeId;
        
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO
