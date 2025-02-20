// const users = require("./../data/user");
const bcrypt = require("bcryptjs");
const Users = require("./userModels");
const AppError = require("../utils/AppError");
const { dataUri } = require("../utils/multer");
const { uploader } = require("../utils/cloudinary");


const getAllUsers = async (req, res, next) => {
  try {
    const users = await Users.find().select("+transaction_pin");

    if (!users) {
      throw new AppError("No users found", 404);
    }


    res.status(200).json({
      status: "success",
      message: "All users fetched successfully",
      result: users.length,
      data: {
        users,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getUserProfile = async (req, res, next) => {
  const userId = req.user._id;
  try {
    const user = await Users.findById(userId).select("+transaction_pin");
    if (!user) {
      throw new AppError(`User not found with id of ${id}`, 404);
    }
    const fullname = user.getFullName();

    res.status(200).json({
      status: "success",
      message: "User fetched successfully",
      data: {
        user,
        fullname,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateProfilePicture = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await Users.findById(userId);
    if (!user) {
      throw new AppError(`User not found with id of ${userId}`, 404);
    }

    const file = req.file;
    if (!file) {
      throw new AppError("No file uploaded", 400);
    }

    // Upload the file using the file path
    const result = await uploader.upload(file.path, {
      folder: "Mabrook/profile_images",
    });

    // Update user's profile image with the URL
    user.profile_image = result.secure_url;
    await user.save();

    res.status(200).json({
      status: "success",
      message: "Profile picture updated successfully",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};


const updateProfile = async (req, res, next) => {
  const userId = req.user._id;
  try {
    const user = await Users.findById(userId).select("-bankDetails");
    if (!user) {
      throw new AppError(`User not found with id of ${userId}`, 404);
    }

    const allowedFields = [
      "firstName", "lastName", "middleName", "address",
      "gender", "dateOfBirth",
    ];

    const fieldsToUpdate = Object.keys(req.body);
    fieldsToUpdate.forEach((field) => {
      if (allowedFields.includes(field)) {
        user[field] = req.body[field];
      } else {
        throw new AppError(
          `Field ${field} is not allowed to be updated using this route`,
          400
        );
      }
    });


    await user.save();

    res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

//update Pin

const updatePin = async (req, res, next) => {
  const userId = req.user._id;
  const { oldPin, newPin } = req.body;

  try {
    const user = await Users.findById(userId);
    if (!user) {
      throw new AppError(`User not found with id of ${userId}`, 404);
    }
    const isMatch = await bcrypt.compare(oldPin, user.transaction_pin);
    if (!isMatch) {
      throw new AppError("Old pin is incorrect", 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(newPin, salt);

    user.transaction_pin = hashedPin;
    await user.save();

    res.status(200).json({
      status: "success",
      message: "Pin updated successfully",
      data: {
        user,
      }
    })
    } catch (error) {
    next(error);
    }

}

//update user status

const updateUserStatus = async (req, res, next) => {
  const userId = req.params.id;
  const status = req.body.status;

  try {
    const user = await Users.findById(userId);
    if (!user) {
      throw new AppError(`User not found with id of ${userId}`);
    }

    user.status = status;
    await user.save();

    res.status(200).json({
      status: "success",
      message: "User status updated successfully",
      data: {
        user,
      },
    })
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "error",
      message: "An error occurred while updating user status",
    })

  }
}

// set Password for user

const setUserPassword = async (req, res, next) => {
  const userId = req.params.id;
  const password = req.body.password;

  try {
    const user = await Users.findById(userId);
    if (!user) {
      throw new AppError(`User not found with id of ${userId}`);
    }

    if (!password) {
      throw new AppError("Password is required");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    await user.save();


    res.status(200).json({
      status: "success",
      message: "Password set successfully",
      data: {
        user,
      },
    })
  } catch (error) {
    console.log(error);

    res.status(500).json({
      status: "error",
      message: "An error occurred while setting user password",
    })
  }
}

//get user by email

const getUserByEmail = async (req, res, next) => {
  const email = req.params.email;

  try {
    const user = await Users.findOne({ email });
    if (!user) {
      throw new Error(`User not found with email of ${email}`);
    }

    res.status(200).json({
      status: "success",
      message: "User found successfully",
      data: {
        user,
      },
    })
  }
  catch (error) {
    console.log(error);

    res.status(404).json({
      status: "error",
      message: error.message,
    })
    
  }
}

//Edit all user data
const updateAllUserData = async (req, res, next) => {
  const userId = req.params.id;
  const user = req.body;

  console.log({
    "UserID": userId,
    "User Data": user,
  });

  try {
    const updatedUser = await Users.findByIdAndUpdate(userId, user, { new: true });
    if (!updatedUser) {
      throw new Error(`User not found with id of ${userId}`, 404);
    }

    res.status(200).json({
      status: "success",
      message: "User updated successfully",
      data: {
        updatedUser,
      },
    })
} catch (error) {
    console.log(error);
    res.status(500).json({
      status: "error",
      message: "An error occurred while updating user data",
    })
  }
}

//get total user wallet

const getTotalUserWallet = async (req, res, next) => {
  try {
    const totalUserWallet = await Users.aggregate([
      {
        $group: {
          _id: null,
          totalWallet: { $sum: "$walletBalance" },
        },
      },
    ]);

    res.status(200).json({
      status: "success",
      message: "Total user wallet retrieved successfully",
      data: {
        totalUserWallet,
      },
    });
  } catch (error) {
    next(error);
      }
}

//getTotal verified users and unverified users

const getTotalVerifiedAndUnverifiedUsers = async (req, res, next) => {
  try {
    const totalVerifiedUsers = await Users.countDocuments({ isVerified: true });
    const totalUnverifiedUsers = await Users.countDocuments({ isVerified: false });

    res.status(200).json({
      status: "success",
      message: "Total verified and unverified users retrieved successfully",
      data: {
        totalVerifiedUsers,
        totalUnverifiedUsers,
      },
    });
  } catch (error) {
    next(error);

      }
}

//fetch all Transactions by all users

const fetchAllTransactionsByAllUsers = async (req, res, next) => {
  try {
    const transactions = await Transactions.find().populate("user", "firstName lastName email");
    res.status(200).json({
      status: "success",
      message: "Transactions retrieved successfully",
      data: {
        transactions,
      },
    });
  } catch (error) {
    next(error);
      }
      
}






module.exports = {
  getAllUsers,
  getUserProfile,
  updateProfilePicture,
  updateProfile,
  updateUserStatus,
  setUserPassword,
  getUserByEmail,
  updateAllUserData,
  getTotalUserWallet,
  getTotalVerifiedAndUnverifiedUsers,
};
