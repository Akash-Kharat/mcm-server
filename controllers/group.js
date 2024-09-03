const { deviceModel } = require("../models/device");
const { groupModel } = require("../models/group");

exports.groupNames = async (req, res) => {
  try {
    const response = await groupModel.find().select(["id", "group"]);
    res.status(200).json({
      success: true,
      message: "Group names fetched successfully!",
      data: response,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Something went wrong while fetching group names data!",
    });
  }
};

exports.groupsData = async (req, res) => {
  try {
    const response = await groupModel.find();
    res.status(200).json({
      success: true,
      message: "Groups data fetched successfully!",
      data: response,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Something went wrong while fetching groups data!",
    });
  }
};

exports.createGroup = async (req, res) => {
  const { groupName, device_Id } = req.body;
  console.log(groupName);
  try {
    const dbResponse = await groupModel.create({
      group: groupName,
      deviceId: device_Id,
    });

    const updateResponse = await deviceModel.updateMany(
      { _id: { $in: device_Id } }, // Matching condition: _id is in the array of device IDs
      {
        $set: {
          isGrouped: true,
          group: groupName,
        },
      }
    );

    console.log(updateResponse);

    res.status(200).json({
      message: `group ${groupName} created successfully`,
      success: true,
      groupId: dbResponse._id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message, success: false });
  }
};

exports.groupData = async (req, res) => {
  try {
    const response = await groupModel.findOne({ _id: req.params.groupId });
    res.status(200).json({
      success: true,
      message: "Group data fetched successfully!",
      data: response,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Something went wrong while fetching group data!",
    });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const groupData = await groupModel.findOne({ _id: groupId });
    const devicesIdArray = groupData.deviceId;
    await deviceModel.updateMany(
      { _id: { $in: devicesIdArray } },
      {
        $set: {
          isGrouped: false,
          group: "",
        },
      }
    );
    await groupModel.deleteOne({ _id: groupId });
    res.status(200).json({
      success: true,
      message: "Group deleted successfully!",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while deleting group!",
    });
  }
};

exports.removeDevicesFromGroup = async (req, res) => {
  try {
    const { groupId, devicesId } = req.body;
    console.log(groupId);

    // Find the group by ID
    const groupData = await groupModel.findOne({ _id: groupId });

    if (!groupData) {
      return res.status(404).json({
        success: false,
        message: "Group not found!",
      });
    }

    // Filter out the specified devices from the group's deviceId array
    const updatedDeviceIdArray = groupData.deviceId.filter(
      (deviceId) => !devicesId.includes(deviceId.toString())
    );

    // Update the group's deviceId array
    groupData.deviceId = updatedDeviceIdArray;
    await groupData.save();

    // Update the specified devices' isGrouped status and group field
    await deviceModel.updateMany(
      { _id: { $in: devicesId } },
      {
        $set: {
          isGrouped: false,
          group: "",
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "Devices removed from group successfully!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while removing devices from group!",
    });
  }
};

exports.updateDevicesFromGroup = async (req, res) => {
  try {
    const { groupId, devicesId } = req.body;
    console.log(groupId);

    // Find the group by ID
    const groupData = await groupModel.findOne({ _id: groupId });

    if (!groupData) {
      return res.status(404).json({
        success: false,
        message: "Group not found!",
      });
    }

    // Filter out the specified devices from the group's deviceId array
    const updatedDeviceIdArray =  [...groupData.deviceId, ...devicesId];

    console.log(updatedDeviceIdArray);

    // Update the group's deviceId array
    groupData.deviceId = updatedDeviceIdArray;
    await groupData.save();

    // Update the specified devices' isGrouped status and group field
    await deviceModel.updateMany(
      { _id: { $in: devicesId } },
      {
        $set: {
          isGrouped: true,
          group: groupData.group,
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "Devices added to the group successfully!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while adding devices to the group!",
    });
  }
};
