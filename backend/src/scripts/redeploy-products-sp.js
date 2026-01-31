/**
 * Script to redeploy sp_Products_Update stored procedure
 * Run with: node src/scripts/redeploy-products-sp.js
 */

const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'YourPassword123!',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'MilkTeaShopMultiTenant',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

async function redeploySP() {
  let pool;
  try {
    console.log('Connecting to database...');
    pool = await sql.connect(config);
    console.log('Connected!');

    // Drop and recreate sp_Products_Update
    console.log('Dropping existing sp_Products_Update...');
    await pool.request().query(`
      IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Products_Update')
          DROP PROCEDURE sp_Products_Update;
    `);

    console.log('Creating sp_Products_Update...');
    await pool.request().query(`
      CREATE PROCEDURE sp_Products_Update
          @id NVARCHAR(36),
          @storeId NVARCHAR(36),
          @categoryId NVARCHAR(36) = NULL,
          @name NVARCHAR(255) = NULL,
          @description NVARCHAR(MAX) = NULL,
          @price DECIMAL(18,2) = NULL,
          @costPrice DECIMAL(18,2) = NULL,
          @sku NVARCHAR(100) = NULL,
          @unitId NVARCHAR(36) = NULL,
          @stockQuantity DECIMAL(18,4) = NULL,
          @status NVARCHAR(20) = NULL,
          @images NVARCHAR(MAX) = NULL
      AS
      BEGIN
          SET NOCOUNT ON;

          -- Check if product exists
          IF NOT EXISTS (SELECT 1 FROM Products WHERE id = @id AND store_id = @storeId)
          BEGIN
              RAISERROR('Product not found', 16, 1);
              RETURN;
          END

          -- Update product with COALESCE for partial updates
          UPDATE Products SET
              category_id = COALESCE(@categoryId, category_id),
              name = COALESCE(@name, name),
              description = COALESCE(@description, description),
              price = COALESCE(@price, price),
              cost_price = COALESCE(@costPrice, cost_price),
              sku = COALESCE(@sku, sku),
              unit_id = COALESCE(@unitId, unit_id),
              stock_quantity = COALESCE(@stockQuantity, stock_quantity),
              status = COALESCE(@status, status),
              images = COALESCE(@images, images),
              updated_at = GETDATE()
          WHERE id = @id AND store_id = @storeId;

          -- Update ProductInventory if stockQuantity is provided
          IF @stockQuantity IS NOT NULL AND @unitId IS NOT NULL
          BEGIN
              IF EXISTS (SELECT 1 FROM ProductInventory WHERE ProductId = @id AND StoreId = @storeId AND UnitId = @unitId)
              BEGIN
                  UPDATE ProductInventory
                  SET Quantity = @stockQuantity, UpdatedAt = GETDATE()
                  WHERE ProductId = @id AND StoreId = @storeId AND UnitId = @unitId;
              END
              ELSE
              BEGIN
                  INSERT INTO ProductInventory (Id, ProductId, StoreId, UnitId, Quantity, CreatedAt, UpdatedAt)
                  VALUES (NEWID(), @id, @storeId, @unitId, @stockQuantity, GETDATE(), GETDATE());
              END
          END

          -- Return the updated product
          SELECT
              p.id,
              p.store_id AS storeId,
              p.category_id AS categoryId,
              p.name,
              p.description,
              p.price,
              p.cost_price AS costPrice,
              p.sku,
              p.unit_id AS unitId,
              p.stock_quantity AS stockQuantity,
              p.images,
              p.status,
              p.created_at AS createdAt,
              p.updated_at AS updatedAt,
              c.name AS categoryName,
              ISNULL(pi.Quantity, 0) AS currentStock
          FROM Products p
          LEFT JOIN Categories c ON p.category_id = c.id
          LEFT JOIN ProductInventory pi ON p.id = pi.ProductId AND pi.StoreId = @storeId
          WHERE p.id = @id AND p.store_id = @storeId;
      END
    `);

    console.log('sp_Products_Update created successfully!');

    // Test the SP
    console.log('\nTesting sp_Products_Update...');
    const testResult = await pool.request().query(`
      SELECT TOP 1 id, store_id, name, status FROM Products WHERE status != 'deleted'
    `);

    if (testResult.recordset.length > 0) {
      const product = testResult.recordset[0];
      console.log('Test product:', product.name, '- Current status:', product.status);

      // Test updating status only
      const updateResult = await pool.request()
        .input('id', sql.NVarChar(36), product.id)
        .input('storeId', sql.NVarChar(36), product.store_id)
        .input('status', sql.NVarChar(20), product.status === 'active' ? 'draft' : 'active')
        .execute('sp_Products_Update');

      console.log('Update result:', updateResult.recordset[0]?.status);

      // Revert the status
      await pool.request()
        .input('id', sql.NVarChar(36), product.id)
        .input('storeId', sql.NVarChar(36), product.store_id)
        .input('status', sql.NVarChar(20), product.status)
        .execute('sp_Products_Update');

      console.log('Reverted status back to:', product.status);
    }

    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

redeploySP();
