const sql = require('mssql');
require('dotenv').config();

const dropSP = `
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Customers_GetDebtHistory')
    DROP PROCEDURE sp_Customers_GetDebtHistory;
`;

const createSP = `
CREATE PROCEDURE sp_Customers_GetDebtHistory
    @customerId NVARCHAR(36),
    @storeId NVARCHAR(36)
AS
BEGIN
    SET NOCOUNT ON;

    -- Check if customer exists
    IF NOT EXISTS (SELECT 1 FROM Customers WHERE id = @customerId AND store_id = @storeId)
    BEGIN
        RAISERROR('Customer not found', 16, 1);
        RETURN;
    END

    -- Return combined history of Sales (debt) and Payments
    SELECT * FROM (
        -- Sales transactions (debt additions)
        SELECT
            s.id AS id,
            @customerId AS customerId,
            s.final_amount AS amount,
            'sale' AS type,
            s.transaction_date AS date,
            CONCAT(N'Hóa đơn #', s.invoice_number) AS description,
            s.remaining_debt AS remainingDebt,
            s.created_at AS createdAt
        FROM Sales s
        WHERE s.customer_id = @customerId
            AND s.store_id = @storeId
            AND s.status IN ('completed', 'pending')

        UNION ALL

        -- Payments (debt reductions) - using snake_case column names
        SELECT
            p.id AS id,
            @customerId AS customerId,
            p.amount AS amount,
            'payment' AS type,
            p.payment_date AS date,
            ISNULL(p.notes, N'Thanh toán công nợ') AS description,
            NULL AS remainingDebt,
            p.created_at AS createdAt
        FROM Payments p
        WHERE p.customer_id = @customerId
            AND p.store_id = @storeId
    ) AS history
    ORDER BY date ASC, createdAt ASC;
END
`;

async function createStoredProcedure() {
  try {
    console.log('Connecting to database...');
    const pool = await sql.connect({
      server: process.env.DB_SERVER || 'localhost',
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      options: { encrypt: false, trustServerCertificate: true }
    });

    console.log('Dropping existing SP if any...');
    await pool.request().query(dropSP);

    console.log('Creating sp_Customers_GetDebtHistory...');
    await pool.request().query(createSP);
    console.log('Created sp_Customers_GetDebtHistory successfully!');

    // Verify
    const check = await pool.request().query("SELECT name FROM sys.objects WHERE type = 'P' AND name = 'sp_Customers_GetDebtHistory'");
    console.log('SP exists now:', check.recordset.length > 0);

    await pool.close();
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
}

createStoredProcedure();
