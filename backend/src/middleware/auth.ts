import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import db from '../config/database';
import { AuthenticatedUser } from '../types';

interface JwtPayload {
  userId: string;
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    const result = await db.query(
      'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1 AND u.is_active = true',
      [decoded.userId]
    );

    if (!result.rows[0]) {
      res.status(401).json({ error: 'User not found or inactive' });
      return;
    }
    req.user = result.rows[0] as AuthenticatedUser;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const authorize = (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role_name)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
