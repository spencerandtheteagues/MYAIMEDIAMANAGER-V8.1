/**
 * X.com OAuth 2.0 Implementation
 * Allows users to connect their X accounts to the platform
 */

import crypto from 'crypto';
import { storage } from './storage';

// OAuth 2.0 configuration
const domain = process.env.APP_URL?.replace('https://', '').replace('http://', '') || 'localhost:5000';
const protocol = domain.includes('localhost') ? 'http' : 'https';

const X_OAUTH_CONFIG = {
  clientId: process.env.X_CLIENT_ID || '',
  clientSecret: process.env.X_CLIENT_SECRET || '',
  redirectUri: process.env.X_REDIRECT_URI || `${protocol}://${domain}/api/auth/x/callback`,
  authorizationUrl: 'https://twitter.com/i/oauth2/authorize',
  tokenUrl: 'https://api.twitter.com/2/oauth2/token',
  scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
};

// Store OAuth states temporarily (in production, use Redis or database)
const oauthStates = new Map<string, { userId: string; timestamp: number }>();

// Generate PKCE challenge
function generatePKCEChallenge() {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');
  return { verifier, challenge };
}

/**
 * Generate OAuth authorization URL for X.com
 */
export function generateXAuthUrl(userId: string): { url: string; state: string; codeVerifier: string } {
  const state = crypto.randomBytes(32).toString('hex');
  const { verifier, challenge } = generatePKCEChallenge();
  
  // Store state for verification
  oauthStates.set(state, {
    userId,
    timestamp: Date.now(),
  });
  
  // Clean up old states (older than 10 minutes)
  for (const [key, value] of Array.from(oauthStates.entries())) {
    if (Date.now() - value.timestamp > 600000) {
      oauthStates.delete(key);
    }
  }
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: X_OAUTH_CONFIG.clientId,
    redirect_uri: X_OAUTH_CONFIG.redirectUri,
    scope: X_OAUTH_CONFIG.scopes.join(' '),
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });
  
  return {
    url: `${X_OAUTH_CONFIG.authorizationUrl}?${params.toString()}`,
    state,
    codeVerifier: verifier,
  };
}

/**
 * Exchange authorization code for access tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scope: string;
}> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: X_OAUTH_CONFIG.redirectUri,
    code_verifier: codeVerifier,
  });
  
  const authHeader = Buffer.from(
    `${X_OAUTH_CONFIG.clientId}:${X_OAUTH_CONFIG.clientSecret}`
  ).toString('base64');
  
  const response = await fetch(X_OAUTH_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for tokens: ${error}`);
  }
  
  const data = await response.json();
  
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    scope: data.scope,
  };
}

/**
 * Get user information from X.com
 */
export async function getXUserInfo(accessToken: string): Promise<{
  id: string;
  username: string;
  name: string;
}> {
  const response = await fetch('https://api.twitter.com/2/users/me', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to get user information from X');
  }
  
  const data = await response.json();
  
  return {
    id: data.data.id,
    username: data.data.username,
    name: data.data.name,
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshXAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });
  
  const authHeader = Buffer.from(
    `${X_OAUTH_CONFIG.clientId}:${X_OAUTH_CONFIG.clientSecret}`
  ).toString('base64');
  
  const response = await fetch(X_OAUTH_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to refresh access token');
  }
  
  const data = await response.json();
  
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Handle OAuth callback from X.com
 */
export async function handleXOAuthCallback(
  code: string,
  state: string,
  codeVerifier: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    // Verify state
    const stateData = oauthStates.get(state);
    if (!stateData) {
      return { success: false, error: 'Invalid state parameter' };
    }
    
    // Clean up state
    oauthStates.delete(state);
    
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, codeVerifier);
    
    // Get user info
    const userInfo = await getXUserInfo(tokens.accessToken);
    
    // Store platform connection
    await storage.createPlatform({
      userId: stateData.userId,
      name: 'X (Twitter)',
      icon: 'twitter',
      color: '#1DA1F2',
      isConnected: true,
      accountId: userInfo.id,
      accessToken: tokens.accessToken,
    });
    
    return { success: true, userId: stateData.userId };
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Post to X.com using OAuth 2.0
 */
export async function postToXWithOAuth(
  accessToken: string,
  content: string
): Promise<{ success: boolean; tweetId?: string; error?: string }> {
  try {
    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: content,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to post tweet: ${error}`);
    }
    
    const data = await response.json();
    
    return {
      success: true,
      tweetId: data.data.id,
    };
  } catch (error: any) {
    console.error('Error posting to X:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
