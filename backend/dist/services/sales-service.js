"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.salesService = exports.SalesService = void 0;
const transaction_1 = require("../db/transaction");
const db_1 = require("../db");
const inventory_service_1 = require("./inventory-service");
const loyalty_points_service_1 = require("./loyalty-points-service");
/**
 * Sales Service
 * Handles sales transactions with automatic inventory deduction and unit conversion
 */
class SalesService {
    /**
     * Generate a unique invoice number
     */
    async generateInvoiceNumber(storeId) {
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const day = today.getDate().toString().padStart(2, '0');
        const datePrefix = `INV${year}${month}${day}`;
        const result = await (0, db_1.queryOne)(`SELECT TOP 1 invoice_number 
       FROM Sales 
       WHERE store_id = @storeId AND invoice_number LIKE @prefix + '%' 
       ORDER BY invoice_number DESC`, { storeId, prefix: datePrefix });
        let nextSequence = 1;
        if (result) {
            const lastSequence = parseInt(result.invoice_number.substring(datePrefix.length), 10);
            if (!isNaN(lastSequence)) {
                nextSequence = lastSequence + 1;
            }
        }
        return `${datePrefix}${nextSequence.toString().padStart(4, '0')}`;
    }
    /**
     * Create a new sale with automatic inventory deduction
     */
    async createSale(saleData, storeId) {
        return (0, transaction_1.withTransaction)(async (transaction) => {
            // Validate items
            if (!saleData.items || saleData.items.length === 0) {
                throw new Error('Sale must have at least one item');
            }
            // Check inventory availability for all items first
            for (const item of saleData.items) {
                const unitId = item.unitId || await this.getDefaultUnitId(item.productId, storeId);
                const available = await inventory_service_1.inventoryService.checkAvailableQuantity(item.productId, storeId, unitId);
                if (available < item.quantity) {
                    const product = await (0, db_1.queryOne)('SELECT name FROM Products WHERE id = @productId', { productId: item.productId });
                    throw new inventory_service_1.InsufficientStockError(`Không đủ hàng. Chỉ còn ${available} ${product?.name || 'sản phẩm'}`, item.productId, item.quantity, available, unitId);
                }
            }
            // Calculate totals
            const totalAmount = saleData.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
            const discount = saleData.discount || 0;
            const tierDiscountAmount = saleData.tierDiscountAmount || 0;
            const pointsDiscount = saleData.pointsDiscount || 0;
            const vatAmount = saleData.vatAmount || 0;
            const finalAmount = totalAmount - discount - tierDiscountAmount - pointsDiscount + vatAmount;
            // Calculate remaining debt
            const customerPayment = saleData.customerPayment || 0;
            const previousDebt = saleData.previousDebt || 0;
            const remainingDebt = previousDebt + finalAmount - customerPayment;
            // Generate invoice number
            const invoiceNumber = await this.generateInvoiceNumber(storeId);
            const saleId = crypto.randomUUID();
            const now = new Date();
            // Create sale record
            await (0, db_1.query)(`INSERT INTO Sales 
         (id, store_id, invoice_number, customer_id, shift_id, transaction_date, 
          status, total_amount, vat_amount, final_amount, discount, discount_type, 
          discount_value, tier_discount_percentage, tier_discount_amount, 
          points_used, points_discount, customer_payment, previous_debt, 
          remaining_debt, created_at, updated_at)
         VALUES (@id, @storeId, @invoiceNumber, @customerId, @shiftId, @transactionDate,
                 @status, @totalAmount, @vatAmount, @finalAmount, @discount, @discountType,
                 @discountValue, @tierDiscountPercentage, @tierDiscountAmount,
                 @pointsUsed, @pointsDiscount, @customerPayment, @previousDebt,
                 @remainingDebt, @createdAt, @updatedAt)`, {
                id: saleId,
                storeId,
                invoiceNumber,
                customerId: saleData.customerId || null,
                shiftId: saleData.shiftId || null,
                transactionDate: now,
                status: 'pending',
                totalAmount,
                vatAmount,
                finalAmount,
                discount,
                discountType: saleData.discountType || null,
                discountValue: saleData.discountValue || null,
                tierDiscountPercentage: saleData.tierDiscountPercentage || null,
                tierDiscountAmount,
                pointsUsed: saleData.pointsUsed || 0,
                pointsDiscount,
                customerPayment,
                previousDebt,
                remainingDebt,
                createdAt: now,
                updatedAt: now,
            });
            // Create sale items and deduct inventory
            const items = [];
            const allConversions = [];
            for (const itemData of saleData.items) {
                const itemId = crypto.randomUUID();
                const unitId = itemData.unitId || await this.getDefaultUnitId(itemData.productId, storeId);
                // Create sale item
                await (0, db_1.query)(`INSERT INTO SalesItems 
           (id, sales_transaction_id, product_id, quantity, price, unit_id, created_at)
           VALUES (@id, @salesTransactionId, @productId, @quantity, @price, @unitId, @createdAt)`, {
                    id: itemId,
                    salesTransactionId: saleId,
                    productId: itemData.productId,
                    quantity: itemData.quantity,
                    price: itemData.price,
                    unitId: unitId || null,
                    createdAt: now,
                });
                items.push({
                    id: itemId,
                    salesTransactionId: saleId,
                    productId: itemData.productId,
                    quantity: itemData.quantity,
                    price: itemData.price,
                });
                // Deduct inventory
                const deductResult = await inventory_service_1.inventoryService.deductInventory(itemData.productId, storeId, itemData.quantity, unitId, saleId);
                // Collect conversion logs
                if (deductResult.conversions.length > 0) {
                    allConversions.push(...deductResult.conversions);
                }
            }
            // Update customer debt if applicable
            if (saleData.customerId && remainingDebt !== 0) {
                await (0, db_1.query)(`UPDATE Customers 
           SET debt = @remainingDebt, updated_at = @updatedAt
           WHERE id = @customerId AND store_id = @storeId`, {
                    customerId: saleData.customerId,
                    storeId,
                    remainingDebt,
                    updatedAt: now,
                });
            }
            // Earn loyalty points for the customer (if applicable)
            // Points are earned on the amount after discounts (excluding VAT)
            if (saleData.customerId) {
                try {
                    const amountForPoints = totalAmount - discount - tierDiscountAmount - pointsDiscount;
                    if (amountForPoints > 0) {
                        const earnResult = await loyalty_points_service_1.loyaltyPointsService.earnPoints(saleData.customerId, storeId, amountForPoints, saleId);
                        if (earnResult.points > 0) {
                            console.log(`[SalesService] Customer ${saleData.customerId} earned ${earnResult.points} points. New balance: ${earnResult.newBalance}`);
                        }
                    }
                }
                catch (earnError) {
                    // Log but don't fail the sale if loyalty points fails
                    console.error('[SalesService] Failed to earn loyalty points:', earnError);
                }
            }
            // Fetch created sale
            const sale = await (0, db_1.queryOne)(`SELECT * FROM Sales WHERE id = @id AND store_id = @storeId`, { id: saleId, storeId });
            return {
                sale: this.mapSaleToEntity(sale),
                items,
                conversions: allConversions,
            };
        });
    }
    /**
     * Cancel a sale and restore inventory
     */
    async cancelSale(saleId, storeId) {
        return (0, transaction_1.withTransaction)(async (transaction) => {
            // Get sale
            const sale = await (0, db_1.queryOne)(`SELECT * FROM Sales WHERE id = @id AND store_id = @storeId`, { id: saleId, storeId });
            if (!sale) {
                throw new Error('Sale not found');
            }
            if (sale.status === 'cancelled') {
                throw new Error('Sale is already cancelled');
            }
            // Get sale items
            const items = await (0, db_1.query)(`SELECT * FROM SalesItems WHERE sales_transaction_id = @salesTransactionId`, { salesTransactionId: saleId });
            // Restore inventory for each item
            for (const item of items) {
                const unitId = item.unit_id || await this.getDefaultUnitId(item.product_id, storeId);
                await inventory_service_1.inventoryService.restoreInventory(item.product_id, storeId, item.quantity, unitId);
            }
            // Update sale status
            await (0, db_1.query)(`UPDATE Sales SET status = 'cancelled', updated_at = @updatedAt 
         WHERE id = @id AND store_id = @storeId`, { id: saleId, storeId, updatedAt: new Date() });
            // Restore customer debt if applicable
            if (sale.customer_id && sale.remaining_debt !== 0) {
                await (0, db_1.query)(`UPDATE Customers 
           SET debt = debt - @debtChange, updated_at = @updatedAt
           WHERE id = @customerId AND store_id = @storeId`, {
                    customerId: sale.customer_id,
                    storeId,
                    debtChange: sale.remaining_debt,
                    updatedAt: new Date(),
                });
            }
        });
    }
    /**
     * Get default unit ID for a product
     * Returns unit_id from Products table
     */
    async getDefaultUnitId(productId, storeId) {
        const product = await (0, db_1.queryOne)(`SELECT unit_id FROM Products 
       WHERE id = @productId AND store_id = @storeId`, { productId, storeId });
        if (!product?.unit_id) {
            throw new Error(`Product ${productId} does not have a unit_id configured`);
        }
        return product.unit_id;
    }
    /**
     * Map database record to Sale entity
     */
    mapSaleToEntity(record) {
        return {
            id: record.id,
            storeId: record.store_id,
            invoiceNumber: record.invoice_number,
            customerId: record.customer_id || undefined,
            shiftId: record.shift_id || undefined,
            transactionDate: record.transaction_date
                ? record.transaction_date instanceof Date
                    ? record.transaction_date.toISOString()
                    : String(record.transaction_date)
                : new Date().toISOString(),
            status: record.status || 'pending',
            totalAmount: record.total_amount || 0,
            vatAmount: record.vat_amount || 0,
            finalAmount: record.final_amount || 0,
            discount: record.discount || 0,
            discountType: record.discount_type || undefined,
            discountValue: record.discount_value ?? undefined,
            tierDiscountPercentage: record.tier_discount_percentage ?? undefined,
            tierDiscountAmount: record.tier_discount_amount ?? undefined,
            pointsUsed: record.points_used || 0,
            pointsDiscount: record.points_discount || 0,
            customerPayment: record.customer_payment ?? undefined,
            previousDebt: record.previous_debt ?? undefined,
            remainingDebt: record.remaining_debt ?? undefined,
            createdAt: record.created_at
                ? record.created_at instanceof Date
                    ? record.created_at.toISOString()
                    : String(record.created_at)
                : undefined,
            updatedAt: record.updated_at
                ? record.updated_at instanceof Date
                    ? record.updated_at.toISOString()
                    : String(record.updated_at)
                : undefined,
        };
    }
}
exports.SalesService = SalesService;
// Export singleton instance
exports.salesService = new SalesService();
//# sourceMappingURL=sales-service.js.map