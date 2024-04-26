const User = require("../models/user.model");
const { ApiError } = require("../utils/ApiError");
const { asyncHandler } = require("../utils/asyncHandler");
const upload = require("../middlewares/upload");
const { uploadOnCloudinary } = require("../utils/cloudinary");
const { ApiRespose } = require("../utils/ApiResponse");

exports.registerUser = asyncHandler(async (req, res) => {
  // get details from requrest body
  const { username, email, fullName, password } = req.body;

  //  check if all fields are not empty
  if (
    [username, email, fullName, password].some((field) => field.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  //  check if username and email already exist
  const userExist = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (userExist) {
    throw new ApiError(409, "Username or email already exist");
  }

  //   Finding path of avatar and coverImage
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  //   check for avatar is not empty
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  //   upload avatar and coverImage to cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(500, "Failed to upload avatar");
  }

  //   create user in database
  const user = await User.create({
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    fullName,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  //   find user using _id
  const createdUser = await User.findOne(user._id).select(
    "-password -refreshToken"
  );

  //   remove password and refresh token from the response
  if (!createdUser) {
    throw new ApiError(500, "Failed to create user");
  }

  res
    .status(201)
    .json(new ApiRespose(201, createdUser, "User created successfully"));
});

// get details from requrest body
// check if all fields are not empty
// check for avatar is not empty
// check if username and email already exist
// upload avatar and coverImage to cloudinary
// create user in database
// find user using _id
// remove password and refresh token from the response
// return response
