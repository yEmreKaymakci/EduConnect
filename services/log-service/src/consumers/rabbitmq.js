const amqp = require('amqplib');
const { insertLog } = require('../db/postgres');
const logger = require('../logger');

const RABBITMQ_URL = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@rabbitmq:5672/`;

// Queues this service consumes from
const QUEUES = [
  'log.all',
  'user.created',
  'user.updated',
  'user.deleted',
  'auth.login',
  'file.uploaded',
  'file.analyzed',
  'internship.applied',
  'internship.approved',
  'permission.changed',
];

let channel = null;
let connection = null;

async function connectWithRetry(retries = 10, delayMs = 5000) {
  for (let i = 1; i <= retries; i++) {
    try {
      connection = await amqp.connect(RABBITMQ_URL);
      channel = await connection.createChannel();

      connection.on('error', (err) => {
        logger.error('[RabbitMQ] Connection error:', err.message);
      });

      connection.on('close', () => {
        logger.warn('[RabbitMQ] Connection closed, reconnecting...');
        setTimeout(() => connectWithRetry(), delayMs);
      });

      logger.info('[RabbitMQ] Connected successfully');
      return;
    } catch (err) {
      logger.error(`[RabbitMQ] Connection attempt ${i}/${retries} failed: ${err.message}`);
      if (i < retries) await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error('[RabbitMQ] Failed to connect after all retries');
}

async function startConsumers() {
  await connectWithRetry();

  await channel.prefetch(10);

  for (const queue of QUEUES) {
    await channel.assertQueue(queue, { durable: true });

    channel.consume(queue, async (msg) => {
      if (!msg) return;

      try {
        const payload = JSON.parse(msg.content.toString());

        // Enrich log entry
        const logEntry = {
          ...payload,
          queue_name: queue,
          received_at: new Date().toISOString(),
          log_service: 'log-service',
        };

        await insertLog(logEntry);
        logger.info(`[Consumer:${queue}] Logged: ${JSON.stringify({ event: payload.event || queue, user_id: payload.user_id })}`);

        channel.ack(msg);

        // RPC reply if correlation_id present
        if (msg.properties.replyTo && msg.properties.correlationId) {
          channel.sendToQueue(
            msg.properties.replyTo,
            Buffer.from(JSON.stringify({ success: true, logged: true })),
            { correlationId: msg.properties.correlationId }
          );
        }
      } catch (err) {
        logger.error(`[Consumer:${queue}] Error processing message: ${err.message}`);
        channel.nack(msg, false, false); // dead-letter
      }
    });

    logger.info(`[RabbitMQ] Consuming from queue: ${queue}`);
  }
}

module.exports = { startConsumers };
