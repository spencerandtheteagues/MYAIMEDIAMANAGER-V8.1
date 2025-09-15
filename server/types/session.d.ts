import "express-session";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    user?: {
      id: string;
      email: string | null;
      username: string;
      businessName: string | null;
      role: string;
      tier: string;
      isAdmin: boolean;
    };
    returnTo?: string;
    oauthState?: string; // For CSRF protection in OAuth flows
  }
}