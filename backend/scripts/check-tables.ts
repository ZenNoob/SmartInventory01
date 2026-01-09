import dotenv from 'dotenv';
dotenv.config();

import { query } from '../src/db';

async function run() {
  const tables = await query<{ TABLE_NAME: string }>(
    "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME"
  );
  console.log('Tables in database:');
  tables.forEach((t) => console.log('  -', t.TABLE_NAME));
  process.exit(0);
}

run().catch(console.error);
