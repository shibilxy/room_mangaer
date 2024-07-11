const express = require('express');
const OwnersController = require('./owners_controller');

const app = express();
app.use(express.json());

app.get('/owners', OwnersController.getAllPackages);
app.post('/owners', OwnersController.addPackage);
app.put('/owners/:id', OwnersController.updatePackage);
app.delete('/owners/:id', OwnersController.deletePackage);

module.exports = app;
