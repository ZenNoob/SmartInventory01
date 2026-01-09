import sql from 'mssql';

function getConfig(): sql.config {
  return {
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'SmartInventory',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT || '1433'),
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
    connectionTimeout: 30000,
    requestTimeout: 30000,
  };
}

let pool: sql.ConnectionPool | null = null;
let connectionRetries = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000;

/**
 * Get or create a connection pool to SQL Server
 */
export async function getConnection(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) {
    return pool;
  }

  const config = getConfig();
  console.log('Connecting to database:', config.server, config.database);

  try {
    pool = await sql.connect(config);
    connectionRetries = 0;
    console.log('✅ Connected to SQL Server');
    return pool;
  } catch (error) {
    connectionRetries++;

    if (connectionRetries < MAX_RETRIES) {
      console.error(
        `Database connection failed. Retrying in ${RETRY_DELAY / 1000}s... (Attempt ${connectionRetries}/${MAX_RETRIES})`
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      return getConnection();
    }

    connectionRetries = 0;
    throw new Error(
      `Failed to connect to database after ${MAX_RETRIES} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Close the connection pool
 */
export async function closeConnection(): Promise<void> {
  if (pool) {
    await pool.close();
    pool = null;
  }
}

export { sql };
