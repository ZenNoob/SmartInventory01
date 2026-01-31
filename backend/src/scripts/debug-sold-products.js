/**
 * Debug script to test sales and items endpoints for sold products report
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

async function debug() {
  let pool;
  try {
    pool = await sql.connect(config);

    const storeId = '59B9720A-FA71-4736-863B-7E0BFD4BBD07';

    // 1. Check if there are sales in the database
    console.log('=== 1. Checking Sales ===');
    const salesResult = await pool.request()
      .input('storeId', sql.NVarChar(36), storeId)
      .query(`
        SELECT TOP 10 id, invoice_number, transaction_date, final_amount, status
        FROM Sales
        WHERE store_id = @storeId
        ORDER BY transaction_date DESC
      `);

    console.log('Recent sales:', salesResult.recordset.length);
    salesResult.recordset.forEach(s => {
      console.log(`  ${s.invoice_number}: ${s.transaction_date} - ${s.final_amount} (${s.status})`);
    });

    // 2. Check sales in January 2026
    console.log('\n=== 2. Sales in January 2026 ===');
    const janSalesResult = await pool.request()
      .input('storeId', sql.NVarChar(36), storeId)
      .query(`
        SELECT id, invoice_number, transaction_date, final_amount, status
        FROM Sales
        WHERE store_id = @storeId
          AND transaction_date >= '2026-01-01'
          AND transaction_date < '2026-02-01'
        ORDER BY transaction_date DESC
      `);

    console.log('Sales in Jan 2026:', janSalesResult.recordset.length);
    janSalesResult.recordset.forEach(s => {
      console.log(`  ${s.invoice_number}: ${s.transaction_date} - ${s.final_amount}`);
    });

    // 3. Check SalesItems
    console.log('\n=== 3. Checking SalesItems ===');
    const itemsResult = await pool.request()
      .input('storeId', sql.NVarChar(36), storeId)
      .query(`
        SELECT TOP 10 si.id, si.sales_transaction_id, si.product_id, si.quantity, si.price, p.name as product_name
        FROM SalesItems si
        JOIN Sales s ON si.sales_transaction_id = s.id
        JOIN Products p ON si.product_id = p.id
        WHERE s.store_id = @storeId
        ORDER BY s.transaction_date DESC
      `);

    console.log('Recent sales items:', itemsResult.recordset.length);
    itemsResult.recordset.forEach(i => {
      console.log(`  ${i.product_name}: ${i.quantity} x ${i.price}`);
    });

    // 4. Check items for a specific sale
    if (salesResult.recordset.length > 0) {
      const saleId = salesResult.recordset[0].id;
      console.log(`\n=== 4. Items for sale ${salesResult.recordset[0].invoice_number} ===`);

      const saleItemsResult = await pool.request()
        .input('saleId', sql.NVarChar(36), saleId)
        .query(`
          SELECT si.id, si.product_id, si.quantity, si.price, p.name as product_name
          FROM SalesItems si
          JOIN Products p ON si.product_id = p.id
          WHERE si.sales_transaction_id = @saleId
        `);

      console.log('Items:', saleItemsResult.recordset.length);
      saleItemsResult.recordset.forEach(i => {
        console.log(`  ${i.product_name}: ${i.quantity} x ${i.price}`);
      });
    }

    // 5. Test sp_Sales_GetById
    if (salesResult.recordset.length > 0) {
      const saleId = salesResult.recordset[0].id;
      console.log(`\n=== 5. Testing sp_Sales_GetById ===`);

      const spResult = await pool.request()
        .input('id', sql.NVarChar(36), saleId)
        .input('storeId', sql.NVarChar(36), storeId)
        .execute('sp_Sales_GetById');

      console.log('Recordsets:', spResult.recordsets.length);
      if (spResult.recordsets.length > 1) {
        console.log('Items from SP:', spResult.recordsets[1]?.length || 0);
        spResult.recordsets[1]?.forEach(i => {
          console.log(`  ${i.product_name}: ${i.quantity} x ${i.price}`);
        });
      }
    }

    console.log('\n=== DEBUG COMPLETE ===');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (pool) await pool.close();
  }
}

debug();
