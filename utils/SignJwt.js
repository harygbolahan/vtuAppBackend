const jwt = require("jsonwebtoken");

const signJWt = (id) => {
  return jwt.sign({ id }, process.env.jwtSecret, {
    expiresIn: process.env.jwtExpiresIn,
  });
};

module.exports = signJWt;
