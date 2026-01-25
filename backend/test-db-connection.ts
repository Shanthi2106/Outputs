/**
 * Quick test script to verify DATABASE_URL is being read correctly
 */

import dotenv from 'dotenv';
import { Pool } from 'pg';

// Load .env file
dotenv.config({ path: '.env' });

console.log('=== Testing DATABASE_URL Configuration ===\n');

// Check if DATABASE_URL exists
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL is not set in environment variables');
  console.error('\nPlease check:');
  console.error('1. Is DATABASE_URL in your .env file?');
  console.error('2. Is the .env file in the backend/ directory?');
  console.error('3. Did you restart the server after updating .env?');
  process.exit(1);
}

console.log('✓ DATABASE_URL is set');
console.log(`  Value: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`);

// Test connection
console.log('\n🔌 Testing PostgreSQL connection...');

const pool = new Pool({
  connectionString: databaseUrl,
  connectionTimeoutMillis: 5000,
});

pool.connect()
  .then(async (client) => {
    try {
      // Test query
      const result = await client.query('SELECT version()');
      console.log('✓ Successfully connected to PostgreSQL');
      console.log(`  Version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);

      // Check for pgvector extension
      console.log('\n📦 Checking for pgvector extension...');
      const extResult = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_extension WHERE extname = 'vector'
        ) as exists
      `);

      if (extResult.rows[0].exists) {
        console.log('✓ pgvector extension is installed');
      } else {
        console.log('⚠️  pgvector extension is not installed');
        console.log('   Run: npm run setup-vector-db');
      }

      console.log('\n✅ Database connection test successful!');
    } finally {
      client.release();
      await pool.end();
    }
  })
  .catch((error) => {
    console.error('\n❌ Failed to connect to PostgreSQL');
    console.error(`   Error: ${error.message}`);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Connection refused. Check:');
      console.error('   - Is your PostgreSQL server running?');
      console.error('   - Is the host and port correct?');
    } else if (error.message.includes('authentication')) {
      console.error('\n💡 Authentication failed. Check:');
      console.error('   - Is the username and password correct?');
    } else if (error.message.includes('database')) {
      console.error('\n💡 Database error. Check:');
      console.error('   - Does the database exist?');
      console.error('   - Does the user have access?');
    }
    
    process.exit(1);
  });
