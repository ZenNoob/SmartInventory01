import dotenv from 'dotenv';
dotenv.config();

import { query } from '../src/db';

async function run() {
  const cols = await query<{ COLUMN_NAME: string; DATA_TYPE: string }>(
    `SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Customers' ORDER BY ORDINAL_POSITION`
  );
  console.log('Customers table columns:');
  cols.forEach((c) => console.log('  -', c.COLUMN_NAME, '(' + c.DATA_TYPE + ')'));
  process.exit(0);
}

run().catch(console.error);
