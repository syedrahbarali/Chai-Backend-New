const { ApiError } = require("../utils/ApiError");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const { ApiResponse } = require("../utils/ApiResponse");

const verifyJWT = async (req, res, next) => {
  try {
    const decodedToken = jwt.verify(
      req.cookies?.accessToken,
      process.env.ACCESS_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }

    req.user = user; //  WHY ? ---> Find reason

    next();
  } catch (error) {
    // throw new ApiError(401, "Access token missing or invalid");
    res
      .status(401)
      .json(
        new ApiResponse(401, null, error.message || "Something went wrong")
      );
  }
};

module.exports = { verifyJWT };
