/**
 * Fix sp_Inventory_GetAvailable to fallback to Products.stock_quantity
 */
const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'YourPassword123!',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'MilkTeaShopMultiTenant',
  options: { encrypt: false, trustServerCertificate: true },
};

async function fix() {
  let pool;
  try {
    console.log('Connecting...');
    pool = await sql.connect(config);

    // Check current data
    console.log('\n=== Current Data Check ===');

    // Check products with stock_quantity but no ProductInventory record
    const missingInventory = await pool.request().query(`
      SELECT p.id, p.name, p.stock_quantity, p.store_id, p.unit_id
      FROM Products p
      WHERE p.stock_quantity > 0
        AND p.status != 'deleted'
        AND NOT EXISTS (
          SELECT 1 FROM ProductInventory pi
          WHERE pi.ProductId = p.id AND pi.StoreId = p.store_id
        )
    `);
    console.log('Products with stock but no ProductInventory record:', missingInventory.recordset.length);
    if (missingInventory.recordset.length > 0) {
      console.log('Examples:', missingInventory.recordset.slice(0, 5).map(p => `${p.name}: ${p.stock_quantity}`));
    }

    // Drop and recreate SP with fallback logic
    console.log('\n=== Updating sp_Inventory_GetAvailable ===');
    await pool.request().query(`
      IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Inventory_GetAvailable')
          DROP PROCEDURE sp_Inventory_GetAvailable;
    `);

    await pool.request().query(`
      CREATE PROCEDURE sp_Inventory_GetAvailable
          @productId NVARCHAR(36),
          @storeId NVARCHAR(36),
          @unitId NVARCHAR(36)
      AS
      BEGIN
          SET NOCOUNT ON;

          DECLARE @quantity DECIMAL(18,4) = 0;
          DECLARE @productName NVARCHAR(255);
          DECLARE @unitName NVARCHAR(100);

          -- Get product name
          SELECT @productName = name FROM Products WHERE id = @productId;

          -- Get unit name
          SELECT @unitName = name FROM Units WHERE id = @unitId;

          -- First try to get from ProductInventory
          SELECT @quantity = ISNULL(pi.Quantity, 0)
          FROM ProductInventory pi
          WHERE pi.ProductId = @productId
              AND pi.StoreId = @storeId
              AND pi.UnitId = @unitId;

          -- If no ProductInventory record found, fallback to Products.stock_quantity
          IF @quantity = 0 OR @quantity IS NULL
          BEGIN
              SELECT @quantity = ISNULL(p.stock_quantity, 0)
              FROM Products p
              WHERE p.id = @productId
                  AND p.store_id = @storeId;
          END

          -- Return result
          SELECT
              @productId AS productId,
              @storeId AS storeId,
              @unitId AS unitId,
              @quantity AS availableQuantity,
              @productName AS productName,
              @unitName AS unitName;
      END
    `);

    console.log('sp_Inventory_GetAvailable updated with fallback logic!');

    // Test the fix
    console.log('\n=== Testing the fix ===');
    if (missingInventory.recordset.length > 0) {
      const testProduct = missingInventory.recordset[0];
      console.log('Testing product:', testProduct.name);

      const testResult = await pool.request()
        .input('productId', sql.NVarChar(36), testProduct.id)
        .input('storeId', sql.NVarChar(36), testProduct.store_id)
        .input('unitId', sql.NVarChar(36), testProduct.unit_id || '00000000-0000-0000-0000-000000000000')
        .execute('sp_Inventory_GetAvailable');

      console.log('Result:', testResult.recordset[0]);
      console.log('Expected stock_quantity:', testProduct.stock_quantity);
    }

    console.log('\nDone! Products will now use stock_quantity as fallback.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (pool) await pool.close();
  }
}

fix();
