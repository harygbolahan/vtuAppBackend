const Users = require("../User/userModels");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");

const protectRoute = async (req, res, next) => {
  try {
    let token;

    // Extract the token from the Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if the token is missing
    if (!token) {
      return next(new AppError('You are not logged in, please login', 401));
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.jwtSecret);
    console.log('decoded', decoded);

    // Check if the user exists with the decoded ID
    const user = await Users.findById(decoded.id);

    if (!user) {
      return next(new AppError('User with the specified ID not found', 404));
    }

    // Attach the user to the request object for further use
    req.user = user;
    next();
  } catch (error) {
    console.log("Protect route Error", error);
    
      if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token, please log in again', 401));
    }

    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Your token has expired, please log in again', 401));
    }

    // Generic error fallback
    return next(error);
  }
};

// const protectRoute = async (req, res, next) => {
//   try {
//     let token;

//     // Extract the token from the Authorization header
//     if (
//       req.headers.authorization &&
//       req.headers.authorization.startsWith("Bearer")
//     ) {
//       token = req.headers.authorization.split(" ")[1];
//     }

//     // Check if the token is missing
//     if (!token) {
//       return next(new AppError("You are not logged in, please log in", 401));
//     }

//     // Verify the token
//     const decoded = jwt.verify(token, process.env.jwtSecret);
//     console.log("decoded", decoded);

//     // Check if the user exists using only the `userId`
//     const user = await Users.findById(decoded.id.userId); // Use `decoded.userId` here

//     if (!user) {
//       return next(new AppError("User with the specified ID not found", 404));
//     }

//     // Check if the session ID in the token matches the currentSession in the database
//     if (user.currentSession !== decoded.id.sessionId) {
//       console.log("Session mismatch. Current:", user.currentSession, "Token:", decoded.sessionId);
//       return next(
//         new AppError("Invalid session or logged in from another device", 401)
//       );
//     }
    

//     // Attach the user to the request object for further use
//     req.user = user;
//     next();
//   } catch (error) {
//     console.error("Protect route Error", error);

//     if (error.name === "JsonWebTokenError") {
//       return next(new AppError("Invalid token, please log in again", 401));
//     }

//     if (error.name === "TokenExpiredError") {
//       return next(new AppError("Your token has expired, please log in again", 401));
//     }

//     // Generic error fallback
//     return next(error);
//   }
// };


const verifyIsAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      throw new Error(
        "You are not authorized to access this route, this route belongs to admin users"
      );
    }
    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({
      status: "fail",
      message: error.message,
    });
  }
};




module.exports = { protectRoute, verifyIsAdmin };
