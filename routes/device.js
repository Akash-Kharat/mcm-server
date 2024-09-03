const express = require("express");
const {
  devicesData,
  getPorts,
  portConnection,
  updateDeviceData,
  checkConnection,
  disconnect,
} = require("../controllers/device");

const router = express.Router();

router.get("/check-connection", checkConnection);
router.get("/get-ports", getPorts);

router.post("/port-connection", portConnection);

router.get("/devices-data", devicesData);

router.post("/update-device-data", updateDeviceData);
router.post("/disconnect", disconnect);

module.exports = router;
