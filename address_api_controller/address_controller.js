const con = require("../connection");
const util = require('util');

class AddressController {
  static async getAddress(address_id) {
    const query = util.promisify(con.query).bind(con);
    try {
      const result = await query("SELECT * FROM address WHERE id = ?", [address_id]);
      return result[0] || {};
    } catch (err) {
      console.error(err);
      throw err;
    }
  }


  static addAddress(address) {
    return new Promise((resolve, reject) => {
      // Create the storage directory if it doesn't exist

      // Insert into the database
      con.query("INSERT INTO address SET ?", address, (err, result) => {
        if (err) {
          return reject({
            success: false,
            message: err.message,
          });
        } else {
          resolve({
            success: true,
            data: {
              docid: result.insertId,
            },
          });
        }
      });
    });
  }
  static updateAddress(id, address) {
    // Start with the base query
    let query = "UPDATE address SET ";
    const data = [];
    const fields = [];

    // Check which fields are provided and add them to the query
    if (address.house_name) {
      fields.push("house_name = ?");
      data.push(address.house_name);
    }
    if (address.street) {
      fields.push("street = ?");
      data.push(address.street);
    }
    if (address.district) {
      fields.push("district = ?");
      data.push(address.district);
    }
    if (address.landmark) {
      fields.push("landmark = ?");
      data.push(address.landmark);
    }
    if (address.state) {
      fields.push("state = ?");
      data.push(address.state);
    }
    if (address.city) {
      fields.push("city = ?");
      data.push(address.city);
    }
    if (address.country) {
      fields.push("country = ?");
      data.push(address.country);
    }

    // Ensure at least one field is being updated
    if (fields.length === 0) {
      return Promise.reject({
        success: false,
        message: "No fields provided for update",
      });
    }

    // Join the fields with commas and add the WHERE clause
    query += fields.join(", ") + " WHERE id = ?";
    data.push(id);

    return new Promise((resolve, reject) => {
      // Update the database
      con.query(query, data, (err, result) => {
        if (err) {
          reject({
            success: false,
            message: err.message,
          });
        } else {
          resolve({
            success: true,
            data: {
              id: id,
            },
          });
        }
      });
    });
  }
  static async deleteAddressById(building_id) {
    return new Promise((resolve, reject) => {
      con.query(
        "DELETE FROM address WHERE id = ?",
        [building_id],
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      );
    });
  }
  static deleteAddress(req, res) {
    const address_id = req.params.id;
    con.query(
      "DELETE FROM address WHERE id = ?",
      [address_id],
      (err, result) => {
        if (err) {
          res.status(500).send({ error: err.message });
        } else {
          res.send(result);
        }
      }
    );
  }
}

module.exports = AddressController;
