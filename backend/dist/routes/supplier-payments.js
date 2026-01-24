"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.use(auth_1.storeContext);
// GET /api/supplier-payments
router.get('/', async (req, res) => {
    try {
        const storeId = req.storeId;
        const payments = await (0, db_1.query)(`SELECT sp.*, s.name as supplier_name
       FROM SupplierPayments sp
       LEFT JOIN Suppliers s ON sp.supplier_id = s.id
       WHERE sp.store_id = @storeId
       ORDER BY sp.created_at DESC`, { storeId });
        res.json(payments.map((p) => ({
            id: p.id,
            storeId: p.store_id,
            supplierId: p.supplier_id,
            supplierName: p.supplier_name,
            purchaseId: p.purchase_id,
            amount: p.amount,
            paymentDate: p.payment_date,
            paymentMethod: p.payment_method,
            notes: p.notes,
            createdAt: p.created_at,
        })));
    }
    catch (error) {
        console.error('Get supplier payments error:', error);
        res.status(500).json({ error: 'Failed to get supplier payments' });
    }
});
// POST /api/supplier-payments
router.post('/', async (req, res) => {
    try {
        const storeId = req.storeId;
        const { supplierId, purchaseId, amount, paymentDate, paymentMethod, notes } = req.body;
        await (0, db_1.query)(`INSERT INTO SupplierPayments (id, store_id, supplier_id, purchase_id, amount, payment_date, payment_method, notes, created_at)
       VALUES (NEWID(), @storeId, @supplierId, @purchaseId, @amount, @paymentDate, @paymentMethod, @notes, GETDATE())`, {
            storeId,
            supplierId,
            purchaseId: purchaseId || null,
            amount,
            paymentDate: paymentDate || new Date(),
            paymentMethod: paymentMethod || 'cash',
            notes
        });
        res.status(201).json({ success: true });
    }
    catch (error) {
        console.error('Create supplier payment error:', error);
        res.status(500).json({ error: 'Failed to create supplier payment' });
    }
});
exports.default = router;
//# sourceMappingURL=supplier-payments.js.map