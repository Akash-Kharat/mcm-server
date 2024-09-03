const ModbusRTU = require("modbus-serial");

const client = new ModbusRTU();

client.on("error", (err) => {
  console.error("Modbus client connection error - ", err.message);
  isConnected = false;
  // scheduleReconnect();
});

module.exports = client;
