const AppError = require("./../utils/AppError");

// Duplicate value in mongoDB
const handleDuplicateError = (err) => {
  const dupKey = Object.keys(err.keyValue)[0]; //title
  const dupValue = Object.values(err.keyValue)[0]; //bata yahoo loo
  console.log(dupValue);
  const message = `${dupKey} with value "${dupValue}"  exist already`;
  return new AppError(message, 400);
};

// Cast id error
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

// Validation Error
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((ele) => ele.message);
  const message = `Invalid Input Data: ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const handleJWTError = (err) => {
  return new AppError("Invalid token, please login again", 401);
};

const handleJWTExpiredError = (err) => {
  return new AppError("Token has expired. Please login again", 401);
};

const sendDevError = async (err, res) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    err,
  });
};

const sendProdError = async (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Handle other errors not handle by the develope
    res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

const errorHandler = async (err, req, res, next) => {
  //   console.log("heyyy error ooo", err);
  if (process.env.NODE_ENV === "development") {
    sendDevError(err, res);
  } else {
    let error = { ...err };
    if (err.code === 11000) {
      error = handleDuplicateError(err);
    } else if (err.name === "CastError") {
      error = handleCastErrorDB(err);
    } else if (err.name === "ValidationError") {
      error = handleValidationErrorDB(err);
    }
    if (err.name === "JsonWebTokenError") {
      error = handleJWTError(err);
    }
    if (err.name === "TokenExpiredError") {
      error = handleJWTExpiredError(err);
    }
    sendProdError(error, res);
  }
  next();
};

module.exports = errorHandler;
