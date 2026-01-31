/**
 * Base Repository for Stored Procedures
 *
 * Provides methods to execute stored procedures with proper parameter binding
 * and support for multiple result sets.
 */

import sql from 'mssql';
import { getConnection } from '../db/connection';
import { withTransaction } from '../db/transaction';

export type SPParamValue = string | number | boolean | Date | Buffer | null | undefined;
export type SPParams = Record<string, SPParamValue | unknown>;

// UUID regex pattern for detecting UUID strings
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Check if a value is a valid UUID string
 */
function isUUID(value: unknown): boolean {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

/**
 * Bind a parameter with proper SQL type detection
 */
function bindParameter(request: sql.Request, key: string, value: unknown): void {
  if (value === null || value === undefined) {
    request.input(key, value);
  } else if (isUUID(value)) {
    // Explicitly bind UUID strings as UniqueIdentifier
    request.input(key, sql.UniqueIdentifier, value);
  } else if (typeof value === 'number') {
    // Check if it's a decimal/float or integer
    if (Number.isInteger(value)) {
      request.input(key, sql.Int, value);
    } else {
      request.input(key, sql.Decimal(18, 6), value);
    }
  } else if (typeof value === 'boolean') {
    request.input(key, sql.Bit, value);
  } else if (value instanceof Date) {
    request.input(key, sql.DateTime2, value);
  } else {
    // Default: let mssql infer the type
    request.input(key, value);
  }
}

/**
 * Result from stored procedure execution with multiple result sets
 */
export interface SPMultipleResults<T = Record<string, unknown>> {
  recordsets: T[][];
  recordset: T[];
  rowsAffected: number[];
  output: Record<string, unknown>;
}

/**
 * Base repository class for stored procedure operations
 * Provides executeSP and executeSPSingle methods with proper SQL Server parameter binding
 */
export abstract class SPBaseRepository<T = Record<string, unknown>> {
  protected abstract tableName: string;

  /**
   * Execute a stored procedure and return all results
   * Handles parameter binding for SQL Server
   * 
   * @param spName - Name of the stored procedure (e.g., 'sp_Products_Create')
   * @param params - Parameters to pass to the stored procedure
   * @returns Array of results from the stored procedure
   */
  protected async executeSP<R = T>(
    spName: string,
    params?: SPParams
  ): Promise<R[]> {
    const conn = await getConnection();
    const request = conn.request();

    // Bind parameters
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          bindParameter(request, key, value);
        }
      }
    }

    const result = await request.execute(spName);
    return result.recordset as R[];
  }

  /**
   * Execute a stored procedure and return a single result
   * 
   * @param spName - Name of the stored procedure
   * @param params - Parameters to pass to the stored procedure
   * @returns Single result or null if no results
   */
  protected async executeSPSingle<R = T>(
    spName: string,
    params?: SPParams
  ): Promise<R | null> {
    const results = await this.executeSP<R>(spName, params);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Execute a stored procedure and return multiple result sets
   * Useful for procedures that return related data (e.g., sale with items)
   * 
   * @param spName - Name of the stored procedure
   * @param params - Parameters to pass to the stored procedure
   * @returns Object containing all result sets and metadata
   */
  protected async executeSPMultiple<R = T>(
    spName: string,
    params?: SPParams
  ): Promise<SPMultipleResults<R>> {
    const conn = await getConnection();
    const request = conn.request();

    // Bind parameters
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          bindParameter(request, key, value);
        }
      }
    }

    const result = await request.execute(spName);
    
    return {
      recordsets: result.recordsets as R[][],
      recordset: result.recordset as R[],
      rowsAffected: result.rowsAffected,
      output: result.output,
    };
  }

  /**
   * Execute a stored procedure within a transaction
   * 
   * @param transaction - SQL Server transaction object
   * @param spName - Name of the stored procedure
   * @param params - Parameters to pass to the stored procedure
   * @returns Array of results from the stored procedure
   */
  protected async executeSPInTransaction<R = T>(
    transaction: sql.Transaction,
    spName: string,
    params?: SPParams
  ): Promise<R[]> {
    const request = new sql.Request(transaction);

    // Bind parameters
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          bindParameter(request, key, value);
        }
      }
    }

    const result = await request.execute(spName);
    return result.recordset as R[];
  }

  /**
   * Execute a stored procedure within a transaction and return single result
   * 
   * @param transaction - SQL Server transaction object
   * @param spName - Name of the stored procedure
   * @param params - Parameters to pass to the stored procedure
   * @returns Single result or null if no results
   */
  protected async executeSPSingleInTransaction<R = T>(
    transaction: sql.Transaction,
    spName: string,
    params?: SPParams
  ): Promise<R | null> {
    const results = await this.executeSPInTransaction<R>(transaction, spName, params);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Execute multiple stored procedures within a single transaction
   * Automatically commits on success or rolls back on error
   * 
   * @param callback - Function that receives transaction and executes SPs
   * @returns Result from the callback function
   */
  protected async withSPTransaction<R>(
    callback: (helpers: SPTransactionHelpers) => Promise<R>
  ): Promise<R> {
    return withTransaction(async (transaction) => {
      const helpers: SPTransactionHelpers = {
        executeSP: <T>(spName: string, params?: SPParams) => 
          this.executeSPInTransaction<T>(transaction, spName, params),
        executeSPSingle: <T>(spName: string, params?: SPParams) => 
          this.executeSPSingleInTransaction<T>(transaction, spName, params),
        executeSPMultiple: async <T>(spName: string, params?: SPParams) => {
          const request = new sql.Request(transaction);
          if (params) {
            for (const [key, value] of Object.entries(params)) {
              if (value !== undefined) {
                request.input(key, value);
              }
            }
          }
          const result = await request.execute(spName);
          return {
            recordsets: result.recordsets as T[][],
            recordset: result.recordset as T[],
            rowsAffected: result.rowsAffected,
            output: result.output,
          } as SPMultipleResults<T>;
        },
        transaction,
      };
      return callback(helpers);
    });
  }
}

/**
 * Helper functions available within SP transactions
 */
export interface SPTransactionHelpers {
  executeSP: <T = Record<string, unknown>>(spName: string, params?: SPParams) => Promise<T[]>;
  executeSPSingle: <T = Record<string, unknown>>(spName: string, params?: SPParams) => Promise<T | null>;
  executeSPMultiple: <T = Record<string, unknown>>(spName: string, params?: SPParams) => Promise<SPMultipleResults<T>>;
  transaction: sql.Transaction;
}
