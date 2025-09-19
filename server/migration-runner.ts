#!/usr/bin/env tsx
import { pool } from "./db";
import fs from "fs/promises";
import path from "path";

const MIGRATION_DIR = path.join(process.cwd(), "migrations");

interface MigrationResult {
  file: string;
  success: boolean;
  duration: number;
  error?: string;
}

/**
 * Parse SQL file into executable statements
 * Properly handles DO $$ blocks and other PostgreSQL-specific syntax
 */
function parseSQLStatements(sql: string): string[] {
  const statements: string[] = [];
  let currentStatement = '';
  let inDollarQuote = false;
  let dollarQuoteTag = '';

  const lines = sql.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip comments
    if (trimmedLine.startsWith('--') && !inDollarQuote) {
      continue;
    }

    // Check for dollar quote start/end
    const dollarQuoteMatch = line.match(/\$([^$]*)\$/g);
    if (dollarQuoteMatch) {
      for (const match of dollarQuoteMatch) {
        if (!inDollarQuote) {
          inDollarQuote = true;
          dollarQuoteTag = match;
        } else if (match === dollarQuoteTag) {
          inDollarQuote = false;
          dollarQuoteTag = '';
        }
      }
    }

    currentStatement += line + '\n';

    // Check if statement is complete
    if (!inDollarQuote && trimmedLine.endsWith(';')) {
      const statement = currentStatement.trim();
      if (statement && !statement.startsWith('--')) {
        statements.push(statement);
      }
      currentStatement = '';
    }
  }

  // Add any remaining statement
  if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
  }

  return statements;
}

/**
 * Run a single migration file
 */
async function runMigration(filename: string): Promise<MigrationResult> {
  const filePath = path.join(MIGRATION_DIR, filename);
  const startTime = Date.now();

  try {
    console.log(`\n📋 Running migration: ${filename}`);
    console.log('━'.repeat(50));

    const sqlContent = await fs.readFile(filePath, 'utf-8');
    const statements = parseSQLStatements(sqlContent);

    console.log(`   Parsed ${statements.length} statement(s)`);

    let successCount = 0;
    let skipCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 50).replace(/\n/g, ' ');

      try {
        // Execute the statement
        await pool.query(statement);
        successCount++;

        // Log progress
        if (statement.toUpperCase().includes('RAISE NOTICE')) {
          // These are informational DO blocks
          console.log(`   ℹ️  Statement ${i + 1}: Executed info block`);
        } else if (statement.toUpperCase().startsWith('CREATE')) {
          console.log(`   ✅ Statement ${i + 1}: Created object`);
        } else if (statement.toUpperCase().startsWith('ALTER')) {
          console.log(`   ✅ Statement ${i + 1}: Altered table/constraint`);
        } else if (statement.toUpperCase().startsWith('UPDATE')) {
          console.log(`   ✅ Statement ${i + 1}: Updated data`);
        } else if (statement.toUpperCase().startsWith('DO')) {
          console.log(`   ✅ Statement ${i + 1}: Executed DO block`);
        } else {
          console.log(`   ✅ Statement ${i + 1}: ${preview}...`);
        }
      } catch (error: any) {
        // Handle specific error codes
        const errorCode = error.code;
        const errorMessage = error.message || '';

        // Ignore benign errors
        if (
          errorCode === '42P07' || // relation already exists
          errorCode === '42710' || // duplicate object
          errorCode === '42P01' || // undefined table (for DROP IF EXISTS)
          errorMessage.includes('already exists') ||
          errorMessage.includes('does not exist') && statement.includes('IF EXISTS')
        ) {
          skipCount++;
          console.log(`   ⏭️  Statement ${i + 1}: Skipped (already exists or not applicable)`);
          continue;
        }

        // Report actual errors
        console.error(`\n   ❌ Statement ${i + 1} failed:`);
        console.error(`      Preview: ${preview}...`);
        console.error(`      Error: ${errorMessage}`);
        console.error(`      Code: ${errorCode}`);

        throw error;
      }
    }

    const duration = Date.now() - startTime;
    console.log(`\n   ✨ Migration complete: ${successCount} executed, ${skipCount} skipped`);
    console.log(`   ⏱️  Duration: ${(duration / 1000).toFixed(2)}s`);

    return { file: filename, success: true, duration };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`\n   ❌ Migration failed after ${(duration / 1000).toFixed(2)}s`);
    return { file: filename, success: false, duration, error: error.message };
  }
}

