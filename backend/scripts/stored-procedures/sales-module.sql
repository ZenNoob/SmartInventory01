-- =============================================
-- Sales Module - All Stored Procedures
-- Description: Combined file for all Sales-related stored procedures
-- Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
-- =============================================

-- =============================================
-- sp_Sales_Create
-- Description: Creates a new sale with transaction handling
-- Requirements: 2.1
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Sales_Create')
    DROP PROCEDURE sp_Sales_Create;
GO

CREATE PROCEDURE sp_Sales_Create
    @id NVARCHAR(36),
    @storeId NVARCHAR(36),
    @invoiceNumber NVARCHAR(50),
    @customerId NVARCHAR(36) = NULL,
    @shiftId NVARCHAR(36) = NULL,
    @totalAmount DECIMAL(18,2),
    @vatAmount DECIMAL(18,2) = 0,
    @finalAmount DECIMAL(18,2),
    @discount DECIMAL(18,2) = 0,
    @discountType NVARCHAR(20) = NULL,
    @discountValue DECIMAL(18,2) = NULL,
    @tierDiscountPercentage DECIMAL(5,2) = NULL,
    @tierDiscountAmount DECIMAL(18,2) = NULL,
    @pointsUsed INT = 0,
    @pointsDiscount DECIMAL(18,2) = 0,
    @customerPayment DECIMAL(18,2) = 0,
    @previousDebt DECIMAL(18,2) = 0,
    @remainingDebt DECIMAL(18,2) = 0,
    @status NVARCHAR(20) = 'pending'
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Insert into Sales table (snake_case columns)
        INSERT INTO Sales (
            id,
            store_id,
            invoice_number,
            customer_id,
            shift_id,
            transaction_date,
            status,
            total_amount,
            vat_amount,
            final_amount,
            discount,
            discount_type,
            discount_value,
            tier_discount_percentage,
            tier_discount_amount,
            points_used,
            points_discount,
            customer_payment,
            previous_debt,
            remaining_debt,
            created_at,
            updated_at
        )
        VALUES (
            @id,
            @storeId,
            @invoiceNumber,
            @customerId,
            @shiftId,
            GETDATE(),
            @status,
            @totalAmount,
            @vatAmount,
            @finalAmount,
            @discount,
            @discountType,
            @discountValue,
            @tierDiscountPercentage,
            @tierDiscountAmount,
            @pointsUsed,
            @pointsDiscount,
            @customerPayment,
            @previousDebt,
            @remainingDebt,
            GETDATE(),
            GETDATE()
        );
        
        COMMIT TRANSACTION;
        
        -- Return the created sale
        SELECT 
            s.id AS id,
            s.store_id AS storeId,
            s.invoice_number AS invoiceNumber,
            s.customer_id AS customerId,
            c.full_name AS customerName,
            s.shift_id AS shiftId,
            s.transaction_date AS transactionDate,
            s.status AS status,
            s.total_amount AS totalAmount,
            s.vat_amount AS vatAmount,
            s.final_amount AS finalAmount,
            s.discount AS discount,
            s.discount_type AS discountType,
            s.discount_value AS discountValue,
            s.tier_discount_percentage AS tierDiscountPercentage,
            s.tier_discount_amount AS tierDiscountAmount,
            s.points_used AS pointsUsed,
            s.points_discount AS pointsDiscount,
            s.customer_payment AS customerPayment,
            s.previous_debt AS previousDebt,
            s.remaining_debt AS remainingDebt,
            s.created_at AS createdAt,
            s.updated_at AS updatedAt
        FROM Sales s
        LEFT JOIN Customers c ON s.customer_id = c.id
        WHERE s.id = @id AND s.store_id = @storeId;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        THROW;
    END CATCH
END
GO

-- =============================================
-- sp_SalesItems_Create
-- Description: Creates a sale item and deducts inventory
-- Requirements: 2.1, 2.5
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_SalesItems_Create')
    DROP PROCEDURE sp_SalesItems_Create;
GO

