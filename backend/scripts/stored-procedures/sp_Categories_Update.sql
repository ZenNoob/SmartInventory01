-- =============================================
-- Stored Procedure: sp_Categories_Update
-- Description: Updates an existing category with partial update support
-- Requirements: 9.2
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Categories_Update')
    DROP PROCEDURE sp_Categories_Update;
GO

CREATE PROCEDURE sp_Categories_Update
    @id NVARCHAR(36),
    @storeId NVARCHAR(36),
    @name NVARCHAR(255) = NULL,
    @description NVARCHAR(500) = NULL,
    @parentId NVARCHAR(36) = NULL
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
        
        -- Update category with COALESCE for partial updates
        UPDATE Categories SET
            name = COALESCE(@name, name),
            description = COALESCE(@description, description),
            parent_id = COALESCE(@parentId, parent_id),
            updated_at = GETDATE()
        WHERE id = @id AND store_id = @storeId;
        
        -- Return the updated category
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
