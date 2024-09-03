const mongoose = require("mongoose");
const groupSchema = new mongoose.Schema(
  {
    group: {
      type: String,
      trim: true,
    },
    deviceId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "device",
      },
    ],
  },
  {
    timestamps: true,
  }
);
exports.groupModel = mongoose.model("group", groupSchema);


