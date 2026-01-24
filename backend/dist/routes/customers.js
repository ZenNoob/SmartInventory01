"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uuid_1 = require("uuid");
const auth_1 = require("../middleware/auth");
const customers_sp_repository_1 = require("../repositories/customers-sp-repository");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.use(auth_1.storeContext);
// GET /api/customers
// Requirements: 3.4 - Uses sp_Customers_GetByStore
router.get('/', async (req, res) => {
    try {
        const storeId = req.storeId;
        // Use SP Repository instead of inline query
        const customers = await customers_sp_repository_1.customersSPRepository.getByStore(storeId);
        res.json(customers.map((c) => ({
            id: c.id,
            storeId: c.storeId,
            email: c.email,
            name: c.name,
            phone: c.phone,
            address: c.address,
            status: c.status,
            loyaltyTier: c.loyaltyTier,
            customerType: c.customerType,
            customerGroup: c.customerGroup,
            lifetimePoints: c.lifetimePoints,
            notes: c.notes,
            totalDebt: c.totalDebt ?? 0,
            totalPaid: c.totalPaid ?? 0,
            calculatedDebt: c.totalDebt ?? 0,
            totalPayments: c.totalPaid ?? 0,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
        })));
    }
    catch (error) {
        console.error('Get customers error:', error);
        res.status(500).json({ error: 'Failed to get customers' });
    }
});
// GET /api/customers/:id
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const storeId = req.storeId;
        // Use SP Repository instead of inline query
        const customer = await customers_sp_repository_1.customersSPRepository.getById(id, storeId);
        if (!customer) {
            res.status(404).json({ error: 'Customer not found' });
            return;
        }
        res.json({
            id: customer.id,
            storeId: customer.storeId,
            email: customer.email,
            name: customer.name,
            phone: customer.phone,
            address: customer.address,
            status: customer.status,
            loyaltyTier: customer.loyaltyTier,
            customerType: customer.customerType,
            customerGroup: customer.customerGroup,
            lifetimePoints: customer.lifetimePoints ?? 0,
            loyaltyPoints: customer.lifetimePoints ?? 0, // Same as lifetimePoints for now
            notes: customer.notes,
            totalDebt: customer.totalDebt ?? 0,
            currentDebt: customer.totalDebt ?? 0, // Alias for frontend
            totalPaid: customer.totalPaid ?? 0,
            creditLimit: 0, // Default credit limit
            createdAt: customer.createdAt,
            updatedAt: customer.updatedAt,
        });
    }
    catch (error) {
        console.error('Get customer error:', error);
        res.status(500).json({ error: 'Failed to get customer' });
    }
});
// POST /api/customers
// Requirements: 3.1 - Uses sp_Customers_Create
router.post('/', async (req, res) => {
    try {
        const storeId = req.storeId;
        const { name, email, phone, address, customerType, loyaltyTier, } = req.body;
        const customerId = (0, uuid_1.v4)();
        // Use SP Repository instead of inline query
        const customer = await customers_sp_repository_1.customersSPRepository.create({
            id: customerId,
            storeId,
            name,
            email: email || null,
            phone: phone || null,
            address: address || null,
            customerType: customerType || 'retail',
            loyaltyTier: loyaltyTier || 'bronze',
        });
        res.status(201).json({ id: customer.id, success: true });
    }
    catch (error) {
        console.error('Create customer error:', error);
        res.status(500).json({ error: 'Failed to create customer' });
    }
});
// PUT /api/customers/:id
// Requirements: 3.2 - Uses sp_Customers_Update
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const storeId = req.storeId;
        const { name, email, phone, address, customerType, loyaltyTier, } = req.body;
        // Use SP Repository instead of inline query
        const customer = await customers_sp_repository_1.customersSPRepository.update(id, storeId, {
            name,
            email: email !== undefined ? email : undefined,
            phone: phone !== undefined ? phone : undefined,
            address: address !== undefined ? address : undefined,
            customerType: customerType !== undefined ? customerType : undefined,
            loyaltyTier: loyaltyTier !== undefined ? loyaltyTier : undefined,
        });
        if (!customer) {
            res.status(404).json({ error: 'Customer not found' });
            return;
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Update customer error:', error);
        res.status(500).json({ error: 'Failed to update customer' });
    }
});
// DELETE /api/customers/:id
// Requirements: 3.3 - Uses sp_Customers_Delete
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const storeId = req.storeId;
        // Use SP Repository instead of inline query
        const deleted = await customers_sp_repository_1.customersSPRepository.delete(id, storeId);
        if (!deleted) {
            res.status(404).json({ error: 'Customer not found' });
            return;
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Delete customer error:', error);
        res.status(500).json({ error: 'Failed to delete customer' });
    }
});
// PUT /api/customers/:id/debt
// Requirements: 3.5 - Uses sp_Customers_UpdateDebt
router.put('/:id/debt', async (req, res) => {
    try {
        const { id } = req.params;
        const storeId = req.storeId;
        const { spentAmount, paidAmount } = req.body;
        // Use SP Repository for debt update
        const newDebt = await customers_sp_repository_1.customersSPRepository.updateDebt(id, storeId, spentAmount || 0, paidAmount || 0);
        res.json({ success: true, totalDebt: newDebt });
    }
    catch (error) {
        console.error('Update customer debt error:', error);
        res.status(500).json({ error: 'Failed to update customer debt' });
    }
});
exports.default = router;
//# sourceMappingURL=customers.js.map