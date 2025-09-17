import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// Ensure environment variables are loaded
if (typeof process !== 'undefined' && !process.env.JWT_SECRET) {
  try {
    require('dotenv').config();
  } catch (e) {
    // dotenv might not be available, that's ok
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'development-fallback-secret';
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('Missing JWT_SECRET in production');
}

export type JwtClaims = {
  sub: string;           // user id
  email?: string;
  name?: string;
  picture?: string;
  roles?: string[];
};

export function signJwt(claims: JwtClaims, expiresIn = '7d') {
  return jwt.sign(claims, JWT_SECRET, { expiresIn });
}

export function verifyJwt(token: string): JwtClaims {
  return jwt.verify(token, JWT_SECRET) as JwtClaims;
}

export function authOptional(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.mam_jwt;
  if (token) {
    try { (req as any).user = verifyJwt(token); } catch { /* ignore */ }
  }
  next();
}

export function authRequired(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.mam_jwt;
  if (!token) return res.status(401).json({ message: 'Not authenticated' });
  try { (req as any).user = verifyJwt(token); next(); }
  catch { return res.status(401).json({ message: 'Invalid token' }); }
}