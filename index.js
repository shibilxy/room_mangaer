// require('./packages_api_controller/package_manager');
const express = require("express");
const multer = require("multer");

const storage = multer.memoryStorage(); // Store file buffer in memory
const upload = multer({ storage: storage });

const OwnersController = require("./owners_api_controller/owners_controller");
const BuildingController = require("./building_api_controler/building_controllers");
const app = express();

app.use(express.json());
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

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

app.get("/building", BuildingController.getAllbuisness_owners);
app.post(
  "/addBuilding",
  upload.fields([{ name: "images" }]),
  BuildingController.addBusinessOwner
);
app.put(
  "/building/:id",
  upload.fields([{ name: "images" }]),
  BuildingController.updateBuisnessOwner
);
app.delete("/building/:id", BuildingController.deleteBuisnessOwner);
