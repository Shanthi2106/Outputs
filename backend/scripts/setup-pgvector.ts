/**
 * Setup script for PostgreSQL pgvector extension
 * This script enables the pgvector extension in your PostgreSQL database
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import { logger } from '../src/utils/logger';

dotenv.config();

async function setupPgVector() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set in .env file');
    console.error('   Please set DATABASE_URL to your PostgreSQL connection string');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
  });

  try {
    console.log('🔌 Connecting to PostgreSQL database...');
    const client = await pool.connect();

    try {
      // Check PostgreSQL version
      const versionResult = await client.query('SELECT version()');
      console.log('✓ Connected to PostgreSQL');
      console.log(`  Version: ${versionResult.rows[0].version.split(' ')[0]} ${versionResult.rows[0].version.split(' ')[1]}`);

      // Check if pgvector extension exists
      console.log('\n📦 Checking for pgvector extension...');
      const extensionCheck = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_available_extensions WHERE name = 'vector'
        ) as available
      `);

      if (!extensionCheck.rows[0].available) {
        console.error('❌ pgvector extension is not available in your PostgreSQL installation');
        console.error('   Please install pgvector extension:');
        console.error('   - For local PostgreSQL: https://github.com/pgvector/pgvector#installation');
        console.error('   - For cloud providers: Check if pgvector is available in your plan');
        console.error('   - For Neon/Supabase: pgvector is usually pre-installed');
        process.exit(1);
      }

      // Enable pgvector extension
      console.log('🔧 Enabling pgvector extension...');
      await client.query('CREATE EXTENSION IF NOT EXISTS vector');
      console.log('✓ pgvector extension enabled');

      // Verify extension is enabled
      const verifyResult = await client.query(`
        SELECT extversion FROM pg_extension WHERE extname = 'vector'
      `);

      if (verifyResult.rows.length > 0) {
        console.log(`✓ pgvector version: ${verifyResult.rows[0].extversion}`);
      }

      // Check if document_chunks table exists
      console.log('\n📊 Checking for document_chunks table...');
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'document_chunks'
        )
      `);

      if (tableCheck.rows[0].exists) {
        console.log('✓ document_chunks table already exists');
      } else {
        console.log('ℹ️  document_chunks table will be created automatically when the server starts');
      }

      console.log('\n✅ pgvector setup complete!');
      console.log('   Your database is ready for vector storage.');
      console.log('   Start your backend server to initialize the vector tables.');

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error setting up pgvector:', error);
    if (error instanceof Error) {
      if (error.message.includes('extension') || error.message.includes('vector')) {
        console.error('\n💡 Tip: Make sure pgvector is installed in your PostgreSQL database');
        console.error('   For cloud providers, check if pgvector is available in your plan');
      } else if (error.message.includes('connection') || error.message.includes('ECONNREFUSED')) {
        console.error('\n💡 Tip: Check your DATABASE_URL connection string');
        console.error('   Format: postgresql://user:password@host:port/database');
      }
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupPgVector().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
