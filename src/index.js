require("dotenv").config({
  path: "./env",
});
const app = require("./app");
const { dbConnect } = require("./db/database");
const ApiError = require("./utils/ApiError");

const PORT = process.env.PORT || 3000;

dbConnect()
  .then(() => {
    app.on("error", (error) => {
      console.log("Error", error);
      throw new ApiError(500, "Internal Server Error");
    });

    app.listen(PORT, () => {
      console.log("Server started successfully, Port: ", PORT);
    });
  })
  .catch((err) => {
    console.log("Mongo DB connection failed. Error:", err);
  });
