import "express-session";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    user?: {
      id: string;
      email: string;
      username: string;
      businessName?: string | null;
      role: string;
      tier: string;
      isAdmin: boolean;
    };
    returnTo?: string;
    returnUrl?: string;
    oauthState?: string;
  }
}