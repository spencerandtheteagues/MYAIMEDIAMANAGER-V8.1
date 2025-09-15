// server/config.ts
import dotenv from 'dotenv';

// Load environment variables from .env file in development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// --- Define the expected environment variables ---
const requiredVariables = [
  'NODE_ENV',
  'DATABASE_URL',
  'SESSION_SECRET',
  'STRIPE_SECRET_KEY',
  'VITE_STRIPE_PUBLIC_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'GCLOUD_PROJECT_ID',
  'GCLOUD_LOCATION',
  'GCLOUD_STORAGE_BUCKET',
  'GCLOUD_KEY_FILE',
];

// --- Validate the environment variables ---
const missingVariables = requiredVariables.filter(
  (variable) => !process.env[variable]
);

if (missingVariables.length > 0) {
  // In production, Railway will restart the service, so we throw an error.
  // This prevents a broken version from being deployed.
  throw new Error(
    `FATAL: Missing required environment variables:\n- ${missingVariables.join(
      '\n- '
    )}
Please check your .env file or Railway project variables.`
  );
}

// --- Export the validated configuration ---
export const config = {
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT || 5000,
  databaseUrl: process.env.DATABASE_URL,
  sessionSecret: process.env.SESSION_SECRET,
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publicKey: process.env.VITE_STRIPE_PUBLIC_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  gcloud: {
    projectId: process.env.GCLOUD_PROJECT_ID,
    location: process.env.GCLOUD_LOCATION,
    storageBucket: process.env.GCLOUD_STORAGE_BUCKET,
    keyFile: process.env.GCLOUD_KEY_FILE,
  },
};

console.log('✅ Environment configuration loaded and validated successfully.');
