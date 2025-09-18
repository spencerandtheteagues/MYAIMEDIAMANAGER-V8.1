#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

console.log(`${colors.bright}${colors.blue}╔═══════════════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.bright}${colors.blue}║          Database Configuration Check                 ║${colors.reset}`);
console.log(`${colors.bright}${colors.blue}╚═══════════════════════════════════════════════════════╝${colors.reset}\n`);

// Check .env file
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log(`${colors.green}✓ Found .env file${colors.reset}`);
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const hasDatabase = envContent.includes('DATABASE_URL=') && !envContent.includes('# DATABASE_URL=');

  if (hasDatabase) {
    console.log(`${colors.green}✓ DATABASE_URL is configured in .env${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠ DATABASE_URL is commented out in .env${colors.reset}`);
  }
} else {
  console.log(`${colors.yellow}⚠ No .env file found${colors.reset}`);
}

// Check environment variable
const dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
  console.log(`${colors.green}✓ DATABASE_URL is set in environment${colors.reset}`);

  // Parse and display connection info (hide password)
  try {
    const url = new URL(dbUrl);
    console.log(`  Host: ${url.hostname}`);
    console.log(`  Port: ${url.port || '5432'}`);
    console.log(`  Database: ${url.pathname.substring(1)}`);
    console.log(`  Username: ${url.username}`);
  } catch (e) {
    console.log(`  Connection string format appears invalid`);
  }
} else {
  console.log(`${colors.red}✗ DATABASE_URL is not set in environment${colors.reset}`);
}

// Check current storage mode
console.log(`\n${colors.cyan}Current Storage Configuration:${colors.reset}`);
if (dbUrl) {
  console.log(`  ${colors.green}Using: PostgreSQL Database (production mode)${colors.reset}`);
  console.log(`  ${colors.cyan}Migrations: Required and will be applied${colors.reset}`);
} else {
  console.log(`  ${colors.yellow}Using: In-Memory Storage (development mode)${colors.reset}`);
  console.log(`  ${colors.yellow}Migrations: Not applicable for in-memory storage${colors.reset}`);
}

// Provide instructions
console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.bright}Instructions:${colors.reset}\n`);

if (!dbUrl) {
  console.log(`To enable database migrations, you need to:`);
  console.log(`\n1. ${colors.cyan}Set up a PostgreSQL database${colors.reset}`);
  console.log(`   - Use Neon (https://neon.tech) for serverless PostgreSQL`);
  console.log(`   - Or use a local PostgreSQL instance`);
  console.log(`   - Or use Render's PostgreSQL service`);

  console.log(`\n2. ${colors.cyan}Configure DATABASE_URL${colors.reset}`);
  console.log(`   Option A: Edit .env file and uncomment DATABASE_URL`);
  console.log(`   ${colors.yellow}Example: DATABASE_URL=postgresql://user:pass@host/dbname${colors.reset}`);
  console.log(`\n   Option B: Set as environment variable`);
  console.log(`   ${colors.yellow}Windows: set DATABASE_URL=postgresql://user:pass@host/dbname${colors.reset}`);
  console.log(`   ${colors.yellow}Linux/Mac: export DATABASE_URL=postgresql://user:pass@host/dbname${colors.reset}`);

  console.log(`\n3. ${colors.cyan}Run migrations${colors.reset}`);
  console.log(`   ${colors.yellow}node apply-migrations.js${colors.reset}`);

  console.log(`\n${colors.bright}${colors.yellow}Note: The application works without a database using in-memory storage.${colors.reset}`);
  console.log(`${colors.yellow}This is suitable for development and testing.${colors.reset}`);
} else {
  console.log(`${colors.green}✓ Database is configured!${colors.reset}`);
  console.log(`\nTo apply the migrations, run:`);
  console.log(`  ${colors.yellow}node apply-migrations.js${colors.reset}`);

  console.log(`\n${colors.cyan}The migrations will:${colors.reset}`);
  console.log(`  • Add 45+ performance indexes`);
  console.log(`  • Add 30+ data integrity constraints`);
  console.log(`  • Create security audit tables`);
  console.log(`  • Set up triggers for audit logging`);
  console.log(`  • Create functions for rate limiting`);

  console.log(`\n${colors.green}Expected benefits:${colors.reset}`);
  console.log(`  • 10-100x query performance improvement`);
  console.log(`  • Better data integrity`);
  console.log(`  • Complete audit trail`);
  console.log(`  • Enhanced security`);
}

console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);