const { Queue } = require('bullmq');

// Correct Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null, // Fix for BullMQ
};

// Initialize the queue
const purchaseQueue = new Queue('dataPurchaseQueue', { connection: redisConfig });

module.exports = purchaseQueue;
