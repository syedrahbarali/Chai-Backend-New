const express = require("express");
const {
  registerUser,
  login,
  logout,
  refreshAccessToken,
  updatePassword,
} = require("../controllers/user.controller");
const router = express.Router();
const { upload } = require("../middlewares/upload");
const { verifyJWT } = require("../middlewares/auth.middleware");

router.post(
  "/register",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.post("/login", login);

// secured routes
router.post("/logout", verifyJWT, logout);
router.post("/refresh-token", refreshAccessToken);
router.post("/update-password", verifyJWT, updatePassword);

module.exports = router;
