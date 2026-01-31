/**
 * Debug script - check if SP returns shiftId correctly with larger page size
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

async function check() {
  let pool;
  try {
    pool = await sql.connect(config);

    const storeId = '59B9720A-FA71-4736-863B-7E0BFD4BBD07';

    // Call SP with large page size
    console.log('=== Calling sp_Sales_GetByStore with pageSize=1000 ===');
    const result = await pool.request()
      .input('storeId', sql.NVarChar(36), storeId)
      .input('startDate', sql.DateTime, null)
      .input('endDate', sql.DateTime, null)
      .input('customerId', sql.NVarChar(36), null)
      .input('status', sql.NVarChar(20), null)
      .input('page', sql.Int, 1)
      .input('pageSize', sql.Int, 1000)
      .execute('sp_Sales_GetByStore');

    const sales = result.recordsets[1] || [];
    console.log('Total sales returned:', sales.length);

    // Check sales with shiftId
    const salesWithShift = sales.filter(s => s.shiftId);
    console.log('Sales with shiftId:', salesWithShift.length);

    if (salesWithShift.length > 0) {
      console.log('\nExamples with shiftId:');
      salesWithShift.slice(0, 5).forEach(s => {
        console.log(`  ${s.invoiceNumber}: ${s.shiftId}`);
      });
    } else {
      // Check a raw query
      console.log('\n=== Raw query check ===');
      const rawSales = await pool.request()
        .input('storeId', sql.NVarChar(36), storeId)
        .query(`
          SELECT TOP 10 id, invoice_number, shift_id
          FROM Sales
          WHERE store_id = @storeId AND shift_id IS NOT NULL
          ORDER BY transaction_date DESC
        `);
      console.log('Raw sales with shift_id:', rawSales.recordset.length);
      rawSales.recordset.forEach(s => {
        console.log(`  ${s.invoice_number}: ${s.shift_id}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (pool) await pool.close();
  }
}

check();
