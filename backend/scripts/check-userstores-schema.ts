import dotenv from 'dotenv';
dotenv.config();

import { query } from '../src/db';

async function run() {
  // UserStores columns
  const userStoresCols = await query<{ COLUMN_NAME: string }>(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'UserStores'"
  );
  console.log('UserStores columns:', userStoresCols.map((c) => c.COLUMN_NAME));

  // Sessions columns
  const sessionsCols = await query<{ COLUMN_NAME: string }>(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Sessions'"
  );
  console.log('Sessions columns:', sessionsCols.map((c) => c.COLUMN_NAME));

  process.exit(0);
}

run().catch(console.error);
