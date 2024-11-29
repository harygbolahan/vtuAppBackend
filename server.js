const dotenv = require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const port = process.env.PORT || 3000;
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const express = require('express');
const purchaseWorker = require('./Data/dataWorker');
const purchaseQueue = require('./Data/dataQueue');



connectDB();

const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null, // Fix for BullMQ
};

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
    queues: [new BullMQAdapter(purchaseQueue)],
    serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log('Purchase worker initialized and ready to process queued jobs...');
  console.log('Bull Board running on http://localhost:3000/admin/queues')
});


// purchaseWorker.start();

