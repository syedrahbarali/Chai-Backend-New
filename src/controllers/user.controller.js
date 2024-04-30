const User = require("../models/user.model");
const { ApiError } = require("../utils/ApiError");
const { asyncHandler } = require("../utils/asyncHandler");
const { uploadOnCloudinary } = require("../utils/cloudinary");
const { ApiResponse } = require("../utils/ApiResponse");
const jwt = require("jsonwebtoken");

// generate access and refresh token
const generateAccessAndRefreshToken = async (user) => {
  try {
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    const loggedInUser = await user.save({ validateBeforeSave: false });
    loggedInUser.password = undefined;
    loggedInUser.refreshToken = undefined;

    return { accessToken, refreshToken, loggedInUser };
  } catch (error) {
    console.log(error);
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh token"
    );
  }
};

exports.registerUser = asyncHandler(async (req, res) => {
  // get details from requrest body
  const { username, email, fullName, password } = req.body;

  //  check if all fields are not empty - (Validation)
  if (
    [username, email, fullName, password].some((field) => field?.trim() === "")
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
  const newUser = new User({
    username,
    email: email.toLowerCase(),
    fullName,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const user = await newUser.save();

  //   find user using _id
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //   remove password and refresh token from the response
  if (!createdUser) {
    throw new ApiError(500, "Failed to create user");
  }

  res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User created successfully"));
});

exports.login = asyncHandler(async (req, res) => {
  // get details from requrest body
  // check if all fields are not empty
  // find user using email
  // check if password is correct
  // generate access token and refresh token
  // return response with access token and refresh token
  const { username, email, password } = req.body;

  //   check if all fields are not empty - (Validation)
  if ((!username || !email) && !password) {
    throw new ApiError(400, "All fields are required");
  }

  //   find user using email or username
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  // check if user not exist
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // check if password is correct
  if (!(await user.isPasswordCorrect(password))) {
    throw new ApiError(401, "Incorrect password");
  }

  const { accessToken, refreshToken, loggedInUser } =
    await generateAccessAndRefreshToken(user);

  loggedInUser.password = undefined;
  loggedInUser.refreshToken = undefined;

  const options = {
    httpOnly: true,
    secure: true,
  };

  // return response with access token and refresh token in cookie
  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser },
        "User logged in successfully"
      )
    );
});

exports.logout = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: "" },
    },
    { new: true }
  ).select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: true,
  };

  res.clearCookie("accessToken", options);
  res.clearCookie("refreshToken", options);

  res
    .status(200)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

exports.refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.user?.refreshToken;
    console.log(refreshToken);
    const decodedToken = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    if (!decodedToken) {
      throw new ApiError(401, "Invalid refresh token");
    }

    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.refreshToken !== refreshToken) {
      throw new ApiError(401, "Invalid refresh token");
    }

    const {
      accessToken,
      refreshToken: newRefreshToken,
      loggedInUser,
    } = await generateAccessAndRefreshToken(user);

    const options = {
      httpOnly: true,
      secure: true,
    };

    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(200),
        { user: loggedInUser },
        "Access token and refresh token refreshed successfully"
      );
  } catch (error) {
    console.log(error);
    throw new ApiError(
      500,
      "Something went wrong while refreshing access token"
    );
  }
});

exports.updatePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "All fields are required");
  }

  const decodedToken = jwt.verify(
    req.cookies.accessToken,
    process.env.ACCESS_TOKEN_SECRET
  );

  if (!decodedToken) {
    throw new ApiError(401, "Invalid access token");
  }

  const user = await User.findById(decodedToken._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!(await user.isPasswordCorrect(oldPassword))) {
    throw new ApiError(401, "Incorrect password");
  }

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Password updated successfully"));
});

exports.updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.files?.avatar[0].path;
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar) {
    throw new ApiError(500, "Something went wrong while uploading avatar");
  }

  const decodedToken = jwt.verify(
    req.cookies.accessToken,
    process.env.ACCESS_TOKEN_SECRET
  );

  if (!decodedToken) {
    throw new ApiError(401, "Invalid access token");
  }

  const user = await User.findByIdAndUpdate(decodedToken._id, {
    $set: { avatar: avatar.url },
  }).select("-password -refreshToken");

  res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});
