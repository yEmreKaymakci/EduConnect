const express = require('express');
const { testConnection } = require('./db/postgres');
const { startConsumers } = require('./consumers/rabbitmq');
const logger = require('./logger');

const app = express();
const PORT = process.env.PORT || 8005;

app.use(express.json());

// Health check
app.get('/health', async (req, res) => {
  try {
    await testConnection();
    res.json({ service: 'log-service', status: 'running', database: 'healthy' });
  } catch (err) {
    res.status(503).json({ service: 'log-service', status: 'running', database: `unhealthy: ${err.message}` });
  }
});

// Start
async function main() {
  try {
    logger.info('🚀 Log Service starting...');
    await testConnection();
    await startConsumers();
    app.listen(PORT, () => logger.info(`✅ Log Service listening on port ${PORT}`));
  } catch (err) {
    logger.error(`❌ Failed to start Log Service: ${err.message}`);
    process.exit(1);
  }
}

main();
