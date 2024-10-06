// require('./packages_api_controller/package_manager');
const express = require("express");
const multer = require("multer");

const path = require("path");
const storage = multer.memoryStorage(); // Store file buffer in memory
const upload = multer({ storage: storage });

const OwnersController = require("./owners_api_controller/owners_controller");
const BuildingController = require("./building_api_controler/building_controllers");
const HallController = require("./hall_api_controller/hall_controller");
const RoomController = require("./room_api_controller/room_controller");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

const storageDir = path.join(__dirname, "storage");
app.use("/storage", express.static(storageDir));
//owners
app.get("/owners", OwnersController.getAllbuisness_owners);
app.post(
  "/addBusinessOwner",
  upload.fields([
    { name: "documentFront", maxCount: 1 },
    { name: "documentBack", maxCount: 1 },
  ]),
  OwnersController.addBusinessOwner
);
app.put(
  "/owners/:id",
  upload.fields([
    { name: "documentFront", maxCount: 1 },
    { name: "documentBack", maxCount: 1 },
  ]),
  OwnersController.updateBuisnessOwner
);
app.delete("/owners/:id", OwnersController.deleteBuisnessOwner);

app.get("/building/:id", BuildingController.getAllBuilding);
app.post(
  "/addBuilding",
  upload.array("images", 10),
  BuildingController.addBuilding
);
app.put("/building/:id", upload.array("images", 10), async (req, res) => {
  await BuildingController.updateBuilding(req, res);
});
app.delete("/building/:id", BuildingController.deleteBuilding);

app.get("/hall/:id", HallController.getAllhall);
app.post("/addHall", async (req, res) => {
  console.log(req.body);
  await HallController.addhall(req, res);
});
app.put("/hall/:id", HallController.updatehall);
app.delete("/hall/:id", HallController.deletehall);

app.get("/room/:id", RoomController.getAllroom);
app.post("/addRoom", upload.array("images", 10), RoomController.addRoom);
app.put("/room/:id", upload.array("images", 10), async (req, res) => {
  await RoomController.updateroom(req, res);
});
app.delete("/room/:id", RoomController.deleteroom);
