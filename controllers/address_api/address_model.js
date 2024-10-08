const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    house_name: String,
    street: String,
    district: String,
    landmark: String,
    state: String,
    city: String,
    country: String,
});

const Address = mongoose.model('Address', addressSchema);
module.exports = Address;
