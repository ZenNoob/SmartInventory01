"use strict";
/**
 * Customers SP Repository
 *
 * Repository for customer operations using stored procedures.
 * Implements CRUD operations via sp_Customers_* stored procedures.
 * Requirements: 3.1-3.5
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.customersSPRepository = exports.CustomersSPRepository = void 0;
const sp_base_repository_1 = require("./sp-base-repository");
/**
 * Customers repository using stored procedures
 */
class CustomersSPRepository extends sp_base_repository_1.SPBaseRepository {
    tableName = 'Customers';
    /**
     * Map database record to Customer entity
     */
    mapToEntity(record) {
        return {
            id: record.id,
            storeId: record.storeId,
            name: record.name,
            phone: record.phone || undefined,
            email: record.email || undefined,
            address: record.address || undefined,
            customerType: record.customerType || 'retail',
            loyaltyTier: record.loyaltyTier || 'bronze',
            totalSpent: record.totalSales ?? 0,
            totalPaid: record.totalPaid ?? 0,
            totalDebt: record.totalDebt ?? 0,
            status: record.status || 'active',
            customerGroup: record.customerGroup || undefined,
            lifetimePoints: record.lifetimePoints ?? 0,
            notes: record.notes || undefined,
            createdAt: record.createdAt
                ? record.createdAt instanceof Date
                    ? record.createdAt.toISOString()
                    : String(record.createdAt)
                : undefined,
            updatedAt: record.updatedAt
                ? record.updatedAt instanceof Date
                    ? record.updatedAt.toISOString()
                    : String(record.updatedAt)
                : undefined,
        };
    }
    /**
     * Create a new customer using sp_Customers_Create
     * Requirements: 3.1
     *
     * @param input - Customer data to create
     * @returns Created customer
     */
    async create(input) {
        const id = input.id || crypto.randomUUID();
        const params = {
            id,
            storeId: input.storeId,
            name: input.name,
            phone: input.phone || null,
            email: input.email || null,
            address: input.address || null,
            customerType: input.customerType || 'retail',
            loyaltyTier: input.loyaltyTier || 'bronze',
        };
        await this.executeSP('sp_Customers_Create', params);
        // Fetch and return the created customer
        const customer = await this.getById(id, input.storeId);
        if (!customer) {
            throw new Error('Failed to create customer');
        }
        return customer;
    }
    /**
     * Update a customer using sp_Customers_Update
     * Requirements: 3.2
     *
     * @param id - Customer ID
     * @param storeId - Store ID
     * @param data - Fields to update
     * @returns Updated customer or null if not found
     */
    async update(id, storeId, data) {
        const params = {
            id,
            storeId,
            name: data.name,
            phone: data.phone,
            email: data.email,
            address: data.address,
            customerType: data.customerType,
            loyaltyTier: data.loyaltyTier,
        };
        const result = await this.executeSPSingle('sp_Customers_Update', params);
        if (!result || result.AffectedRows === 0) {
            return null;
        }
        return this.getById(id, storeId);
    }
    /**
     * Delete a customer using sp_Customers_Delete
     * Requirements: 3.3
     *
     * @param id - Customer ID
     * @param storeId - Store ID
     * @returns True if deleted, false if not found
     */
    async delete(id, storeId) {
        const result = await this.executeSPSingle('sp_Customers_Delete', { id, storeId });
        return (result?.AffectedRows ?? 0) > 0;
    }
    /**
     * Get all customers for a store using sp_Customers_GetByStore
     * Requirements: 3.4
     *
     * @param storeId - Store ID
     * @returns Array of customers
     */
    async getByStore(storeId) {
        const params = {
            storeId,
        };
        const results = await this.executeSP('sp_Customers_GetByStore', params);
        return results.map((r) => this.mapToEntity(r));
    }
    /**
     * Get a single customer by ID
     * Uses sp_Customers_GetByStore and filters by ID
     *
     * @param id - Customer ID
     * @param storeId - Store ID
     * @returns Customer or null if not found
     */
    async getById(id, storeId) {
        // Note: If sp_Customers_GetById exists, use it instead
        // For now, we filter from getByStore results
        const customers = await this.getByStore(storeId);
        return customers.find((c) => c.id === id) || null;
    }
    /**
     * Update customer debt using sp_Customers_UpdateDebt
     * Requirements: 3.5
     *
     * @param id - Customer ID
     * @param storeId - Store ID
     * @param spentAmount - Amount spent to add (positive value)
     * @param paidAmount - Amount paid to add (positive value)
     * @returns New total debt after update
     */
    async updateDebt(id, storeId, spentAmount = 0, paidAmount = 0) {
        const params = {
            id,
            storeId,
            spentAmount,
            paidAmount,
        };
        const result = await this.executeSPSingle('sp_Customers_UpdateDebt', params);
        return result?.total_debt ?? 0;
    }
    /**
     * Add to customer's spent amount
     * Convenience method for recording a sale
     *
     * @param id - Customer ID
     * @param storeId - Store ID
     * @param amount - Amount spent
     * @returns New total debt
     */
    async addSpent(id, storeId, amount) {
        return this.updateDebt(id, storeId, amount, 0);
    }
    /**
     * Record a payment from customer
     * Convenience method for recording a payment
     *
     * @param id - Customer ID
     * @param storeId - Store ID
     * @param amount - Amount paid
     * @returns New total debt
     */
    async recordPayment(id, storeId, amount) {
        return this.updateDebt(id, storeId, 0, amount);
    }
    /**
     * Get customer debt information
     *
     * @param id - Customer ID
     * @param storeId - Store ID
     * @returns Debt information or null if customer not found
     */
    async getDebtInfo(id, storeId) {
        const customer = await this.getById(id, storeId);
        if (!customer) {
            return null;
        }
        return {
            totalSpent: customer.totalSpent ?? 0,
            totalPaid: customer.totalPaid ?? 0,
            totalDebt: customer.totalDebt ?? 0,
        };
    }
}
exports.CustomersSPRepository = CustomersSPRepository;
// Export singleton instance
exports.customersSPRepository = new CustomersSPRepository();
//# sourceMappingURL=customers-sp-repository.js.map