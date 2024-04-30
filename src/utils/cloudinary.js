const cloudinary = require("cloudinary").v2;
const fs = require("fs");

exports.uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const response = await cloudinary.uploader.upload(
      localFilePath,
      (error, result) => {
        console.log(result);
      }
    );

    console.log("Unlinking1");
    fs.unlink(localFilePath, (err) => {
      if (err) {
        console.log("Not Unlinking ", err);
      }
    });
    return response;
  } catch (error) {
    console.log("\nUnlinking2");
    fs.unlink(localFilePath);
    return null;
  }
};
