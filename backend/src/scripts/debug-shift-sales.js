/**
 * Debug script to check shift sales data
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

    const shiftId = '60D7EC65-3C46-4946-A2F9-AAAAFC50D372';

    // Check shift structure
    const columns = await pool.request().query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Shifts'
    `);
    console.log('Shifts columns:', columns.recordset.map(c => c.COLUMN_NAME).join(', '));

    // Check shift
    const shift = await pool.request()
      .input('shiftId', sql.NVarChar(36), shiftId)
      .query(`
        SELECT *
        FROM Shifts
        WHERE id = @shiftId
      `);
    console.log('Shift:', shift.recordset[0]);

    // Check sales with this shift_id
    const sales = await pool.request()
      .input('shiftId', sql.NVarChar(36), shiftId)
      .query(`
        SELECT TOP 10 id, invoice_number, shift_id, final_amount, transaction_date
        FROM Sales
        WHERE shift_id = @shiftId
        ORDER BY transaction_date DESC
      `);
    console.log('\nSales with this shift_id:', sales.recordset.length);
    sales.recordset.forEach(s => {
      console.log(`  - ${s.invoice_number}: ${s.final_amount}`);
    });

    // Check any sales with non-null shift_id
    const anySales = await pool.request().query(`
      SELECT TOP 5 id, invoice_number, shift_id
      FROM Sales
      WHERE shift_id IS NOT NULL
      ORDER BY transaction_date DESC
    `);
    console.log('\nAny sales with shift_id:', anySales.recordset.length);
    anySales.recordset.forEach(s => {
      console.log(`  - ${s.invoice_number}: shift_id=${s.shift_id}`);
    });

    // Count total sales by shift
    const countByShift = await pool.request().query(`
      SELECT shift_id, COUNT(*) as cnt, SUM(final_amount) as total
      FROM Sales
      WHERE shift_id IS NOT NULL
      GROUP BY shift_id
      ORDER BY cnt DESC
    `);
    console.log('\nSales count by shift:');
    countByShift.recordset.forEach(s => {
      console.log(`  - ${s.shift_id}: ${s.cnt} orders, total: ${s.total}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (pool) await pool.close();
  }
}

check();
