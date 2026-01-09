import { Router, Response } from 'express';
import { queryOne, query } from '../db';
import { authenticate, storeContext, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(storeContext);

// GET /api/settings
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.storeId!;
    
    const settings = await queryOne(
      'SELECT * FROM Settings WHERE store_id = @storeId',
      { storeId }
    );

    if (!settings) {
      res.json({});
      return;
    }

    // Parse settings JSON if stored as string
    const settingsData = settings.settings;
    if (typeof settingsData === 'string') {
      try {
        res.json(JSON.parse(settingsData));
      } catch {
        res.json({});
      }
    } else {
      res.json(settingsData || {});
    }
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// PUT /api/settings
router.put('/', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.storeId!;
    const settingsData = req.body;

    const existing = await queryOne<{ id: string }>(
      'SELECT id FROM Settings WHERE store_id = @storeId',
      { storeId }
    );

    if (existing) {
      await query(
        `UPDATE Settings SET settings = @settings, updated_at = GETDATE() WHERE id = @id`,
        { id: existing.id, settings: JSON.stringify(settingsData) }
      );
    } else {
      await query(
        `INSERT INTO Settings (id, store_id, settings, created_at, updated_at)
         VALUES (NEWID(), @storeId, @settings, GETDATE(), GETDATE())`,
        { storeId, settings: JSON.stringify(settingsData) }
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
