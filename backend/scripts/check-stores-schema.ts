import dotenv from 'dotenv';
dotenv.config();

import { query } from '../src/db';

async function run() {
  const cols = await query<{ COLUMN_NAME: string }>(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Stores'"
  );
  console.log('Stores columns:', cols.map((c) => c.COLUMN_NAME));

  const sample = await query('SELECT TOP 1 * FROM Stores');
  console.log('Sample store:', sample[0]);

  process.exit(0);
}

run().catch(console.error);
