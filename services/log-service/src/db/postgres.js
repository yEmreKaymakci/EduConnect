const { Pool } = require('pg');

const pool = new Pool({
  connectionString: `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@postgres:5432/${process.env.POSTGRES_DB}`,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[PostgreSQL] Unexpected client error:', err.message);
});

/**
 * Insert a log entry into audit_logs table
 * @param {Object} payload - Log payload from RabbitMQ message
 */
async function insertLog(payload) {
  const client = await pool.connect();
  try {
    await client.query(
      'INSERT INTO audit_logs(value) VALUES($1::jsonb)',
      [JSON.stringify(payload)]
    );
  } finally {
    client.release();
  }
}

async function testConnection() {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    console.log('[PostgreSQL] Connection established');
  } finally {
    client.release();
  }
}

module.exports = { pool, insertLog, testConnection };
