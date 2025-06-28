import { Pool } from 'pg';

const SUPABASE_URL = "postgresql://postgres.cqfzgjefafqwcjzvfnaq:5sXK3P6jx8To@aws-0-eu-west-3.pooler.supabase.com:6543/postgres";

console.log('🧪 Testing Supabase connection with pg driver...');

async function testSupabaseConnection() {
  try {
    const pool = new Pool({ 
      connectionString: SUPABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });

    console.log('📡 Connecting to Supabase...');
    
    // Test simple query
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Connection successful!');
    console.log('⏰ Server time:', result.rows[0].current_time);
    
    // Test tables exist
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Tables found:', tables.rows.length);
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Test users table
    const userCount = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log('👥 Users in database:', userCount.rows[0].count);
    
    await pool.end();
    console.log('🎉 Supabase test completed successfully!');
    
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    process.exit(1);
  }
}

testSupabaseConnection();