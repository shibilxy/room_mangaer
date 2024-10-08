const express = require('express');
const CustomersController = require('./customer_controller');

const app = express();
app.use(express.json());

app.get('/owners', CustomersController.getAllCustomers);
app.post('/owners', CustomersController.addCustomers);
app.put('/owners/:id', CustomersController.updateCustomers);
app.delete('/owners/:id', CustomersController.deleteCustomers);

module.exports = app;
