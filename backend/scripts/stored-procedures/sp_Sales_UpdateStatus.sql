-- =============================================
-- Stored Procedure: sp_Sales_UpdateStatus
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

    -- Check if sale exists (using snake_case column names)
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
