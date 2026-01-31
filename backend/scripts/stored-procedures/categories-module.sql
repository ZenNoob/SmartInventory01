-- =============================================
-- Categories Module Stored Procedures
-- Description: All stored procedures for Categories operations
-- Requirements: 9.1, 9.2, 9.3, 9.4
-- =============================================

-- =============================================
-- sp_Categories_Create
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Categories_Create')
    DROP PROCEDURE sp_Categories_Create;
GO

CREATE PROCEDURE sp_Categories_Create
    @id UNIQUEIDENTIFIER,
    @storeId UNIQUEIDENTIFIER,
    @name NVARCHAR(255),
    @description NVARCHAR(500) = NULL,
    @parentId UNIQUEIDENTIFIER = NULL
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

-- =============================================
-- sp_Categories_Update
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Categories_Update')
    DROP PROCEDURE sp_Categories_Update;
GO

CREATE PROCEDURE sp_Categories_Update
    @id UNIQUEIDENTIFIER,
    @storeId UNIQUEIDENTIFIER,
    @name NVARCHAR(255) = NULL,
    @description NVARCHAR(500) = NULL,
    @parentId UNIQUEIDENTIFIER = NULL
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

-- =============================================
-- sp_Categories_Delete
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Categories_Delete')
    DROP PROCEDURE sp_Categories_Delete;
GO

CREATE PROCEDURE sp_Categories_Delete
    @id UNIQUEIDENTIFIER,
    @storeId UNIQUEIDENTIFIER
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

-- =============================================
-- sp_Categories_GetByStore
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Categories_GetByStore')
    DROP PROCEDURE sp_Categories_GetByStore;
GO

CREATE PROCEDURE sp_Categories_GetByStore
    @storeId UNIQUEIDENTIFIER
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
