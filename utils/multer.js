const multer = require("multer");
const path = require("path");

// Configure disk storage with destination and filename
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Set the directory for storing images
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Set the filename to be unique
  }
});

// Multer configuration
const imageUploads = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 3 }, // Limit file size to 3 MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpg|jpeg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("File upload only supports the following filetypes - " + filetypes));
  },
}).single("image");

// Export the image upload middleware
module.exports = { imageUploads };
