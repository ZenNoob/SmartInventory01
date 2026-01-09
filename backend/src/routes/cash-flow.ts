import { Router, Response } from 'express';
import { authenticate, storeContext, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(storeContext);

// GET /api/cash-flow
// Note: CashFlow table does not exist in database, returning empty array
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    res.json([]);
  } catch (error) {
    console.error('Get cash flow error:', error);
    res.status(500).json({ error: 'Failed to get cash flow' });
  }
});

// POST /api/cash-flow
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    // CashFlow table does not exist
    res.status(501).json({ error: 'Cash flow feature not implemented' });
  } catch (error) {
    console.error('Create cash transaction error:', error);
    res.status(500).json({ error: 'Failed to create cash transaction' });
  }
});

export default router;
