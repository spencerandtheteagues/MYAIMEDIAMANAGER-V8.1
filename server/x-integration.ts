/**
 * X.com (Twitter) Integration
 * Uses OAuth 1.0a for posting tweets
 */

import crypto from 'crypto';
import axios from 'axios';

// X.com API credentials from environment
const credentials = {
  apiKey: process.env.X_API_KEY || '',
  apiKeySecret: process.env.X_API_KEY_SECRET || '',
  accessToken: process.env.X_ACCESS_TOKEN || '',
  accessTokenSecret: process.env.X_ACCESS_TOKEN_SECRET || '',
  bearerToken: process.env.X_BEARER_TOKEN || '',
};

interface OAuthParams {
  oauth_consumer_key: string;
  oauth_nonce: string;
  oauth_signature?: string;
  oauth_signature_method: string;
  oauth_timestamp: string;
  oauth_token: string;
  oauth_version: string;
}

function generateNonce(): string {
  return crypto.randomBytes(32).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
}

function generateTimestamp(): string {
  return Math.floor(Date.now() / 1000).toString();
}

function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

function generateSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  // Sort parameters alphabetically
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${percentEncode(key)}=${percentEncode(params[key])}`)
    .join('&');

  // Create signature base string
  const signatureBase = `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(sortedParams)}`;

  // Create signing key
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;

  // Generate signature
  const signature = crypto
    .createHmac('sha1', signingKey)
    .update(signatureBase)
    .digest('base64');

  return signature;
}

function generateOAuthHeader(params: OAuthParams): string {
  const headerParams = Object.keys(params)
    .sort()
    .map(key => `${percentEncode(key)}="${percentEncode(params[key as keyof OAuthParams] || '')}"`)
    .join(', ');

  return `OAuth ${headerParams}`;
}

export async function postToX(content: string, mediaIds?: string[]): Promise<any> {
  try {
    const url = 'https://api.twitter.com/2/tweets';
    const method = 'POST';

    // Generate OAuth parameters
    const oauthParams: OAuthParams = {
      oauth_consumer_key: credentials.apiKey,
      oauth_nonce: generateNonce(),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: generateTimestamp(),
      oauth_token: credentials.accessToken,
      oauth_version: '1.0',
    };

    // Create request body
    const requestBody: any = {
      text: content,
    };

    if (mediaIds && mediaIds.length > 0) {
      requestBody.media = {
        media_ids: mediaIds
      };
    }

    // For OAuth 1.0a with JSON body, we don't include body params in signature
    const signatureParams = { ...oauthParams };

    // Generate signature
    oauthParams.oauth_signature = generateSignature(
      method,
      url,
      signatureParams,
      credentials.apiKeySecret,
      credentials.accessTokenSecret
    );

    // Generate OAuth header
    const authHeader = generateOAuthHeader(oauthParams);

    // Make the request
    const response = await axios({
      method,
      url,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'User-Agent': 'MyAiMediaMgr/1.0',
      },
      data: requestBody,
    });

    return {
      success: true,
      data: response.data,
      tweetId: response.data.data?.id,
      url: `https://x.com/i/web/status/${response.data.data?.id}`,
    };
  } catch (error: any) {
    console.error('X.com posting error:', error.response?.data || error.message);
    
    // Fallback to v1.1 API if v2 fails
    if (error.response?.status === 403 || error.response?.status === 401) {
      return postToXv1(content);
    }
    
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
}

// Fallback to v1.1 API
async function postToXv1(content: string): Promise<any> {
  try {
    const url = 'https://api.twitter.com/1.1/statuses/update.json';
    const method = 'POST';

    const oauthParams: OAuthParams = {
      oauth_consumer_key: credentials.apiKey,
      oauth_nonce: generateNonce(),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: generateTimestamp(),
      oauth_token: credentials.accessToken,
      oauth_version: '1.0',
    };

    // For v1.1, include the status parameter in signature
    const requestParams = {
      status: content,
    };

    const signatureParams = { ...oauthParams, ...requestParams };

    // Generate signature
    oauthParams.oauth_signature = generateSignature(
      method,
      url,
      signatureParams,
      credentials.apiKeySecret,
      credentials.accessTokenSecret
    );

    // Generate OAuth header
    const authHeader = generateOAuthHeader(oauthParams);

    // Make the request with form-encoded body
    const response = await axios({
      method,
      url,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: `status=${percentEncode(content)}`,
    });

    return {
      success: true,
      data: response.data,
      tweetId: response.data.id_str,
      url: `https://x.com/i/web/status/${response.data.id_str}`,
    };
  } catch (error: any) {
    console.error('X.com v1.1 posting error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
}

// Test connection by verifying credentials
export async function verifyXCredentials(): Promise<boolean> {
  try {
    const url = 'https://api.twitter.com/1.1/account/verify_credentials.json';
    
    const oauthParams: OAuthParams = {
      oauth_consumer_key: credentials.apiKey,
      oauth_nonce: generateNonce(),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: generateTimestamp(),
      oauth_token: credentials.accessToken,
      oauth_version: '1.0',
    };

    oauthParams.oauth_signature = generateSignature(
      'GET',
      url,
      oauthParams,
      credentials.apiKeySecret,
      credentials.accessTokenSecret
    );

    const authHeader = generateOAuthHeader(oauthParams);

    const response = await axios({
      method: 'GET',
      url,
      headers: {
        'Authorization': authHeader,
      },
    });

    console.log('X.com connected as @' + response.data.screen_name);
    return true;
  } catch (error: any) {
    console.error('X.com verification failed:', error.message);
    return false;
  }
}