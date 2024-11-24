const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    middleName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verification_token: {
      type: String
    },
    reset_password_token: {
      type: String
    },
    transaction_pin: {
      type: String,
      minlength: [4, 'Transaction pin must not be less than 4 digits'],
      maxlength: [4, 'Transaction pin must not be greater than 4 digits'],
      select: false,
    },
    kycStatus: {
      type: String,
      enum: ['unverified', 'verified'],
      default: 'unverified',
    },
    bvn: {
      type: String,
    },
    address: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    dateOfBirth: {
      type: Date,
    },
    profilePicture: {
      type: String,
    },
    nin:{
      type: String,
    },
    walletBalance: {
      type: Number,
      default: 0,
    },
    bankDetails: {
      bankName: String,
      accountNumber: String,
      accountName: String,
      isPrimary: {
        type: Boolean,
        default: true,
      },
    },
    role: {
      type: String,
      enum: ['user', 'reseller', 'api', 'admin'],
      default: 'user',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true, 
  }
);

// Hash password before saving user


userSchema.methods.getFullName = function () {
  return `${this.firstname} ${this.lastname}`;
};

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};


const Users = mongoose.model('User', userSchema);

module.exports = Users;
