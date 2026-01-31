/**
 * Fix sp_Products_GetByStore to filter out deleted products
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

    // Drop existing SP
    console.log('Dropping existing sp_Products_GetByStore...');
    await pool.request().query(`
      IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Products_GetByStore')
          DROP PROCEDURE sp_Products_GetByStore;
    `);

    // Create new SP with deleted filter
    console.log('Creating sp_Products_GetByStore with deleted filter...');
    await pool.request().query(`
      CREATE PROCEDURE sp_Products_GetByStore
          @storeId NVARCHAR(36),
          @status NVARCHAR(20) = NULL,
          @categoryId NVARCHAR(36) = NULL,
          @searchTerm NVARCHAR(255) = NULL
      AS
      BEGIN
          SET NOCOUNT ON;

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
              ISNULL(pi.Quantity, p.stock_quantity) AS currentStock
          FROM Products p
          LEFT JOIN Categories c ON p.category_id = c.id
          LEFT JOIN ProductInventory pi ON p.id = pi.ProductId AND pi.StoreId = @storeId
          WHERE p.store_id = @storeId
              AND p.status != 'deleted'
              AND (@status IS NULL OR p.status = @status)
              AND (@categoryId IS NULL OR p.category_id = @categoryId)
              AND (@searchTerm IS NULL OR p.name LIKE '%' + @searchTerm + '%' OR p.sku LIKE '%' + @searchTerm + '%')
          ORDER BY p.updated_at DESC, p.created_at DESC;
      END
    `);

    console.log('sp_Products_GetByStore updated successfully!');

    // Verify
    const result = await pool.request().query(`SELECT COUNT(*) as cnt FROM Products WHERE status = 'deleted'`);
    console.log('Products with deleted status:', result.recordset[0].cnt);

    console.log('Done! Deleted products will no longer appear in the list.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (pool) await pool.close();
  }
}

fix();