CREATE PROCEDURE sp_SalesItems_Create
    @id NVARCHAR(36),
    @salesTransactionId NVARCHAR(36),
    @productId NVARCHAR(36),
    @quantity DECIMAL(18,4),
    @price DECIMAL(18,2),
    @unitId NVARCHAR(36) = NULL,
    @storeId NVARCHAR(36)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @currentStock DECIMAL(18,4);
    DECLARE @productName NVARCHAR(255);
    DECLARE @hasInventoryRecord BIT = 0;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Get product name for error messages
        SELECT @productName = name FROM Products WHERE id = @productId;
        
        -- Check available stock in ProductInventory first
        IF @unitId IS NOT NULL
        BEGIN
            SELECT @currentStock = Quantity 
            FROM ProductInventory 
            WHERE ProductId = @productId AND StoreId = @storeId AND UnitId = @unitId;
            
            IF @currentStock IS NOT NULL
                SET @hasInventoryRecord = 1;
        END
        
        -- Fallback to Products.stock_quantity if no ProductInventory record
        IF @currentStock IS NULL
        BEGIN
            SELECT @currentStock = stock_quantity 
            FROM Products 
            WHERE id = @productId AND store_id = @storeId;
        END
        
        -- Validate stock availability
        IF @currentStock IS NULL
            SET @currentStock = 0;
            
        IF @currentStock < @quantity
        BEGIN
            DECLARE @errorMsg NVARCHAR(500);
            SET @errorMsg = 'Insufficient stock for product: ' + ISNULL(@productName, @productId) + 
                           '. Available: ' + CAST(@currentStock AS NVARCHAR(20)) + 
                           ', Requested: ' + CAST(@quantity AS NVARCHAR(20));
            RAISERROR(@errorMsg, 16, 1);
            RETURN;
        END
        
        -- Insert into SalesItems table (snake_case columns)
        INSERT INTO SalesItems (
            id,
            sales_transaction_id,
            product_id,
            quantity,
            price,
            unit_id,
            created_at
        )
        VALUES (
            @id,
            @salesTransactionId,
            @productId,
            @quantity,
            @price,
            @unitId,
            GETDATE()
        );
        
        -- Deduct inventory from ProductInventory if record exists
        IF @hasInventoryRecord = 1
        BEGIN
            UPDATE ProductInventory 
            SET Quantity = Quantity - @quantity, 
                UpdatedAt = GETDATE()
            WHERE ProductId = @productId AND StoreId = @storeId AND UnitId = @unitId;
        END
        
        -- Always update stock_quantity in Products table
        UPDATE Products 
        SET stock_quantity = stock_quantity - @quantity,
            updated_at = GETDATE()
        WHERE id = @productId AND store_id = @storeId;
        
        COMMIT TRANSACTION;
        
        -- Return the created sale item with product info
        SELECT 
            si.id AS id,
            si.sales_transaction_id AS salesTransactionId,
            si.product_id AS productId,
            p.name AS productName,
            si.quantity AS quantity,
            si.price AS price,
            (si.quantity * si.price) AS totalPrice,
            si.created_at AS createdAt
        FROM SalesItems si
        LEFT JOIN Products p ON si.product_id = p.id
        WHERE si.id = @id;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        THROW;
    END CATCH
END
GO

-- =============================================
-- sp_Sales_GetById
-- Description: Retrieves a sale by ID with its items
-- Requirements: 2.2
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Sales_GetById')
    DROP PROCEDURE sp_Sales_GetById;
GO

CREATE PROCEDURE sp_Sales_GetById
    @id NVARCHAR(36),
    @storeId NVARCHAR(36)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Return sale information
    SELECT 
        s.id AS id,
        s.store_id AS storeId,
        s.invoice_number AS invoiceNumber,
        s.customer_id AS customerId,
        c.full_name AS customerName,
        s.shift_id AS shiftId,
        s.transaction_date AS transactionDate,
        s.status AS status,
        s.total_amount AS totalAmount,
        s.vat_amount AS vatAmount,
        s.final_amount AS finalAmount,
        s.discount AS discount,
        s.discount_type AS discountType,
        s.discount_value AS discountValue,
        s.tier_discount_percentage AS tierDiscountPercentage,
        s.tier_discount_amount AS tierDiscountAmount,
        s.points_used AS pointsUsed,
        s.points_discount AS pointsDiscount,
        s.customer_payment AS customerPayment,
        s.previous_debt AS previousDebt,
        s.remaining_debt AS remainingDebt,
        s.created_at AS createdAt,
        s.updated_at AS updatedAt
    FROM Sales s
    LEFT JOIN Customers c ON s.customer_id = c.id
    WHERE s.id = @id AND s.store_id = @storeId;
    
    -- Return sale items
    SELECT 
        si.id AS id,
        si.sales_transaction_id AS salesTransactionId,
        si.product_id AS productId,
        p.name AS productName,
        u.name AS unitName,
        si.quantity AS quantity,
        si.price AS price,
        (si.quantity * si.price) AS totalPrice,
        si.created_at AS createdAt
    FROM SalesItems si
    LEFT JOIN Products p ON si.product_id = p.id
    LEFT JOIN Units u ON p.unit_id = u.id
    WHERE si.sales_transaction_id = @id
    ORDER BY si.created_at ASC;
END
GO

