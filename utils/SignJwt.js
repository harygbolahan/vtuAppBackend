const jwt = require("jsonwebtoken");

// Function to generate an access token (JWT)
const signJWt = (id) => {
  return jwt.sign({ id }, process.env.jwtSecret, {
    expiresIn: process.env.jwtExpiresIn, // e.g., "5m"
  });
};

// Function to generate a refresh token (could be a JWT or a random string)
const signRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.jwtRefreshSecret, {
    expiresIn: process.env.jwtRefreshExpiresIn, // e.g., "7d"
  });
};

module.exports = {signJWt, signRefreshToken};
