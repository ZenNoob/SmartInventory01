"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// GET /api/subscription/current - Get current subscription info
router.get('/current', async (req, res) => {
    try {
        const userEmail = req.user.email;
        // Get StoreOwner info
        const storeOwner = await (0, db_1.queryOne)('SELECT id, max_stores FROM StoreOwners WHERE email = @email', { email: userEmail });
        if (!storeOwner) {
            res.json({
                maxStores: 3,
                currentStores: 0,
            });
            return;
        }
        // Count current active stores
        const storeCount = await (0, db_1.queryOne)('SELECT COUNT(*) as count FROM Stores WHERE owner_id = @ownerId AND status = @status', { ownerId: storeOwner.id, status: 'active' });
        res.json({
            maxStores: storeOwner.max_stores || 3,
            currentStores: storeCount?.count || 0,
        });
    }
    catch (error) {
        console.error('Get subscription error:', error);
        res.status(500).json({ error: 'Failed to get subscription info' });
    }
});
// POST /api/subscription/upgrade - Upgrade subscription plan
router.post('/upgrade', async (req, res) => {
    try {
        const userEmail = req.user.email;
        const { planId, maxStores } = req.body;
        if (!planId || !maxStores || typeof maxStores !== 'number') {
            res.status(400).json({ error: 'Invalid plan data' });
            return;
        }
        // Validate maxStores value
        const validMaxStores = [3, 10, 999];
        if (!validMaxStores.includes(maxStores)) {
            res.status(400).json({ error: 'Invalid max stores value' });
            return;
        }
        // Get or create StoreOwner
        let storeOwner = await (0, db_1.queryOne)('SELECT id, max_stores FROM StoreOwners WHERE email = @email', { email: userEmail });
        if (!storeOwner) {
            // Create StoreOwner if doesn't exist
            const userId = req.user.id;
            const user = await (0, db_1.queryOne)('SELECT display_name FROM Users WHERE id = @userId', { userId });
            await (0, db_1.query)(`INSERT INTO StoreOwners (id, email, password_hash, full_name, max_stores, created_at, updated_at)
         VALUES (NEWID(), @email, 'linked_to_user', @fullName, @maxStores, GETDATE(), GETDATE())`, {
                email: userEmail,
                fullName: user?.display_name || userEmail,
                maxStores,
            });
            res.json({
                success: true,
                message: 'Nâng cấp gói thành công',
                maxStores,
            });
            return;
        }
        // Check if downgrading
        if (maxStores < storeOwner.max_stores) {
            // Count current stores
            const storeCount = await (0, db_1.queryOne)('SELECT COUNT(*) as count FROM Stores WHERE owner_id = @ownerId AND status = @status', { ownerId: storeOwner.id, status: 'active' });
            if (storeCount && storeCount.count > maxStores) {
                res.status(400).json({
                    error: `Không thể hạ cấp. Bạn đang có ${storeCount.count} cửa hàng, vui lòng xóa bớt trước khi hạ cấp xuống ${maxStores} cửa hàng.`,
                });
                return;
            }
        }
        // Update max_stores
        await (0, db_1.query)('UPDATE StoreOwners SET max_stores = @maxStores, updated_at = GETDATE() WHERE email = @email', { email: userEmail, maxStores });
        // Log the upgrade (optional - you can create a SubscriptionHistory table)
        // For now, we'll just return success
        res.json({
            success: true,
            message: 'Nâng cấp gói thành công',
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