-- =============================================
-- sp_Sales_GetByStore
-- Description: Retrieves sales for a store with optional filters and pagination
-- Requirements: 2.3
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Sales_GetByStore')
    DROP PROCEDURE sp_Sales_GetByStore;
GO

CREATE PROCEDURE sp_Sales_GetByStore
    @storeId NVARCHAR(36),
    @status NVARCHAR(20) = NULL,
    @customerId NVARCHAR(36) = NULL,
    @startDate DATETIME = NULL,
    @endDate DATETIME = NULL,
    @searchTerm NVARCHAR(255) = NULL,
    @page INT = 1,
    @pageSize INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @offset INT = (@page - 1) * @pageSize;
    DECLARE @total INT;
    
    -- Get total count
    SELECT @total = COUNT(*)
    FROM Sales s
    LEFT JOIN Customers c ON s.customer_id = c.id
    WHERE s.store_id = @storeId
        AND (@status IS NULL OR s.status = @status)
        AND (@customerId IS NULL OR s.customer_id = @customerId)
        AND (@startDate IS NULL OR s.transaction_date >= @startDate)
        AND (@endDate IS NULL OR s.transaction_date <= @endDate)
        AND (@searchTerm IS NULL OR s.invoice_number LIKE '%' + @searchTerm + '%' OR c.full_name LIKE '%' + @searchTerm + '%');
    
    -- Return total count as first result set
    SELECT @total AS total;
    
    -- Return paginated sales
    SELECT 
        s.id AS id,
        s.store_id AS storeId,
        s.invoice_number AS invoiceNumber,
        s.customer_id AS customerId,
        c.full_name AS customerName,
        s.shift_id AS shiftId,
        s.transaction_date AS transactionDate,
        s.status AS status,
        s.total_amount AS totalAmount,
        s.vat_amount AS vatAmount,
        s.final_amount AS finalAmount,
        s.discount AS discount,
        s.discount_type AS discountType,
        s.discount_value AS discountValue,
        s.tier_discount_percentage AS tierDiscountPercentage,
        s.tier_discount_amount AS tierDiscountAmount,
        s.points_used AS pointsUsed,
        s.points_discount AS pointsDiscount,
        s.customer_payment AS customerPayment,
        s.previous_debt AS previousDebt,
        s.remaining_debt AS remainingDebt,
        s.created_at AS createdAt,
        s.updated_at AS updatedAt,
        (SELECT COUNT(*) FROM SalesItems si WHERE si.sales_transaction_id = s.id) AS itemCount
    FROM Sales s
    LEFT JOIN Customers c ON s.customer_id = c.id
    WHERE s.store_id = @storeId
        AND (@status IS NULL OR s.status = @status)
        AND (@customerId IS NULL OR s.customer_id = @customerId)
        AND (@startDate IS NULL OR s.transaction_date >= @startDate)
        AND (@endDate IS NULL OR s.transaction_date <= @endDate)
        AND (@searchTerm IS NULL OR s.invoice_number LIKE '%' + @searchTerm + '%' OR c.full_name LIKE '%' + @searchTerm + '%')
    ORDER BY s.transaction_date DESC
    OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;
END
GO

-- =============================================
-- sp_Sales_UpdateStatus
-- Description: Updates the status of a sale
-- Requirements: 2.4
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Sales_UpdateStatus')
    DROP PROCEDURE sp_Sales_UpdateStatus;
GO

CREATE PROCEDURE sp_Sales_UpdateStatus
    @id NVARCHAR(36),
    @storeId NVARCHAR(36),
    @status NVARCHAR(20),
    @customerPayment DECIMAL(18,2) = NULL,
    @remainingDebt DECIMAL(18,2) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if sale exists
    IF NOT EXISTS (SELECT 1 FROM Sales WHERE id = @id AND store_id = @storeId)
    BEGIN
        RAISERROR('Sale not found', 16, 1);
        RETURN;
    END
    
    -- Update sale status and optional fields
    UPDATE Sales SET
        status = @status,
        customer_payment = COALESCE(@customerPayment, customer_payment),
        remaining_debt = COALESCE(@remainingDebt, remaining_debt),
        updated_at = GETDATE()
    WHERE id = @id AND store_id = @storeId;
    
    -- Return affected rows count and updated sale
    SELECT 
        @@ROWCOUNT AS affectedRows,
        s.id AS id,
        s.store_id AS storeId,
        s.invoice_number AS invoiceNumber,
        s.status AS status,
        s.customer_payment AS customerPayment,
        s.remaining_debt AS remainingDebt,
        s.updated_at AS updatedAt
    FROM Sales s
    WHERE s.id = @id AND s.store_id = @storeId;
END
GO

PRINT 'Sales module stored procedures created successfully!';
GO
