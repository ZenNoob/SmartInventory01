-- =============================================
-- Customers Module - All Stored Procedures
-- Description: Combined file for all Customers-related stored procedures
-- Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
-- =============================================

-- =============================================
-- sp_Customers_Create
-- Description: Creates a new customer
-- Requirements: 3.1
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Customers_Create')
    DROP PROCEDURE sp_Customers_Create;
GO

CREATE PROCEDURE sp_Customers_Create
    @id NVARCHAR(36),
    @storeId NVARCHAR(36),
    @name NVARCHAR(255),
    @email NVARCHAR(255) = NULL,
    @phone NVARCHAR(50) = NULL,
    @address NVARCHAR(500) = NULL,
    @customerType NVARCHAR(50) = 'personal',
    @customerGroup NVARCHAR(100) = NULL,
    @status NVARCHAR(20) = 'active',
    @lifetimePoints INT = 0,
    @loyaltyTier NVARCHAR(50) = NULL,
    @notes NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Insert into Customers table
        INSERT INTO Customers (
            id,
            store_id,
            full_name,
            email,
            phone,
            address,
            customer_type,
            customer_group,
            status,
            lifetime_points,
            loyalty_tier,
            notes,
            total_debt,
            total_paid,
            created_at,
            updated_at
        )
        VALUES (
            @id,
            @storeId,
            @name,
            @email,
            @phone,
            @address,
            @customerType,
            @customerGroup,
            @status,
            @lifetimePoints,
            @loyaltyTier,
            @notes,
            0,
            0,
            GETDATE(),
            GETDATE()
        );
        
        -- Return the created customer
        SELECT 
            id,
            store_id AS storeId,
            full_name AS name,
            email,
            phone,
            address,
            customer_type AS customerType,
            customer_group AS customerGroup,
            status,
            lifetime_points AS lifetimePoints,
            loyalty_tier AS loyaltyTier,
            notes,
            ISNULL(total_debt, 0) AS totalDebt,
            ISNULL(total_paid, 0) AS totalPaid,
            created_at AS createdAt,
            updated_at AS updatedAt
        FROM Customers
        WHERE id = @id AND store_id = @storeId;
        
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- =============================================
-- sp_Customers_Update
-- Description: Updates an existing customer with COALESCE for partial updates
-- Requirements: 3.2
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Customers_Update')
    DROP PROCEDURE sp_Customers_Update;
GO

CREATE PROCEDURE sp_Customers_Update
    @id NVARCHAR(36),
    @storeId NVARCHAR(36),
    @name NVARCHAR(255) = NULL,
    @email NVARCHAR(255) = NULL,
    @phone NVARCHAR(50) = NULL,
    @address NVARCHAR(500) = NULL,
    @customerType NVARCHAR(50) = NULL,
    @customerGroup NVARCHAR(100) = NULL,
    @status NVARCHAR(20) = NULL,
    @lifetimePoints INT = NULL,
    @loyaltyTier NVARCHAR(50) = NULL,
    @notes NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if customer exists
    IF NOT EXISTS (SELECT 1 FROM Customers WHERE id = @id AND store_id = @storeId)
    BEGIN
        RAISERROR('Customer not found', 16, 1);
        RETURN;
    END
    
    -- Update customer with COALESCE for partial updates
    UPDATE Customers SET
        full_name = COALESCE(@name, full_name),
        email = COALESCE(@email, email),
        phone = COALESCE(@phone, phone),
        address = COALESCE(@address, address),
        customer_type = COALESCE(@customerType, customer_type),
        customer_group = COALESCE(@customerGroup, customer_group),
        status = COALESCE(@status, status),
        lifetime_points = COALESCE(@lifetimePoints, lifetime_points),
        loyalty_tier = COALESCE(@loyaltyTier, loyalty_tier),
        notes = COALESCE(@notes, notes),
        updated_at = GETDATE()
    WHERE id = @id AND store_id = @storeId;
    
    -- Return the updated customer
    SELECT 
        id,
        store_id AS storeId,
        full_name AS name,
        email,
        phone,
        address,
        customer_type AS customerType,
        customer_group AS customerGroup,
        status,
        lifetime_points AS lifetimePoints,
        loyalty_tier AS loyaltyTier,
        notes,
        ISNULL(total_debt, 0) AS totalDebt,
        ISNULL(total_paid, 0) AS totalPaid,
        created_at AS createdAt,
        updated_at AS updatedAt
    FROM Customers
    WHERE id = @id AND store_id = @storeId;
END
GO

-- =============================================
-- sp_Customers_Delete
-- Description: Deletes a customer
-- Requirements: 3.3
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Customers_Delete')
    DROP PROCEDURE sp_Customers_Delete;
GO

