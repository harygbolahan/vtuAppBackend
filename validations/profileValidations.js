const joi = require("joi");

const updateProfile = joi.object().keys({
  firstName: joi
    .string()
    .trim()
    .required()
    .error(new Error("First name is required")),
  lastName: joi
    .string()
    .trim()
    .required()
    .error(new Error("Last name is required")),
  middleName: joi.string().trim().optional(),
  email: joi
    .string()
    .email()
    .trim()
    .lowercase()
    .required()
    .error(new Error("Email is required")),
  phoneNumber: joi
    .string()
    .pattern(/^[0-9]+$/)
    .min(8)
    .max(15)
    .required()
    .error(new Error("Phone number is required")),
  password: joi
    .string()
    .min(8)
    .required()
    .error(new Error("Password is required")),
  isVerified: joi.boolean().default(false),
  kycStatus: joi
    .string()
    .valid("unverified", "verified")
    .default("unverified"),
  bvn: joi
    .string()
    .pattern(/^[0-9]{11}$/)
    .optional(),
  profile_image: joi.string().uri().optional(),
  address: joi.string().trim().optional(),
  gender: joi.string().valid("male", "female").optional(),
  dateOfBirth: joi.date().optional(),
  profilePicture: joi.string().uri().optional(),
  nin: joi.string().pattern(/^[0-9]+$/).optional(),
  walletBalance: joi.number().default(0),
  bankDetails: joi
    .object({
      bankName: joi.string().optional(),
      accountNumber: joi.string().pattern(/^[0-9]+$/).optional(),
      accountName: joi.string().optional(),
      isPrimary: joi.boolean(),
    })
    .optional(),
  role: joi.string().valid("user", "reseller", "api", "admin").default("user"),
  createdAt: joi.date().default(() => new Date()),
  updatedAt: joi.date().default(() => new Date()),
  lastLogin: joi.date().optional(),
});

module.exports = {updateProfile};
