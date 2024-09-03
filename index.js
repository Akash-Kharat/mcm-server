const express = require("express");
const app = express();
const cors = require("cors");
const morgan = require("morgan");
const flags = require("./utils/flags");
const { databaseConnection } = require("./config/database");
const deviceRoutes = require("./routes/device");
const groupRoutes = require("./routes/group");
const PORT = 5500;
databaseConnection();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(morgan("tiny"));
app.use("/api/v1/device", deviceRoutes);
app.use("/api/v1/group", groupRoutes);
app.get("/exit", (req, res) => {
  flags.isConnected = false;
  res.status(200).json({ success: true, message: "Server stopped!" });
  process.exit(0);
});
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