CREATE PROCEDURE sp_Customers_Delete
    @id NVARCHAR(36),
    @storeId NVARCHAR(36)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if customer exists
    IF NOT EXISTS (SELECT 1 FROM Customers WHERE id = @id AND store_id = @storeId)
    BEGIN
        RAISERROR('Customer not found', 16, 1);
        RETURN;
    END
    
    -- Delete the customer
    DELETE FROM Customers 
    WHERE id = @id AND store_id = @storeId;
    
    -- Return affected rows count
    SELECT @@ROWCOUNT AS AffectedRows;
END
GO

-- =============================================
-- sp_Customers_GetByStore
-- Description: Retrieves all customers for a store with debt information
-- Requirements: 3.4
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Customers_GetByStore')
    DROP PROCEDURE sp_Customers_GetByStore;
GO

CREATE PROCEDURE sp_Customers_GetByStore
    @storeId NVARCHAR(36),
    @status NVARCHAR(20) = NULL,
    @customerType NVARCHAR(50) = NULL,
    @searchTerm NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        c.id,
        c.store_id AS storeId,
        c.full_name AS name,
        c.email,
        c.phone,
        c.address,
        c.customer_type AS customerType,
        c.customer_group AS customerGroup,
        c.status,
        c.lifetime_points AS lifetimePoints,
        c.loyalty_tier AS loyaltyTier,
        c.notes,
        ISNULL(c.total_debt, 0) AS totalDebt,
        ISNULL(c.total_paid, 0) AS totalPaid,
        -- Calculate debt from Sales if total_debt column is not available
        COALESCE(c.total_debt, (
            SELECT COALESCE(SUM(s.remaining_debt), 0) 
            FROM Sales s 
            WHERE s.customer_id = c.id AND s.remaining_debt > 0
        ), 0) AS calculatedDebt,
        -- Calculate payments total
        COALESCE(c.total_paid, (
            SELECT COALESCE(SUM(p.amount), 0) 
            FROM Payments p 
            WHERE p.customer_id = c.id
        ), 0) AS totalPayments,
        c.created_at AS createdAt,
        c.updated_at AS updatedAt
    FROM Customers c
    WHERE c.store_id = @storeId
        AND (@status IS NULL OR c.status = @status)
        AND (@customerType IS NULL OR c.customer_type = @customerType)
        AND (@searchTerm IS NULL OR c.full_name LIKE '%' + @searchTerm + '%' OR c.phone LIKE '%' + @searchTerm + '%' OR c.email LIKE '%' + @searchTerm + '%')
    ORDER BY c.full_name ASC;
END
GO

-- =============================================
-- sp_Customers_GetById
-- Description: Retrieves a single customer by ID
-- Requirements: 3.4
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Customers_GetById')
    DROP PROCEDURE sp_Customers_GetById;
GO

CREATE PROCEDURE sp_Customers_GetById
    @id NVARCHAR(36),
    @storeId NVARCHAR(36)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        c.id,
        c.store_id AS storeId,
        c.full_name AS name,
        c.email,
        c.phone,
        c.address,
        c.customer_type AS customerType,
        c.customer_group AS customerGroup,
        c.status,
        c.lifetime_points AS lifetimePoints,
        c.loyalty_tier AS loyaltyTier,
        c.notes,
        ISNULL(c.total_debt, 0) AS totalDebt,
        ISNULL(c.total_paid, 0) AS totalPaid,
        c.created_at AS createdAt,
        c.updated_at AS updatedAt
    FROM Customers c
    WHERE c.id = @id AND c.store_id = @storeId;
END
GO

-- =============================================
-- sp_Customers_UpdateDebt
-- Description: Updates customer debt information
-- Requirements: 3.5
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Customers_UpdateDebt')
    DROP PROCEDURE sp_Customers_UpdateDebt;
GO

CREATE PROCEDURE sp_Customers_UpdateDebt
    @id NVARCHAR(36),
    @storeId NVARCHAR(36),
    @debtAmount DECIMAL(18,2) = 0,
    @paidAmount DECIMAL(18,2) = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if customer exists
    IF NOT EXISTS (SELECT 1 FROM Customers WHERE id = @id AND store_id = @storeId)
    BEGIN
        RAISERROR('Customer not found', 16, 1);
        RETURN;
    END
    
    -- Update debt and paid amounts
    UPDATE Customers SET
        total_debt = ISNULL(total_debt, 0) + @debtAmount,
        total_paid = ISNULL(total_paid, 0) + @paidAmount,
        updated_at = GETDATE()
    WHERE id = @id AND store_id = @storeId;
    
    -- Return updated debt information
    SELECT 
        id,
        store_id AS storeId,
        full_name AS name,
        ISNULL(total_debt, 0) AS totalDebt,
        ISNULL(total_paid, 0) AS totalPaid,
        ISNULL(total_debt, 0) - ISNULL(total_paid, 0) AS currentDebt,
        updated_at AS updatedAt
    FROM Customers
    WHERE id = @id AND store_id = @storeId;
END
GO

PRINT 'Customers module stored procedures created successfully!';
GO
