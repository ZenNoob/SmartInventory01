/**
 * Check SP definition in database
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

    // Get SP definition
    console.log('=== sp_Sales_GetByStore Definition ===');
    const spDef = await pool.request().query(`
      SELECT OBJECT_DEFINITION(OBJECT_ID('sp_Sales_GetByStore')) AS definition
    `);

    const def = spDef.recordset[0]?.definition;
    if (def) {
      // Find the SELECT part
      const selectMatch = def.match(/SELECT[\s\S]*?FROM Sales/i);
      if (selectMatch) {
        console.log('SELECT clause:');
        console.log(selectMatch[0]);
      }

      // Check if ShiftId or shift_id is in the SP
      if (def.includes('ShiftId') || def.includes('shiftId') || def.includes('shift_id')) {
        console.log('\nContains shift column reference: YES');
        const shiftLines = def.split('\n').filter(line =>
          line.toLowerCase().includes('shift')
        );
        shiftLines.forEach(line => console.log('  ' + line.trim()));
      } else {
        console.log('\nContains shift column reference: NO');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (pool) await pool.close();
  }
}

check();
