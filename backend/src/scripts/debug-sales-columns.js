/**
 * Debug script to check Sales table structure and shift_id column
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

    // Check Sales table columns
    console.log('=== Sales Table Columns ===');
    const columns = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Sales'
      ORDER BY ORDINAL_POSITION
    `);
    columns.recordset.forEach(c => console.log(`  ${c.COLUMN_NAME} (${c.DATA_TYPE})`));

    // Check if shift_id has values
    console.log('\n=== Sales with shift_id values ===');
    const salesWithShift = await pool.request().query(`
      SELECT TOP 5 id, invoice_number, shift_id
      FROM Sales
      WHERE shift_id IS NOT NULL
      ORDER BY transaction_date DESC
    `);
    console.log('Found:', salesWithShift.recordset.length);
    salesWithShift.recordset.forEach(s => {
      console.log(`  ${s.invoice_number}: ${s.shift_id}`);
    });

    // Check direct query with both column names
    console.log('\n=== Direct query test ===');
    const directQuery = await pool.request().query(`
      SELECT TOP 1
        shift_id as shift_id_snake,
        CASE WHEN shift_id IS NOT NULL THEN 'has value' ELSE 'null' END as has_shift
      FROM Sales
      WHERE shift_id IS NOT NULL
    `);
    console.log('Direct query result:', directQuery.recordset[0]);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (pool) await pool.close();
  }
}

check();
