"use strict";
/**
 * Base Repository for Stored Procedures
 *
 * Provides methods to execute stored procedures with proper parameter binding
 * and support for multiple result sets.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SPBaseRepository = void 0;
const mssql_1 = __importDefault(require("mssql"));
const connection_1 = require("../db/connection");
const transaction_1 = require("../db/transaction");
/**
 * Base repository class for stored procedure operations
 * Provides executeSP and executeSPSingle methods with proper SQL Server parameter binding
 */
class SPBaseRepository {
    /**
     * Execute a stored procedure and return all results
     * Handles parameter binding for SQL Server
     *
     * @param spName - Name of the stored procedure (e.g., 'sp_Products_Create')
     * @param params - Parameters to pass to the stored procedure
     * @returns Array of results from the stored procedure
     */
    async executeSP(spName, params) {
        const conn = await (0, connection_1.getConnection)();
        const request = conn.request();
        // Bind parameters
        if (params) {
            for (const [key, value] of Object.entries(params)) {
                if (value !== undefined) {
                    request.input(key, value);
                }
            }
        }
        const result = await request.execute(spName);
        return result.recordset;
    }
    /**
     * Execute a stored procedure and return a single result
     *
     * @param spName - Name of the stored procedure
     * @param params - Parameters to pass to the stored procedure
     * @returns Single result or null if no results
     */
    async executeSPSingle(spName, params) {
        const results = await this.executeSP(spName, params);
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
    async executeSPMultiple(spName, params) {
        const conn = await (0, connection_1.getConnection)();
        const request = conn.request();
        // Bind parameters
        if (params) {
            for (const [key, value] of Object.entries(params)) {
                if (value !== undefined) {
                    request.input(key, value);
                }
            }
        }
        const result = await request.execute(spName);
        return {
            recordsets: result.recordsets,
            recordset: result.recordset,
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
    async executeSPInTransaction(transaction, spName, params) {
        const request = new mssql_1.default.Request(transaction);
        // Bind parameters
        if (params) {
            for (const [key, value] of Object.entries(params)) {
                if (value !== undefined) {
                    request.input(key, value);
                }
            }
        }
        const result = await request.execute(spName);
        return result.recordset;
    }
    /**
     * Execute a stored procedure within a transaction and return single result
     *
     * @param transaction - SQL Server transaction object
     * @param spName - Name of the stored procedure
     * @param params - Parameters to pass to the stored procedure
     * @returns Single result or null if no results
     */
    async executeSPSingleInTransaction(transaction, spName, params) {
        const results = await this.executeSPInTransaction(transaction, spName, params);
        return results.length > 0 ? results[0] : null;
    }
    /**
     * Execute multiple stored procedures within a single transaction
     * Automatically commits on success or rolls back on error
     *
     * @param callback - Function that receives transaction and executes SPs
     * @returns Result from the callback function
     */
    async withSPTransaction(callback) {
        return (0, transaction_1.withTransaction)(async (transaction) => {
            const helpers = {
                executeSP: (spName, params) => this.executeSPInTransaction(transaction, spName, params),
                executeSPSingle: (spName, params) => this.executeSPSingleInTransaction(transaction, spName, params),
                executeSPMultiple: async (spName, params) => {
                    const request = new mssql_1.default.Request(transaction);
                    if (params) {
                        for (const [key, value] of Object.entries(params)) {
                            if (value !== undefined) {
                                request.input(key, value);
                            }
                        }
                    }
                    const result = await request.execute(spName);
                    return {
                        recordsets: result.recordsets,
                        recordset: result.recordset,
                        rowsAffected: result.rowsAffected,
                        output: result.output,
                    };
                },
                transaction,
            };
            return callback(helpers);
        });
    }
}
exports.SPBaseRepository = SPBaseRepository;
//# sourceMappingURL=sp-base-repository.js.map