"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// GET /api/subscription/current - Get current subscription plan
router.get('/current', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        // Get user's max_stores (default to 999 if not set - enterprise plan)
        const userQuery = `
      SELECT ISNULL(max_stores, 999) as max_stores
      FROM Users
      WHERE id = @userId
    `;
        const user = await (0, db_1.queryOne)(userQuery, { userId });
        const maxStores = user?.max_stores || 999;
        // Count current stores the user has access to (via UserStores table)
        const storesQuery = `
      SELECT COUNT(DISTINCT us.store_id) as count
      FROM UserStores us
      INNER JOIN Stores s ON us.store_id = s.id
      WHERE us.user_id = @userId AND s.status = 'active'
    `;
        const storesResult = await (0, db_1.queryOne)(storesQuery, { userId });
        const currentStores = storesResult?.count || 0;
        res.json({
            maxStores,
            currentStores,
        });
    }
    catch (error) {
        console.error('Get subscription error:', error);
        res.status(500).json({ error: 'Failed to get subscription' });
    }
});
// POST /api/subscription/upgrade - Upgrade subscription plan
router.post('/upgrade', async (req, res) => {
    try {
        const userId = req.user?.id;
        const { planId, maxStores } = req.body;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        if (!planId || !maxStores) {
            res.status(400).json({ error: 'Missing planId or maxStores' });
            return;
        }
        // Update max_stores in Users table
        const updateQuery = `
      UPDATE Users
      SET max_stores = @maxStores,
          updated_at = GETDATE()
      WHERE id = @userId
    `;
        await (0, db_1.query)(updateQuery, {
            userId,
            maxStores
        });
        res.json({
            success: true,
            message: 'Subscription upgraded successfully',
            maxStores,
        });
    }
    catch (error) {
        console.error('Upgrade subscription error:', error);
        res.status(500).json({ error: 'Failed to upgrade subscription' });
    }
});
exports.default = router;
//# sourceMappingURL=subscription.js.map