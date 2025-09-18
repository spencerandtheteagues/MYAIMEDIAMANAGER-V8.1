import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { signJwt, verifyJwt, JwtClaims } from './jwt';
import { storage } from '../storage';

const JWT_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.REFRESH_SECRET || JWT_SECRET + '_refresh';

// Shorter access token, longer refresh token
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface RefreshToken {
  jti: string;  // JWT ID
  sub: string;  // User ID
  iat: number;  // Issued at
  exp: number;  // Expires at
}

// Sign refresh token
export function signRefreshToken(userId: string): string {
  const jti = `refresh_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  return jwt.sign(
    {
      jti,
      sub: userId,
    },
    REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

// Verify refresh token
export function verifyRefreshToken(token: string): RefreshToken | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as RefreshToken;
  } catch {
    return null;
  }
}

// Middleware to refresh tokens automatically
export async function refreshTokenMiddleware(req: Request, res: Response, next: NextFunction) {
  const accessToken = req.cookies?.mam_jwt;
  const refreshToken = req.cookies?.mam_refresh;

  // If no tokens, continue without authentication
  if (!accessToken && !refreshToken) {
    return next();
  }

  // Try to verify access token
  if (accessToken) {
    try {
      const claims = verifyJwt(accessToken);
      (req as any).user = claims;
      return next();
    } catch (error: any) {
      // Token expired or invalid, try refresh
      if (error.name !== 'TokenExpiredError' || !refreshToken) {
        // Clear invalid cookies
        res.clearCookie('mam_jwt');
        res.clearCookie('mam_refresh');
        return next();
      }
    }
  }

  // Try to use refresh token
  if (refreshToken) {
    const refreshClaims = verifyRefreshToken(refreshToken);
    if (!refreshClaims) {
      // Invalid refresh token, clear cookies
      res.clearCookie('mam_jwt');
      res.clearCookie('mam_refresh');
      return next();
    }

    // Get user from database
    const user = await storage.getUser(refreshClaims.sub);
    if (!user || user.accountStatus !== 'active') {
      // User doesn't exist or is inactive
      res.clearCookie('mam_jwt');
      res.clearCookie('mam_refresh');
      return next();
    }

    // Issue new access token
    const newAccessToken = signJwt({
      sub: String(user.id),
      email: user.email,
      name: user.fullName,
      picture: user.googleAvatar,
      roles: [user.role],
    }, ACCESS_TOKEN_EXPIRY);

    // Set new access token cookie
    res.cookie('mam_jwt', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    // Attach user to request
    (req as any).user = {
      sub: String(user.id),
      email: user.email,
      name: user.fullName,
      picture: user.googleAvatar,
      roles: [user.role],
    };

    next();
  }
}

// Endpoint to manually refresh tokens
export async function refreshTokenEndpoint(req: Request, res: Response) {
  const refreshToken = req.cookies?.mam_refresh;

  if (!refreshToken) {
    return res.status(401).json({ message: 'No refresh token provided' });
  }

  const refreshClaims = verifyRefreshToken(refreshToken);
  if (!refreshClaims) {
    res.clearCookie('mam_jwt');
    res.clearCookie('mam_refresh');
    return res.status(401).json({ message: 'Invalid refresh token' });
  }

  // Get user from database
  const user = await storage.getUser(refreshClaims.sub);
  if (!user || user.accountStatus !== 'active') {
    res.clearCookie('mam_jwt');
    res.clearCookie('mam_refresh');
    return res.status(401).json({ message: 'User not found or inactive' });
  }

  // Issue new tokens
  const newAccessToken = signJwt({
    sub: String(user.id),
    email: user.email,
    name: user.fullName,
    picture: user.googleAvatar,
    roles: [user.role],
  }, ACCESS_TOKEN_EXPIRY);

  const newRefreshToken = signRefreshToken(String(user.id));

  // Set cookies
  res.cookie('mam_jwt', newAccessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('mam_refresh', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.json({
    message: 'Tokens refreshed successfully',
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      businessName: user.businessName,
      tier: user.tier,
      credits: user.credits,
      isAdmin: user.isAdmin,
      emailVerified: user.emailVerified,
      referralCode: user.referralCode,
    }
  });
}

// Helper to set both access and refresh tokens
export function setAuthCookies(res: Response, user: any) {
  const accessToken = signJwt({
    sub: String(user.id),
    email: user.email,
    name: user.fullName,
    picture: user.googleAvatar,
    roles: [user.role],
  }, ACCESS_TOKEN_EXPIRY);

  const refreshToken = signRefreshToken(String(user.id));

  res.cookie('mam_jwt', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('mam_refresh', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}