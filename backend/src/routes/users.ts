import { Router, Response } from 'express';
import { query } from '../db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// GET /api/users
router.get('/', authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const users = await query(
      'SELECT id, email, display_name, role, status, created_at FROM Users ORDER BY created_at DESC'
    );

    res.json(users.map((u: Record<string, unknown>) => ({
      id: u.id,
      email: u.email,
      displayName: u.display_name,
      role: u.role,
      status: u.status,
      createdAt: u.created_at,
    })));
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

export default router;
