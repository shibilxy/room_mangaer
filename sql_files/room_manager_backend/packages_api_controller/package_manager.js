const express = require('express');
const PackageController = require('./package_controller');

const app = express();
app.use(express.json());

app.get('/package', PackageController.getAllPackages);
app.post('/package', PackageController.addPackage);
app.put('/package/:id', PackageController.updatePackage);
app.delete('/package/:id', PackageController.deletePackage);

module.exports = app;
