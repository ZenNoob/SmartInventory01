/**
 * Debug script to check actual column names from SP
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

    // Get a sale ID first
    const salesResult = await pool.request()
      .input('storeId', sql.NVarChar(36), storeId)
      .query(`SELECT TOP 1 id FROM Sales WHERE store_id = @storeId ORDER BY transaction_date DESC`);

    if (salesResult.recordset.length === 0) {
      console.log('No sales found');
      return;
    }

    const saleId = salesResult.recordset[0].id;
    console.log('Testing with sale ID:', saleId);

    // Call SP
    const spResult = await pool.request()
      .input('id', sql.NVarChar(36), saleId)
      .input('storeId', sql.NVarChar(36), storeId)
      .execute('sp_Sales_GetById');

    console.log('\n=== SP Result Recordsets ===');
    console.log('Number of recordsets:', spResult.recordsets.length);

    // Check items recordset (second one)
    if (spResult.recordsets.length > 1) {
      const items = spResult.recordsets[1];
      console.log('\n=== Items Recordset ===');
      console.log('Number of items:', items.length);

      if (items.length > 0) {
        console.log('\n=== First Item - All Keys ===');
        console.log('Keys:', Object.keys(items[0]));
        console.log('\n=== First Item - Full Object ===');
        console.log(JSON.stringify(items[0], null, 2));
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
