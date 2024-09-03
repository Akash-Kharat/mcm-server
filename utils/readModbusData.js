const client = require("../config/modbusClient");
const { SerialPort } = require("serialport");
const { deviceModel } = require("../models/device");
const fs = require("fs").promises;
const delay = require("./delay");
const flags = require("./flags");

const path = require("path");
// const configFile = path.join(
//   path.dirname(process.execPath),
//   "modbusConfig.json"
// );

// only dev mode
const configFile = "modbusConfig.json";

const readModbusDataWithTimeout = (
  client,
  startAddress,
  numberOfRegisters,
  timeout = 1000
) => {
  return Promise.race([
    client.readHoldingRegisters(startAddress, numberOfRegisters),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Read operation timed out!")), timeout)
    ),
  ]);
};

const readModbusDataWithRetry = async (
  client,
  startAddress,
  numberOfRegisters,
  retries = 3
) => {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await readModbusDataWithTimeout(
        client,
        startAddress,
        numberOfRegisters
      );
    } catch (err) {
      attempt++;
      if (attempt >= retries) throw err;
    }
  }
};

const readModbusData = async () => {
  try {
    const config = JSON.parse(await fs.readFile(configFile, "utf8"));
    const {
      holdingRegisterStart,
      holdingRegisterEnd,
      deviceIdStart,
      deviceIdEnd,
    } = config;

    const numberOfRegisters = holdingRegisterEnd - (holdingRegisterStart + 1);

    for (let deviceId = deviceIdStart; deviceId <= deviceIdEnd; deviceId++) {
      if (!flags.isReading) break; // Exit loop if reading is stopped

      console.log(`Reading data from Modbus Device ID - ${deviceId}`);
      client.setID(deviceId);

      try {
        const data = await readModbusDataWithRetry(
          client,
          holdingRegisterStart,
          numberOfRegisters,
          3 // Retry up to 3 times
        );
        console.log("Read Data:", data.data);

        const dbPayload = {
          slave_id: deviceId,
          baud_rate: data.data[1],
          operating_mode: data.data[2],
          fan_model: data.data[3],
          fan_status: data.data[4],
          fan_speed: data.data[5],
          fan_minimum_voltage: data.data[6],
          fan_maximum_voltage: data.data[7],
          sensor_minimum_voltage: data.data[8],
          sensor_maximum_voltage: data.data[9],
          fan_pulse: data.data[10],
          fan_fault: data.data[11],
          fan_power: data.data[12],
          fan_current: data.data[13],
          fan_ac_voltage: data.data[14],
          fan_rpm: data.data[15],
          diff_pressure: data.data[16],
          co2: data.data[17],
          temprature1: data.data[18],
          temprature2: data.data[19],
          humidity: data.data[20],
          pm2_5: data.data[21],
          pm10: data.data[22],
          tvoc: data.data[23],
        };

        const dbCheck = await deviceModel.findOne({ slave_id: deviceId });
        if (!dbCheck) {
          await deviceModel.create(dbPayload);
          console.log(`Modbus Device ID ${deviceId} data inserted.`);
        } else {
          await deviceModel.findOneAndUpdate(
            { slave_id: deviceId },
            dbPayload,
            {
              new: true,
            }
          );
          console.log(`Modbus Device ID ${deviceId} data updated.`);
        }
      } catch (err) {
        console.error(
          `Error reading from Modbus Device ID - ${deviceId}: ${err}`
        );
        // Handle errors appropriately here
      }

      await delay(100); // Small delay between reads
    }
  } catch (err) {
    console.error("Error in readModbusData:", err);
  } finally {
    if (flags.isReading) {
      flags.readInterval = setTimeout(readModbusData, 5000); // Adjust the delay as needed
    }
  }
};

const startReadingData = () => {
  if (!flags.isConnected) {
    console.log("Modbus device not connected! Try again.");
    return;
  }
  startReadingModbusData();
};

const attemptReconnect = async () => {
  while (!flags.isConnected) {
    try {
      await fs.access(configFile);
      const config = JSON.parse(await fs.readFile(configFile, "utf8"));
      const { path, baudRate } = config;
      const ports = await SerialPort.list();
      const portPaths = ports.map((port) => port.path);
      if (portPaths.includes(path)) {
        await client.connectRTUBuffered(path, { baudRate });
        flags.isConnected = true;
        console.log(`Reconnected to Modbus device on ${path}`);
        startReadingData();
      } else {
        console.log(`Previously selected port ${path} is not available`);
        flags.isConnected = false;
      }
    } catch (err) {
      if (err.code === "ENOENT") {
        console.log("Config file does not exist. Cannot reconnect.");
        break;
      } else {
        console.error("Error during reconnection:", err);
        flags.isConnected = false;
      }
    }
    if (!flags.isConnected) {
      console.log("Retrying reconnection in 5 seconds...");
      await delay(5000);
    }
  }
};

const startReadingModbusData = () => {
  if (flags.readInterval) {
    console.log("Automatic data reading is already running!");
    return;
  }
  flags.isReading = true; // Set the flag to true when starting
  flags.readInterval = setTimeout(readModbusData, 5000); // Start the first read
  console.log("Automatic data reading started.");
};

const stopReadingModbusData = () => {
  if (flags.readInterval) {
    clearTimeout(flags.readInterval);
    flags.readInterval = null;
    flags.isReading = false; // Set the flag to false when stopping

    console.log("Automatic data reading stopped.");
  } else {
    console.log("Automatic data reading is not running.");
  }
};

module.exports = {
  startReadingData,
  attemptReconnect,
  // readModbusDataWithRetry
  // readModbusDataWithTimeout,
  stopReadingModbusData,
  readModbusDataWithRetry,
};
