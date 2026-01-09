import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { queryOne } from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
  role: string;
  storeId?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
  storeId?: string;
}

// Database uses snake_case
interface SessionRecord {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
}

interface UserRecord {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  status: string;
}

/**
 * Authentication middleware
 */
export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);

    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      sessionId: string;
    };

    // Check session in database
    const session = await queryOne<SessionRecord>(
      'SELECT * FROM Sessions WHERE id = @sessionId AND token = @token AND expires_at > GETDATE()',
      { sessionId: decoded.sessionId, token }
    );

    if (!session) {
      res.status(401).json({ error: 'Invalid or expired session' });
      return;
    }

    // Get user
    const user = await queryOne<UserRecord>(
      'SELECT id, email, display_name, role, status FROM Users WHERE id = @userId',
      { userId: decoded.userId }
    );

    if (!user || user.status !== 'active') {
      res.status(401).json({ error: 'User not found or inactive' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      displayName: user.display_name || undefined,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Store context middleware - extracts storeId from header
 */
export function storeContext(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const storeId = req.headers['x-store-id'] as string;

  if (!storeId) {
    res.status(400).json({ error: 'Store ID is required' });
    return;
  }

  req.storeId = storeId;
  next();
}

/**
 * Role-based authorization middleware
 */
export function authorize(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}
