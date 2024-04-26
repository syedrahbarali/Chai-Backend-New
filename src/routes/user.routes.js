const express = require("express");
const { registerUser } = require("../controllers/registerUser");
const router = express.Router();
const upload = require("../middlewares/upload");

router.post(
  "/register",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

module.exports = router;
