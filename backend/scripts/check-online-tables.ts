import dotenv from 'dotenv';
dotenv.config();

import { query } from '../src/db';

async function run() {
  const tables = [
    'OnlineStores',
    'OnlineProducts',
    'OnlineCustomers',
    'OnlineOrders',
    'OnlineOrderItems',
    'ShoppingCarts',
    'CartItems',
    'ShippingZones',
    'PurchaseLots',
  ];

  for (const table of tables) {
    const cols = await query<{ COLUMN_NAME: string; DATA_TYPE: string }>(
      `SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = @table ORDER BY ORDINAL_POSITION`,
      { table }
    );

    if (cols.length === 0) {
      console.log(`\n❌ ${table}: NOT FOUND`);
    } else {
      console.log(`\n✅ ${table}:`);
      cols.forEach((c) => console.log(`   - ${c.COLUMN_NAME} (${c.DATA_TYPE})`));
    }
  }

  process.exit(0);
}

run().catch(console.error);
