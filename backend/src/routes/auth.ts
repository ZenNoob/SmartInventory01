import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, insert } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Database uses snake_case column names
interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  display_name: string | null;
  role: string;
  permissions: string | null;
  status: string;
  failed_login_attempts: number;
  locked_until: Date | null;
}

interface UserStoreRecord {
  store_id: string;
}

interface SessionRecord {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
}

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Find user
    const user = await queryOne<UserRecord>(
      'SELECT * FROM Users WHERE email = @email',
      { email: email.toLowerCase() }
    );

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Check if password hash exists
    if (!user.password_hash) {
      console.error('User has no password hash:', user.email);
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Check if locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      res.status(423).json({ error: 'Account is locked. Try again later.' });
      return;
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (user.status !== 'active') {
      res.status(403).json({ error: 'Account is not active' });
      return;
    }

    // Get user's stores
    const stores = await query<UserStoreRecord>(
      'SELECT store_id FROM UserStores WHERE user_id = @userId',
      { userId: user.id }
    );

    // Create session
    const sessionId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const token = jwt.sign({ userId: user.id, sessionId }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    await insert('Sessions', {
      id: sessionId,
      user_id: user.id,
      token: token,
      expires_at: expiresAt,
      created_at: new Date(),
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        role: user.role,
        permissions: user.permissions ? JSON.parse(user.permissions) : null,
      },
      stores: stores.map((s) => s.store_id),
      token,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Login error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: `Login failed: ${errorMessage}` });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.substring(7);

    if (token) {
      await queryOne('DELETE FROM Sessions WHERE token = @token', { token });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;

    const stores = await query<UserStoreRecord>(
      'SELECT store_id FROM UserStores WHERE user_id = @userId',
      { userId: user.id }
    );

    res.json({
      user,
      stores: stores.map((s) => s.store_id),
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

export default router;
