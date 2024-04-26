const cookieParser = require("cookie-parser");
const express = require("express");
const app = express();
const cors = require("cors");

//  Middlewares for parsing request body
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json({ limit: "16kb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// Routes
const userRoutes = require("./routes/user.routes");
app.use("/api/v1/user", userRoutes);

module.exports = app;