/**
 * Check database connection and current state
 */
async function checkDatabase(): Promise<void> {
  console.log('\n🔌 Checking database connection...');

  try {
    const versionResult = await pool.query('SELECT version()');
    const version = versionResult.rows[0]?.version || 'Unknown';
    console.log(`   ✅ Connected to: ${version.split(' ').slice(0, 2).join(' ')}`);

    // Check for problematic tier values
    const tierCheck = await pool.query(`
      SELECT tier, COUNT(*) as count
      FROM users
      WHERE tier IS NULL
         OR tier NOT IN ('lite', 'free', 'pro_trial', 'trial', 'starter', 'pro', 'professional', 'business')
      GROUP BY tier
      ORDER BY count DESC
    `);

    if (tierCheck.rows.length > 0) {
      console.log('\n   ⚠️  Found invalid tier values:');
      for (const row of tierCheck.rows) {
        console.log(`      - "${row.tier || 'NULL'}": ${row.count} users`);
      }
    } else {
      console.log('   ✅ All tier values are valid');
    }

    // Check existing constraints
    const constraintCheck = await pool.query(`
      SELECT conname
      FROM pg_constraint
      WHERE conname = 'chk_user_tier'
    `);

    if (constraintCheck.rows.length > 0) {
      console.log('   ⚠️  Tier constraint already exists (will be dropped and recreated)');
    }

  } catch (error: any) {
    console.error('   ❌ Database connection failed:', error.message);
    throw error;
  }
}

/**
 * Main migration runner
 */
async function main() {
  console.log('\n🚀 MyAiMediaManager Migration Runner v2.0');
  console.log('=' .repeat(50));

  try {
    // Check database state
    await checkDatabase();

    // Get migration files
    const files = await fs.readdir(MIGRATION_DIR);
    const sqlFiles = files
      .filter(f => f.endsWith('.sql'))
      .sort(); // Sort to ensure order

    console.log(`\n📂 Found ${sqlFiles.length} migration files`);

    // Ensure emergency fix runs first
    const emergencyFix = '0000_emergency_tier_fix.sql';
    const orderedFiles = sqlFiles.filter(f => f === emergencyFix)
      .concat(sqlFiles.filter(f => f !== emergencyFix).sort());

    console.log('\n📋 Migration order:');
    orderedFiles.forEach((f, i) => {
      console.log(`   ${i + 1}. ${f}`);
    });

    // Run migrations
    const results: MigrationResult[] = [];

    for (const file of orderedFiles) {
      const result = await runMigration(file);
      results.push(result);

      if (!result.success) {
        console.error(`\n⛔ Stopping due to failed migration: ${file}`);
        break;
      }
    }

    // Summary
    console.log('\n' + '=' .repeat(50));
    console.log('📊 MIGRATION SUMMARY');
    console.log('=' .repeat(50));

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`\n✅ Successful: ${successful.length}`);
    for (const r of successful) {
      console.log(`   - ${r.file} (${(r.duration / 1000).toFixed(2)}s)`);
    }

    if (failed.length > 0) {
      console.log(`\n❌ Failed: ${failed.length}`);
      for (const r of failed) {
        console.log(`   - ${r.file}: ${r.error}`);
      }
      process.exit(1);
    }

    // Final validation
    console.log('\n🔍 Final validation...');
    const finalCheck = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE tier IS NULL OR tier NOT IN ('lite', 'free', 'pro_trial', 'trial', 'starter', 'pro', 'professional', 'business')) as invalid_tiers,
        (SELECT COUNT(*) FROM pg_constraint WHERE conname = 'chk_user_tier') as constraint_exists
    `);

    const validation = finalCheck.rows[0];
    console.log(`   Total users: ${validation.total_users}`);
    console.log(`   Invalid tiers: ${validation.invalid_tiers}`);
    console.log(`   Constraint exists: ${validation.constraint_exists > 0 ? 'Yes' : 'No'}`);

    if (validation.invalid_tiers > 0) {
      console.error('\n⚠️  WARNING: Invalid tier values still exist!');
      console.error('   The deployment may fail when applying constraints.');
    } else {
      console.log('\n✨ All migrations completed successfully!');
      console.log('   Database is ready for deployment.');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  }
}

// Export for use in other modules
export { runMigration, parseSQLStatements, checkDatabase };

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}