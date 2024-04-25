const cookieParser = require("cookie-parser");
const express = require("express");
const app = express();

app.use(express.json({ limit: "16kb" }));
app.use(cookieParser());

module.exports = app;
