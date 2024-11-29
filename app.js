const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
// const rateLimit = require("express-rate-limit");
require('dotenv').config();

const authRoutes = require('./Auth/authRoutes');
const userRoutes = require("./User/userRoutes");
const dataRoutes = require("./Data/dataRoutes");
const airtimeRoutes = require("./Airtime/airtimeRoutes");
const dataPlanRoutes = require("./Data/dataPlansRoutes");
const cableRoutes = require("./Cable/cableRoutes");
const cablePlanRoutes = require("./Cable/cablePlansRoutes");
const electricDiscoRoutes = require("./Electric/electricDiscoRoutes");

// Import Payvessel Webhook Handler
const { handlePayvesselWebhook } = require('./webhooks/payvesselWebhook');
const { handleBillstackWebhook } = require('./webhooks/billstackWebhook');
const monnifyRoutes = require("./Monnify/monnifyRoutes");

const app = express();

// Middleware
app.use(helmet());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(morgan("dev"));
app.use(cors());

// Rate Limiter
// const limiter = rateLimit({
//   max: 100,
//   windowMs: 60 * 60 * 1000, // 1 hour
//   message: "Too many requests from this IP, please try again later.",
// });
// app.use("/api", limiter);

// Routes
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to my VTU App",
  });
});

app.get("/api/v1", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to VTU API",
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/data", dataRoutes);
app.use("/api/v1/airtime", airtimeRoutes);
app.use("/api/v1/dataPlans", dataPlanRoutes);
app.use("/api/v1/cable", cableRoutes);
app.use("/api/v1/cablePlans", cablePlanRoutes);
app.use("/api/v1/electricDisco", electricDiscoRoutes);

// Payvessel Webhook Route
app.post('/api/v1/payvessel-webhook', handlePayvesselWebhook);


// BillStack Webhook Route
app.post('/api/v1/billstack-webhook', handleBillstackWebhook);

app.use('/api/v1/monnify', monnifyRoutes);

app.get('api/v1/data/status/:jobId', async (req, res) => {
  const { jobId } = req.params;
  try {
    const job = await purchaseQueue.getJob(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const status = await job.getState(); // e.g., 'waiting', 'active', 'completed', 'failed'
    const result = status === 'completed' ? await job.returnvalue : null;

    res.status(200).json({ status, result });
  } catch (error) {
    console.error(`Error fetching job status: ${error.message}`);
    res.status(500).json({ message: 'Failed to fetch job status' });
  }
});


// 404 Route Not Found
app.all("*", (req, res) => {
  res.status(404).json({
    status: "fail",
    message: `Can't find ${req.originalUrl} with method ${req.method} on this server. Route not defined`,
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: "error",
    message: "Something went wrong on the server.",
  });
});

module.exports = app;
