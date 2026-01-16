-- =============================================
-- Stored Procedure: sp_Sales_GetById
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
        s.Id AS id,
        s.StoreId AS storeId,
        s.InvoiceNumber AS invoiceNumber,
        s.CustomerId AS customerId,
        c.full_name AS customerName,
        s.ShiftId AS shiftId,
        s.TransactionDate AS transactionDate,
        s.Status AS status,
        s.TotalAmount AS totalAmount,
        s.VatAmount AS vatAmount,
        s.FinalAmount AS finalAmount,
        s.Discount AS discount,
        s.DiscountType AS discountType,
        s.DiscountValue AS discountValue,
        s.TierDiscountPercentage AS tierDiscountPercentage,
        s.TierDiscountAmount AS tierDiscountAmount,
        s.PointsUsed AS pointsUsed,
        s.PointsDiscount AS pointsDiscount,
        s.CustomerPayment AS customerPayment,
        s.PreviousDebt AS previousDebt,
        s.RemainingDebt AS remainingDebt,
        s.CreatedAt AS createdAt,
        s.UpdatedAt AS updatedAt
    FROM Sales s
    LEFT JOIN Customers c ON s.CustomerId = c.id
    WHERE s.Id = @id AND s.StoreId = @storeId;
    
    -- Return sale items
    SELECT 
        si.Id AS id,
        si.SalesTransactionId AS salesTransactionId,
        si.ProductId AS productId,
        p.name AS productName,
        u.Name AS unitName,
        si.Quantity AS quantity,
        si.Price AS price,
        (si.Quantity * si.Price) AS totalPrice,
        si.CreatedAt AS createdAt
    FROM SalesItems si
    LEFT JOIN Products p ON si.ProductId = p.id
    LEFT JOIN Units u ON p.unit_id = u.Id
    WHERE si.SalesTransactionId = @id
    ORDER BY si.CreatedAt ASC;
END
GO
