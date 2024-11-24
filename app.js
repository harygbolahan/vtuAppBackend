const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const dataRoutes = require("./routes/data");
const airtimeRoutes = require("./routes/airtime");
const dataPlanRoutes = require("./routes/dataPlans");
const cableRoutes = require("./routes/cable");
const cablePlanRoutes = require("./routes/cablePlans");
const electricDiscoRoutes = require("./routes/electricDisco");
require('dotenv').config();

// const productRoutes = require("./routes/product");
// const authRoutes = require("./routes/auth");
// const jobRoutes = require("./routes/jobs");
// const companyRoutes = require("./routes/company");
// const errorHandler = require("./middleware/error");
// const { cloudinaryConfig } = require("./utils/cloudinary");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
// app.use(cors("*"));
app.use(cors({
  origin: 'https://vtu-app-frontend.vercel.app', // Replace this with your frontend's URL
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true // Allow cookies to be sent from the client if needed
}));

// app.use("*", cloudinaryConfig);
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
app.use("/api/v1/data", dataRoutes)
app.use("/api/v1/airtime", airtimeRoutes)
app.use("/api/v1/dataPlans", dataPlanRoutes)
app.use("/api/v1/cable", cableRoutes)
app.use("/api/v1/cablePlans", cablePlanRoutes)
app.use("/api/v1/electricDisco", electricDiscoRoutes)



// app.use("/api/v1/products", productRoutes);
// app.use("/api/v1/jobs", jobRoutes);
// app.use("/api/v1/company", companyRoutes);

app.all("*", (req, res) => {
  res.status(404).json({
    status: "fail",
    message: `Can't find ${req.originalUrl} with meth ${req.method} on this server. Route not defined`,
  });
});


// Calling our error handler
// app.use(errorHandler);

module.exports = app;
