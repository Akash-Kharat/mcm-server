const express = require("express");

const {
  createGroup,
  groupData,
  groupNames,
  groupsData,
  deleteGroup,
  removeDevicesFromGroup,
  updateDevicesFromGroup,
} = require("../controllers/group");

const router = express.Router();

router.get("/group-names", groupNames);

router.get("/groups-data", groupsData);

router.post("/create-group", createGroup);

router.get("/group-data/:groupId", groupData);

router.get("/delete-group/:groupId", deleteGroup);

router.post("/update-group", removeDevicesFromGroup);

router.post("/update-group/add-devices", updateDevicesFromGroup);

module.exports = router;
