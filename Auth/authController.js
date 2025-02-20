const Users = require("../User/userModels");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {signJWt, signRefreshToken} = require("../utils/SignJwt");
const sendEmail = require("../utils/Email");
const crypto = require("crypto");
const AppError = require("../utils/AppError");
const { validateUserSignup } = require("../User/userValidations");

const signup = async (req, res, next) => {
  try {
    console.log(req.body);
    const validation = validateUserSignup.validate(req.body);
    if (validation?.error) {
      throw new AppError(validation?.error.message, 400);
    }
    const role = "user";
    const { firstName, lastName, email, password, phoneNumber  } = req.body;

    const existingUser = await Users.findOne({ email });
    if (existingUser) {
      throw new Error("User with the email address already exists");
    }

    const existingNumber = await Users.findOne({phoneNumber})
    if (existingNumber) {
      throw new Error ("User with Phone number already exists")
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log(hashedPassword);

    const user = await Users.create({
      firstName,
      lastName,
      email,
      phoneNumber,
      password: hashedPassword,
      role,
      status: 'inactive'
    });

    if (!user) {
      throw new Error("Failed to create user account");
    }

    // Send welcome mail
    const options = {
      email: email,
      subject: "Mabrook VTU",
      message:
        "Welcome Onboard. We are pleased to have you. Please keep your eyes peeled for the verification link which you will recieve soon.\n Shop and spend your money.",
    };
    await sendEmail(options);

    //------- Send email verification link--------
    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    console.log(verificationToken);
    // Hash the verification token
    const hashedVerificationToken = await bcrypt.hash(verificationToken, salt);

    // Create verification url
    const verificationUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/auth/verify/${user.email}/${verificationToken}`;

    // Create verification message
    const verificationMessage = `Please click on the link below to verify your email address. \n ${verificationUrl} `;

    // Verification mail options
    const verificationMailOptions = {
      email: email,
      subject: "Verify your email address",
      message: verificationMessage,
    };

    // Send verification mail
    await sendEmail(verificationMailOptions);

    // Update user record with hashed verification token
    user.verification_token = hashedVerificationToken;
    await user.save();

    // Create auth token
    const token = signJWt(user._id);

    res.status(201).json({
      status: "success",
      message: "User account created successfully",
      data: {
        user,
        token,
      },
    });

    // Create User account
  } catch (error) {
    console.log(error);
    res.status(404).json({
      status: "fail",
      message: error.message,
    });
  }
};

// Function to Login user
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new Error("Please provide email and password");
    }

    const user = await Users.findOne({ email }).select("+password");
    if (!user) {
      throw new Error("Invalid email or password");
    }    

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    // Generate tokens
    const accessToken = signJWt(user._id);
    const refreshToken = signRefreshToken(user._id);

    // Optionally, store the refresh token in your DB for additional security

    // Send refresh token in an HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // ensure secure in production
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // e.g., 7 days
    });

    res.status(200).json({
      status: "success",
      message: "User logged in successfully",
      data: {
        user,
        accessToken,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      status: "fail",
      message: error.message,
    });
  }
};
const verifyEmailAddress = async (req, res, next) => {
  try {
    const { email, verificationToken } = req.params;

    if (!email || !verificationToken) {
      throw new Error("Please provide email and token");
    }

    console.log(email, verificationToken, 'email and token');
    

    // check if user with the email exist
    const user = await Users.findOne({ email });
    if (!user) {
      throw new Error("User with the email not found");
    }

    const tokenValid = await bcrypt.compare(
      verificationToken,
      user.verification_token
    );

    if (!tokenValid) {
      throw new Error("failed to verify user - Invalid tokne");
    }

    user.email_verified = true;
    await user.save();
    res.status(200).json({
      status: "success",
      message: "User verified successfully",
      
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({
      status: "fail",
      message: error.message + "DB",
    });
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new AppError("Please provide email address", 404);
    }

    // check if user with the email exist
    const user = await Users.findOne({ email });
    if (!user) {
      throw new AppError("User with the email not found", 404);
    }

    // Create reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedResetToken = await bcrypt.hash(resetToken, 10);

    // Create reset url
    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/auth/resetpassword/${email}/${resetToken}`;

    // Create reset message
    const resetMessage = `Please click on the link below to reset your password. \n ${resetUrl} `;

    // Reset mail options
    const resetMailOptions = {
      email: email,
      subject: "Reset your password",
      message: resetMessage,
    };

    // Send reset mail
    await sendEmail(resetMailOptions);

    // Update user record with hashed reset token
    user.reset_password_token = hashedResetToken;
    await user.save();

    res.status(200).json({
      status: "success",
      message: "Reset link sent to email",
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({
      status: "fail",
      message: error.message ,
    });;
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, resetToken } = req.params;
    const { password, confirmPassword } = req.body;

    if (!email || !resetToken || !password || !confirmPassword) {
      throw new AppError("Please provide all required fields", 404);
    }

    if (password !== confirmPassword) {
      throw new AppError("Passwords do not match", 404);
    }

    // check if user with the email exist
    const user = await Users.findOne({ email });
    if (!user) {
      throw new AppError("User with the email not found", 404);
    }

    // Check if the reset token is valid
    const tokenValid = await bcrypt.compare(
      resetToken,
      user.reset_password_token
    );

    if (!tokenValid) {
      throw new AppError("Invalid password reset token", 404);
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user record with new password
    user.password = hashedPassword;
    // user.reset_password_token = undefined;
    await user.save();

    res.status(200).json({
      status: "success",
      message: "Password reset successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({
      status: "fail",
      message: error.message ,
    });
  }
};

const changePassword = async (req, res, next) => {
  try {
    console.log('Request', req.body);
    
    const { email, oldPassword, newPassword, confirmNewPassword } = req.body;

    if (!email || !oldPassword || !newPassword || !confirmNewPassword) {
      throw new AppError("Please provide all required fields", 404);
    }

    if (newPassword !== confirmNewPassword) {
      throw new AppError("Passwords do not match", 404);
    }

    // check if user with the email exist
    const user = await Users.findOne({ email }).select("+password");
    if (!user) {
      throw new AppError("User with the email not found", 404);
    }
  
    

    // Check if the old password is correct
    const passwordValid = await bcrypt.compare(oldPassword, user.password);


    if (!passwordValid) {
      throw new AppError("Invalid old password, Please try again.", 404);
    }

    if (newPassword === oldPassword) {
      throw new AppError("New password cannot be the same as old password", 404);
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user record with new password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      status: "success",
      message: "Password changed successfully",
    })
  } catch (error) {
    console.log(error);
    res.status(404).json({
      status: "fail",
      message: error.message ,
    });
  }
}

const setTransactionPin = async (req, res, next) => {
  try {

    console.log('Request ', req.body);
    
    const { email, transactionPin } = req.body;

    if (!email || !transactionPin) {
      throw new AppError("Please provide all required fields", 404);
    }
    const user = await Users.findOne({ email }).select("+transaction_pin");
    if (!user) {
      throw new AppError("User with the email not found", 404);
    }

    //if transaction pin is greater or less than 4 digits
    if (transactionPin.length < 4 || transactionPin.length > 4) {
      throw new AppError("Transaction pin must be 4 digits", 404);
    }

    //If transaction pin is common or can be guessed easily
    const commonPins = ['1234', '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999'];

    if (commonPins.includes(transactionPin)) {
      throw new AppError("Transaction pin is too common, Please try another one", 404);
    }

    user.transaction_pin = transactionPin;
    await user.save();

    res.status(200).json({
      status: "success",
      message: "Transaction pin set successfully",
    })
  }catch (error) {
    console.log(error);
    res.status(404).json({
      status: "fail",
      message: error.message ,
    });
  }
}

const resetTransactionPin = async (req, res, next) => {
  try {
    const { email, password, transactionPin } = req.body;

    if (!email || !transactionPin || !password) {
      throw new AppError("Please provide all required fields", 404);
    }
    const user = await Users.findOne({ email }).select("+transaction_pin +password");
    if (!user) {
      throw new AppError("User with the email not found", 404);
    }

    // Check if the old password is correct
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      throw new AppError("Invalid password, Please try again.", 404);
    }

    //if transaction pin is greater or less than 4 digits
    if (transactionPin.length < 4 || transactionPin.length > 4) {
      throw new AppError("Transaction pin must be 4 digits", 404);
    }

    //If transaction pin is common or can be guessed easily
    const commonPins = ['1234', '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999'];

    if (commonPins.includes(transactionPin)) {
      throw new AppError("Transaction pin is too common, Please try another one", 404);
    }

    user.transaction_pin = transactionPin;
    await user.save();

    res.status(200).json({
      status: "success",
      message: "Transaction pin reset successfully",
    })
  } catch (error) {
    console.log(error);
    res.status(404).json({
      status: "fail",
      message: error.message ,
    });
  }
}

const changeTransactionPin = async (req, res, next) => {
  try {
    const { email, oldTransactionPin, newTransactionPin, confirmNewTransactionPin } = req.body;

    if (!email || !oldTransactionPin || !newTransactionPin || !confirmNewTransactionPin) {
      throw new AppError("Please provide all required fields", 404);
    }

    if (newTransactionPin !== confirmNewTransactionPin) {
      throw new AppError("New and Confirm transaction pins do not match", 404);
    }
    const user = await Users.findOne({ email }).select("+transaction_pin");
    if (!user) {
      throw new AppError("User with the email not found", 404);
    }

    // Check if the old transaction pin is correct (Not hashed)
    if (oldTransactionPin !== user.transaction_pin) {
      throw new AppError("Invalid old transaction pin, Please try again.", 404);
    }

    //if transaction pin is greater or less than 4 digits
    if (newTransactionPin.length < 4 || newTransactionPin.length > 4) {
      throw new AppError("Transaction pin must be 4 digits", 404);
    }

    //If transaction pin is common or can be guessed easily
    const commonPins = ['1234', '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999'];

    if (commonPins.includes(newTransactionPin)) {
      throw new AppError("Transaction pin is too common, Please try another one", 404);
    }

    console.log(user.transaction_pin);
    console.log(user.transactionPin);
    
    

    user.transaction_pin = newTransactionPin;
    await user.save();

    res.status(200).json({
      status: "success",
      message: "Transaction pin changed successfully",
    })

    } catch (error) {
    console.log(error);
    res.status(404).json({
      status: "fail",
      message: error.message ,
    });
    }
    
}

module.exports = {
  signup,
  login,
  verifyEmailAddress,
  forgotPassword,
  resetPassword,
  changePassword,
  setTransactionPin,
  resetTransactionPin,
  changeTransactionPin,

}