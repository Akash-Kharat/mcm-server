const mongoose = require("mongoose");

exports.databaseConnection = () => {
  mongoose
    .connect("mongodb://127.0.0.1:27017/moduAir-control-manager")
    .then(() => {
      console.log("Connected to database!");
    })
    .catch(() => {
      console.log("Failed to connect to database!");
    });
};
