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
    
    -- Check if sale exists
    IF NOT EXISTS (SELECT 1 FROM Sales WHERE Id = @id AND StoreId = @storeId)
    BEGIN
        RAISERROR('Sale not found', 16, 1);
        RETURN;
    END
    
    -- Update sale status and optional fields
    UPDATE Sales SET
        Status = @status,
        CustomerPayment = COALESCE(@customerPayment, CustomerPayment),
        RemainingDebt = COALESCE(@remainingDebt, RemainingDebt),
        UpdatedAt = GETDATE()
    WHERE Id = @id AND StoreId = @storeId;
    
    -- Return affected rows count and updated sale
    SELECT 
        @@ROWCOUNT AS affectedRows,
        s.Id AS id,
        s.StoreId AS storeId,
        s.InvoiceNumber AS invoiceNumber,
        s.Status AS status,
        s.CustomerPayment AS customerPayment,
        s.RemainingDebt AS remainingDebt,
        s.UpdatedAt AS updatedAt
    FROM Sales s
    WHERE s.Id = @id AND s.StoreId = @storeId;
END
GO
