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

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    console.log("File uploaded on cloudinary", response.url);
    return response;
  } catch (error) {
    fs.unlink(localFilePath);
    return null;
  }
};
