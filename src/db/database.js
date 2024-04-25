const mongoose = require("mongoose");
const { DB_NAME } = require("./constants");

exports.dbConnect = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.DATABASE_URL}/${DB_NAME}`
    );

    console.log(
      "Mongo DB connection success. Port:",
      connectionInstance.connection.host
    );
  } catch (error) {
    console.log("Mongo DB connection failed. Error:", error);
    process.exit(1);
  }
};
