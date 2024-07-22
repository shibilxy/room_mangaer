const express = require('express');
const OwnersController = require('./owners_controller');

const app = express();
app.use(express.json());


app.get("/hall/:id", HallController.getAllhall);
app.post("/addHall", async (req, res) => {
  console.log(req.body);
  await HallController.addhall(req, res);
});
app.put("/hall/:id", HallController.updatehall);
app.delete("/hall/:id", HallController.deletehall);

module.exports = app;
