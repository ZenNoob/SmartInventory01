"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uuid_1 = require("uuid");
const auth_1 = require("../middleware/auth");
const units_sp_repository_1 = require("../repositories/units-sp-repository");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.use(auth_1.storeContext);
// GET /api/units
// Requirements: 8.4 - Uses sp_Units_GetByStore
router.get('/', async (req, res) => {
    try {
        const storeId = req.storeId;
        // Use SP Repository instead of inline query
        const units = await units_sp_repository_1.unitsSPRepository.getByStore(storeId);
        console.log('[Units API] Store:', storeId, 'Units count:', units.length);
        console.log('[Units API] Units:', JSON.stringify(units, null, 2));
        res.json(units.map(u => ({
            id: u.id,
            name: u.name,
            description: u.description,
            baseUnitId: u.baseUnitId,
            conversionFactor: u.conversionFactor,
        })));
    }
    catch (error) {
        console.error('Get units error:', error);
        res.status(500).json({ error: 'Failed to get units' });
    }
});
// GET /api/units/:id
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const storeId = req.storeId;
        // Use SP Repository instead of inline query
        const unit = await units_sp_repository_1.unitsSPRepository.getById(id, storeId);
        if (!unit) {
            res.status(404).json({ error: 'Không tìm thấy đơn vị' });
            return;
        }
        res.json({
            id: unit.id,
            name: unit.name,
            description: unit.description,
            baseUnitId: unit.baseUnitId,
            conversionFactor: unit.conversionFactor,
        });
    }
    catch (error) {
        console.error('Get unit error:', error);
        res.status(500).json({ error: 'Failed to get unit' });
    }
});
// POST /api/units
// Requirements: 8.1 - Uses sp_Units_Create
router.post('/', async (req, res) => {
    try {
        const storeId = req.storeId;
        const { name, description, baseUnitId, conversionFactor } = req.body;
        if (!name) {
            res.status(400).json({ error: 'Name is required' });
            return;
        }
        // Use SP Repository instead of inline query
        const unit = await units_sp_repository_1.unitsSPRepository.create({
            id: (0, uuid_1.v4)(),
            storeId,
            name,
            description: description || null,
            baseUnitId: baseUnitId || null,
            conversionFactor: conversionFactor ?? 1,
        });
        res.status(201).json({
            id: unit.id,
            name: unit.name,
            description: unit.description,
            baseUnitId: unit.baseUnitId,
            conversionFactor: unit.conversionFactor,
        });
    }
    catch (error) {
        console.error('Create unit error:', error);
        res.status(500).json({ error: 'Failed to create unit' });
    }
});
// PUT /api/units/:id
// Requirements: 8.2 - Uses sp_Units_Update
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const storeId = req.storeId;
        const { name, description, baseUnitId, conversionFactor } = req.body;
        // Use SP Repository instead of inline query
        const unit = await units_sp_repository_1.unitsSPRepository.update(id, storeId, {
            name: name !== undefined ? name : undefined,
            description: description !== undefined ? description : undefined,
            baseUnitId: baseUnitId !== undefined ? baseUnitId : undefined,
            conversionFactor: conversionFactor !== undefined ? conversionFactor : undefined,
        });
        if (!unit) {
            res.status(404).json({ error: 'Unit not found' });
            return;
        }
        res.json({
            id: unit.id,
            name: unit.name,
            description: unit.description,
            baseUnitId: unit.baseUnitId,
            conversionFactor: unit.conversionFactor,
        });
    }
    catch (error) {
        console.error('Update unit error:', error);
        res.status(500).json({ error: 'Failed to update unit' });
    }
});
// DELETE /api/units/:id
// Requirements: 8.3 - Uses sp_Units_Delete
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const storeId = req.storeId;
        // Use SP Repository instead of inline query
        const deleted = await units_sp_repository_1.unitsSPRepository.delete(id, storeId);
        if (!deleted) {
            res.status(404).json({ error: 'Unit not found' });
            return;
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Delete unit error:', error);
        res.status(500).json({ error: 'Failed to delete unit' });
    }
});
exports.default = router;
//# sourceMappingURL=units.js.map