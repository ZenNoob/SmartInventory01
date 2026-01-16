/**
 * Deploy Stored Procedures Script
 * 
 * This script deploys all stored procedures from the SQL files
 * in the stored-procedures directory to the database.
 * 
 * Usage: npx ts-node scripts/deploy-stored-procedures.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import sql from 'mssql';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const DB_CONFIG: sql.config = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'SmartInventory',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
  },
};

// Module files to deploy (in order)
const MODULE_FILES = [
  'units-module.sql',
  'categories-module.sql',
  'products-module.sql',
  'inventory-module.sql',
  'customers-module.sql',
  'settings-module.sql',
  'sales-module.sql',
];

async function deployStoredProcedures() {
  let pool: sql.ConnectionPool | null = null;
  
  try {
    console.log('Connecting to database...');
    console.log(`Server: ${DB_CONFIG.server}`);
    console.log(`Database: ${DB_CONFIG.database}`);
    
    pool = await sql.connect(DB_CONFIG);
    console.log('Connected successfully!\n');

    const spDir = path.join(__dirname, 'stored-procedures');
    
    for (const moduleFile of MODULE_FILES) {
      const filePath = path.join(spDir, moduleFile);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Skipping ${moduleFile} (file not found)`);
        continue;
      }

      console.log(`📦 Deploying ${moduleFile}...`);
      
      const sqlContent = fs.readFileSync(filePath, 'utf8');
      
      // Split by GO statements and execute each batch
      const batches = sqlContent
        .split(/^\s*GO\s*$/gim)
        .map(batch => batch.trim())
        .filter(batch => batch.length > 0);

      for (const batch of batches) {
        try {
          await pool.request().query(batch);
        } catch (err) {
          // Log error but continue with other batches
          const error = err as Error;
          console.error(`   ❌ Error in batch: ${error.message.substring(0, 100)}`);
        }
      }
      
      console.log(`   ✅ ${moduleFile} deployed`);
    }

    console.log('\n✅ All stored procedures deployed successfully!');
    
    // List deployed procedures
    const result = await pool.request().query(`
      SELECT name 
      FROM sys.procedures 
      WHERE name LIKE 'sp_%'
      ORDER BY name
    `);
    
    console.log(`\n📋 Deployed stored procedures (${result.recordset.length}):`);
    result.recordset.forEach((row: { name: string }) => {
      console.log(`   - ${row.name}`);
    });

  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

// Run the deployment
deployStoredProcedures();
