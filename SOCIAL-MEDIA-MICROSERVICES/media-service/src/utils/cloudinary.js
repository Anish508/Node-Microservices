const cloudinary = require("cloudinary").v2;
const logger = require("./logger.js");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const uploadMediaTCoCLoudinary = (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {},
      (error, result) => {
        if (error) {
          logger.warn("Error while uploading cloudinary");
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    uploadStream.end(file.buffer)
  });
};
module.exports = uploadMediaTCoCLoudinary