/**
 * Debug script to check what the sales API returns
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

    // Check what sp_Sales_GetByStore returns
    console.log('=== Checking sp_Sales_GetByStore ===');
    const result = await pool.request()
      .input('storeId', sql.NVarChar(36), storeId)
      .input('startDate', sql.DateTime, null)
      .input('endDate', sql.DateTime, null)
      .input('customerId', sql.NVarChar(36), null)
      .input('status', sql.NVarChar(20), null)
      .execute('sp_Sales_GetByStore');

    console.log('Recordsets count:', result.recordsets.length);
    console.log('First recordset (count):', result.recordsets[0]);

    if (result.recordsets[1] && result.recordsets[1].length > 0) {
      const firstSale = result.recordsets[1][0];
      console.log('\nFirst sale columns:', Object.keys(firstSale));
      console.log('\nFirst sale shiftId:', firstSale.shiftId);
      console.log('First sale shift_id:', firstSale.shift_id);

      // Check sales with shift_id
      const salesWithShift = result.recordsets[1].filter(s => s.shiftId || s.shift_id);
      console.log('\nSales with shiftId:', salesWithShift.length);

      if (salesWithShift.length > 0) {
        console.log('Example:', {
          invoiceNumber: salesWithShift[0].invoiceNumber,
          shiftId: salesWithShift[0].shiftId,
          shift_id: salesWithShift[0].shift_id
        });
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (pool) await pool.close();
  }
}

check();
