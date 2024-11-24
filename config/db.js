const mongoose = require("mongoose");
require("dotenv").config();


const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL, {
    });

    console.log(`Database connected successfully`);
  } catch (error) {
    console.error(`DB Error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = connectDB;