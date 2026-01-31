/**
 * Fix sp_Inventory_Deduct to auto-create ProductInventory record from Products.stock_quantity
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

    console.log('Updating sp_Inventory_Deduct...');

    // Drop existing SP
    await pool.request().query(`
      IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Inventory_Deduct')
          DROP PROCEDURE sp_Inventory_Deduct;
    `);

    // Create new SP with auto-create logic
    await pool.request().query(`
      CREATE PROCEDURE sp_Inventory_Deduct
          @productId NVARCHAR(36),
          @storeId NVARCHAR(36),
          @unitId NVARCHAR(36),
          @quantity DECIMAL(18,4)
      AS
      BEGIN
          SET NOCOUNT ON;

          DECLARE @currentQty DECIMAL(18,4);
          DECLARE @productName NVARCHAR(255);
          DECLARE @productStockQty DECIMAL(18,4);
          DECLARE @inventoryExists BIT = 0;

          BEGIN TRY
              BEGIN TRANSACTION;

              -- Get product info
              SELECT
                  @productName = name,
                  @productStockQty = ISNULL(stock_quantity, 0)
              FROM Products
              WHERE id = @productId AND store_id = @storeId;

              IF @productName IS NULL
              BEGIN
                  RAISERROR('Product not found', 16, 1);
                  RETURN;
              END

              -- Check if ProductInventory record exists
              SELECT @currentQty = Quantity, @inventoryExists = 1
              FROM ProductInventory
              WHERE ProductId = @productId
                  AND StoreId = @storeId
                  AND UnitId = @unitId;

              -- If no ProductInventory record, create one from Products.stock_quantity
              IF @inventoryExists = 0 OR @currentQty IS NULL
              BEGIN
                  SET @currentQty = @productStockQty;

                  -- Create ProductInventory record
                  INSERT INTO ProductInventory (Id, ProductId, StoreId, UnitId, Quantity, CreatedAt, UpdatedAt)
                  VALUES (NEWID(), @productId, @storeId, @unitId, @currentQty, GETDATE(), GETDATE());

                  SET @inventoryExists = 1;
              END

              -- Validate stock availability
              IF @currentQty < @quantity
              BEGIN
                  DECLARE @errorMsg NVARCHAR(500);
                  SET @errorMsg = 'Insufficient stock for product "' + ISNULL(@productName, 'Unknown') +
                                 '". Available: ' + CAST(@currentQty AS NVARCHAR(20)) +
                                 ', Requested: ' + CAST(@quantity AS NVARCHAR(20));
                  RAISERROR(@errorMsg, 16, 1);
                  RETURN;
              END

              -- Deduct quantity from ProductInventory
              UPDATE ProductInventory
              SET Quantity = Quantity - @quantity,
                  UpdatedAt = GETDATE()
              WHERE ProductId = @productId
                  AND StoreId = @storeId
                  AND UnitId = @unitId;

              -- Also update Products.stock_quantity to keep in sync
              UPDATE Products
              SET stock_quantity = stock_quantity - @quantity,
                  updated_at = GETDATE()
              WHERE id = @productId AND store_id = @storeId;

              COMMIT TRANSACTION;

              -- Return new quantity
              SELECT
                  pi.Quantity AS quantity,
                  @productName AS productName
              FROM ProductInventory pi
              WHERE pi.ProductId = @productId
                  AND pi.StoreId = @storeId
                  AND pi.UnitId = @unitId;
          END TRY
          BEGIN CATCH
              IF @@TRANCOUNT > 0
                  ROLLBACK TRANSACTION;

              DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
              RAISERROR(@ErrorMessage, 16, 1);
          END CATCH
      END
    `);

    console.log('sp_Inventory_Deduct updated successfully!');
    console.log('Now auto-creates ProductInventory record from Products.stock_quantity if not exists.');

    // Test
    console.log('\n=== Testing ===');
    const testProduct = await pool.request().query(`
      SELECT TOP 1 p.id, p.name, p.stock_quantity, p.store_id, p.unit_id
      FROM Products p
      WHERE p.stock_quantity > 0
        AND p.status = 'active'
        AND NOT EXISTS (
          SELECT 1 FROM ProductInventory pi
          WHERE pi.ProductId = p.id AND pi.StoreId = p.store_id
        )
    `);

    if (testProduct.recordset.length > 0) {
      const p = testProduct.recordset[0];
      console.log('Test product:', p.name, '- Stock:', p.stock_quantity);
      console.log('This product has no ProductInventory record but will work now.');
    } else {
      console.log('No products without ProductInventory record to test.');
    }

    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (pool) await pool.close();
  }
}

fix();
