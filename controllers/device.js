const { SerialPort } = require("serialport");
const path = require("path");

// const configFile = path.join(
//   path.dirname(process.execPath),
//   "modbusConfig.json"
// );

// only dev mode
const configFile = "modbusConfig.json";

const fs = require("fs/promises");
const client = require("../config/modbusClient");
const flags = require("../utils/flags");
const {
  startReadingData,
  readModbusDataWithTimeout,
  stopReadingModbusData,
  readModbusDataWithRetry,
} = require("../utils/readModbusData");
const { deviceModel } = require("../models/device");
const delay = require("../utils/delay");

const defaultConfig = {
  path: "COM1",
  baudRate: 9600,
  holdingRegisterStart: 0,
  holdingRegisterEnd: 24,
  deviceIdStart: 1,
  deviceIdEnd: 3,
};

exports.getPorts = async (req, res) => {
  try {
    const ports = await SerialPort.list();
    console.log(ports);
    res.status(200).json({
      success: true,
      message: "Ports fetched successfully!",
      data: ports,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Something went wrong while fetching ports! Try again.",
    });
  }
};

exports.portConnection = async (req, res) => {
  const configData = JSON.parse(await fs.readFile(configFile, "utf8"));
  console.log(req.body);
  const { path, friendlyName } = req.body;
  if (friendlyName !== "USB Serial Port (COM6)") {
    return res.status(500).json({
      success: false,
      message: "Incorrect port! Check in device manager.",
    });
  }
  if (flags.isConnected && configData.path === path) {
    return res.status(200).json({
      success: true,
      message: "Port is already connected!",
    });
  }
  const config = {
    ...defaultConfig,
    path: path || defaultConfig.path,
  };
  try {
    if (configData.path !== path) {
      await fs.writeFile(configFile, JSON.stringify(config));
    }
    console.log(config.path);
    console.log("yaha tak ayya");
    await client.connectRTUBuffered(config.path, {
      baudRate: config.baudRate,
    });
    console.log("yaha tak ayya");

    flags.isConnected = true;
    startReadingData();

    return res.status(200).json({
      success: true,
      message: "Connected to port successfully!",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong while connecting to the port! Try again.",
    });
  }
};

exports.devicesData = async (req, res) => {
  try {
    const response = await deviceModel.find();
    res.status(200).json({
      success: true,
      message: "Devices data fetched successfully!",
      data: response,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Something went wrong while fetching devices data!",
    });
  }
};

exports.updateDeviceData = async (req, res) => {
  const { _id, deviceId, fanSpeed } = req.body;
  const registerAddress = 5;
  const config = JSON.parse(await fs.readFile(configFile, "utf8"));
  const { holdingRegisterStart, holdingRegisterEnd } = config;
  const numberOfRegisters = holdingRegisterEnd - (holdingRegisterStart + 1);
  client.setID(deviceId);
  stopReadingModbusData();
  try {
    await delay(500);

    // await Promise.race([
    //   client.writeRegister(registerAddress, fanSpeed),
    //   new Promise((_, reject) =>
    //     setTimeout(() => reject(new Error("Write operation timed out")), 2000)
    //   ),
    // ]);
    console.log("yaha tak ayyaa 2 ");

    const datawrite = await client.writeRegister(registerAddress, fanSpeed);
    console.log(datawrite);
    await delay(500);
    console.log("yaha tak ayyaa 3 ");

    const data = await readModbusDataWithRetry(
      client,
      holdingRegisterStart,
      numberOfRegisters,
      3 // Retry up to 3 times
    );

    console.log("data after updaetion " + data.data);

    // console.log("yaha tak ayyaa 3");

    const dbPayload = {
      fan_speed: datawrite.value,
    };

    await deviceModel.findOneAndUpdate({ _id }, dbPayload);

    res.status(200).json({
      success: true,
      message: "Device data updated successfully!",
    });
  } catch (err) {
    if (err.message.includes("Port Not Open")) {
      console.error(
        `Error reading from Modbus device ID ${deviceId}: ${err.message}`
      );
      console.log("Port is not open. Attempting to reconnect...");
      isConnected = false;
      await attemptReconnect();
    } else {
      console.error(
        `Error writing/reading data for device ID ${deviceId}: ${err.message}`
      );
    }
    res.status(500).json({
      success: false,
      message: "Something went wrong while updating data! Try again.",
      err: err,
    });
  } finally {
    await delay(5000);
    startReadingData();
  }
};

exports.checkConnection = async (req, res) => {
  try {
    if (flags.isConnected === true) {
      res.status(200).json({
        success: true,
        message: "Device is connected!",
      });
    } else {
      res.status(200).json({
        success: false,
        message: "Device is not connected!",
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Something went wrong while fetching devices data!",
    });
  }
};

exports.disconnect = async (req, res) => {
  try {
    if (client.isOpen) {
      await client.close(); // Close the Modbus connection
      flags.isConnected = false;
      flags.isReading = false;
      clearTimeout(flags.readInterval);
      stopReadingModbusData();

      res.status(200).json({
        success: true,
        message: "Device is disconnected!",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Port is not open or already disconnected!",
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Something went wrong while disconnecting the device!",
    });
  }
};
