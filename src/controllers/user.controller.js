const User = require("../models/user.model");
const { ApiError } = require("../utils/ApiError");
const { asyncHandler } = require("../utils/asyncHandler");
const { uploadOnCloudinary } = require("../utils/cloudinary");
const { ApiResponse } = require("../utils/ApiResponse");

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

// exports.logout = asyncHandler(async (req, res) => {
//   const user = await User.findByIdAndUpdate(
//     req.user._id,
//     {
//       $set: { refreshToken: undefined },
//     },
//     { new: true }
//   );

//   if (!user) {
//     throw new ApiError(404, "User not found");
//   }

//   const options = {
//     httpOnly: true,
//     secure: true,
//   };

//   res.clearCookie("accessToken", options);
//   res.clearCookie("refreshToken", options);

//   res
//     .status(200)
//     .json(new ApiResponse(200, user, "User logged out successfully"));
// });

exports.logout = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: "" },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  res.clearCookie("accessToken", options);
  res.clearCookie("refreshToken", options);

  res
    .status(200)
    .json(new ApiResponse(200, user, "User logged out successfully"));
});
