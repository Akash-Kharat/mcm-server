const mongoose = require("mongoose");
const deviceSchema = new mongoose.Schema(
  {
    slave_id: {
      type: Number,
      trim: true,
    },
    baud_rate: {
      type: Number,
      trim: true,
    },
    operating_mode: {
      type: Number,
      trim: true,
    },
    fan_model: {
      type: Number,
      trim: true,
    },

    fan_status: {
      type: Number,
      trim: true,
    },

    fan_speed: {
      type: Number,
      trim: true,
    },

    fan_minimum_voltage: {
      type: Number,
      trim: true,
    },

    fan_maximum_voltage: {
      type: Number,
      trim: true,
    },

    sensor_minimum_value: {
      type: Number,
      trim: true,
    },

    sensor_maximum_value: {
      type: Number,
      trim: true,
    },

    fan_pulse: {
      type: Number,
      trim: true,
    },

    fan_fault: {
      type: Number,
      trim: true,
    },

    fan_power: {
      type: Number,
      trim: true,
    },

    fan_current: {
      type: Number,
      trim: true,
    },

    fan_ac_voltage: {
      type: Number,
      trim: true,
    },

    fan_rpm: {
      type: Number,
      trim: true,
    },

    diff_pressure: {
      type: Number,
      trim: true,
    },

    co2: {
      type: Number,
      trim: true,
    },

    temprature1: {
      type: Number,
      trim: true,
    },
    temprature2: {
      type: Number,
      trim: true,
    },

    humidity: {
      type: Number,
      trim: true,
    },

    pm2_5: {
      type: Number,
      trim: true,
    },

    pm10: {
      type: Number,
      trim: true,
    },

    tvoc: {
      type: Number,
      trim: true,
    },
    group: {
      type: String,
    },
    isGrouped: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);
exports.deviceModel = mongoose.model("device", deviceSchema);
