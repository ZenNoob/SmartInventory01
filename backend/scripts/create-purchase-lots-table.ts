import dotenv from 'dotenv';
dotenv.config();

import { query } from '../src/db';

async function run() {
  console.log('Creating PurchaseLots table...');

  try {
    // Check if table exists
    const exists = await query<{ name: string }>(
      `SELECT name FROM sys.tables WHERE name = 'PurchaseLots'`
    );

    if (exists.length > 0) {
      console.log('✅ PurchaseLots table already exists');
      process.exit(0);
    }

    // Create PurchaseLots table
    await query(`
      CREATE TABLE PurchaseLots (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        product_id UNIQUEIDENTIFIER NOT NULL,
        store_id UNIQUEIDENTIFIER NOT NULL,
        import_date DATETIME2 NOT NULL,
        quantity DECIMAL(18,2) NOT NULL,
        remaining_quantity DECIMAL(18,2) NOT NULL,
        cost DECIMAL(18,2) NOT NULL,
        unit_id UNIQUEIDENTIFIER NOT NULL,
        purchase_order_id UNIQUEIDENTIFIER NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        
        CONSTRAINT FK_PurchaseLots_Products FOREIGN KEY (product_id) REFERENCES Products(id),
        CONSTRAINT FK_PurchaseLots_Stores FOREIGN KEY (store_id) REFERENCES Stores(id),
        CONSTRAINT FK_PurchaseLots_Units FOREIGN KEY (unit_id) REFERENCES Units(id),
        CONSTRAINT FK_PurchaseLots_PurchaseOrders FOREIGN KEY (purchase_order_id) REFERENCES PurchaseOrders(id)
      )
    `);

    console.log('✅ PurchaseLots table created successfully');

    // Create indexes
    await query(`CREATE INDEX IX_PurchaseLots_ProductId ON PurchaseLots(product_id)`);
    await query(`CREATE INDEX IX_PurchaseLots_StoreId ON PurchaseLots(store_id)`);
    await query(`CREATE INDEX IX_PurchaseLots_PurchaseOrderId ON PurchaseLots(purchase_order_id)`);

    console.log('✅ Indexes created successfully');

  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

run().catch(console.error);
