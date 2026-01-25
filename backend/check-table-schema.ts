/**
 * Check the current schema of document_chunks table
 */

import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkSchema() {
  const client = await pool.connect();
  try {
    // Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'document_chunks'
      )
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('Table document_chunks does not exist');
      return;
    }

    // Get all columns
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'document_chunks'
      ORDER BY ordinal_position
    `);

    console.log('\nCurrent table schema:');
    console.log('Columns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });

    // Check if created_at exists
    const hasCreatedAt = columns.rows.some(col => col.column_name === 'created_at');
    if (!hasCreatedAt) {
      console.log('\n⚠️  created_at column is missing!');
      console.log('   The fix will add it automatically on next server start.');
    } else {
      console.log('\n✓ created_at column exists');
    }

  } finally {
    client.release();
    await pool.end();
  }
}

checkSchema().catch(console.error);
