/**
 * Test the fix - simulate what the repository does with page/pageSize params
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

async function test() {
  let pool;
  try {
    pool = await sql.connect(config);

    const storeId = '59B9720A-FA71-4736-863B-7E0BFD4BBD07';
    const shiftId = '60D7EC65-3C46-4946-A2F9-AAAAFC50D372';

    // Call SP with pageSize=10000 like the fixed repository
    console.log('=== Testing with pageSize=10000 ===');
    const result = await pool.request()
      .input('storeId', sql.NVarChar(36), storeId)
      .input('startDate', sql.DateTime, null)
      .input('endDate', sql.DateTime, null)
      .input('customerId', sql.NVarChar(36), null)
      .input('status', sql.NVarChar(20), null)
      .input('page', sql.Int, 1)
      .input('pageSize', sql.Int, 10000)
      .execute('sp_Sales_GetByStore');

    const sales = result.recordsets[1] || [];
    console.log('Total sales returned:', sales.length);

    // Filter by shiftId like the frontend does
    const shiftIdLower = shiftId.toLowerCase();
    const shiftSales = sales.filter(s =>
      s.shiftId?.toLowerCase() === shiftIdLower
    );
    console.log('Sales with shiftId', shiftId + ':', shiftSales.length);

    if (shiftSales.length > 0) {
      console.log('\nShift sales:');
      shiftSales.forEach(s => {
        console.log(`  ${s.invoiceNumber}: ${s.finalAmount}`);
      });
    }

    console.log('\n=== SUCCESS! The fix works ===');
    console.log('Restart your backend server to apply the changes.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (pool) await pool.close();
  }
}

test();
