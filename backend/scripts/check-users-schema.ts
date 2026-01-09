import dotenv from 'dotenv';
dotenv.config();

import { query } from '../src/db';

async function checkSchema() {
  // Get columns of Users table
  const columns = await query<{ COLUMN_NAME: string; DATA_TYPE: string }>(
    `SELECT COLUMN_NAME, DATA_TYPE 
     FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_NAME = 'Users'
     ORDER BY ORDINAL_POSITION`
  );

  console.log('Users table columns:');
  columns.forEach((col) => {
    console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
  });

  // Get sample user
  const users = await query<Record<string, unknown>>(
    'SELECT TOP 1 * FROM Users'
  );

  if (users.length > 0) {
    console.log('\nSample user data:');
    console.log(users[0]);
  }

  process.exit(0);
}

checkSchema().catch(console.error);
