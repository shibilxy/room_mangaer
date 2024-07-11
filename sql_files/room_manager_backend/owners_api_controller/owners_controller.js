const AddressController = require("../address_api_controller/address_controller");
const con = require("../connection");
const DocumentsController = require("../document_api_controller/documents_controller");
class OwnersController {
  static getAllbuisness_owners(req, res) {
    con.query("SELECT * FROM buisness_owner", (err, result) => {
      if (err) {
        res.status(500).send({ error: err.message });
      } else {
        res.send(result);
      }
    });
  }

  static async addBusinessOwner(req, res) {
    const data = req.body;
    const files = req.files; // Assuming files are available in req.files

    try {
      // Add documentFront if present
      if (files.documentFront) {
        const result = await DocumentsController.addDocument(
          files.documentFront,
          "documentFront"
        );
        data.documentFrontid = result.data.docid;
      }

      // Add documentBack if present
      if (files.documentBack) {
        const result = await DocumentsController.addDocument(
          files.documentBack,
          "documentBack"
        );
        data.documentBackid = result.data.docid;
      }
      if (data.address) {
        const result = await AddressController.addAddress(data.address);
        data.address_id = result.data.docid;
      }

      // Insert business owner data into the database
      con.query("INSERT INTO buisness_owner SET ?", data, (err, result) => {
        if (err) {
          res.status(500).send({
            succes: false,
            data: {},
            message: "owner added failed",
          });
        } else {
          res.status(200).send({
            succes: true,
            data: {},
            message: "owner added sucessfully",
          });
        }
      });
    } catch (err) {
      console.log(err);
      res.status(500).send({
        succes: true,
        data: {},
        message: "owner added failed",
      });
    }
  }

  static updateBuisnessOwner(req, res) {
    // Start with the base query
    let query = "UPDATE buisness_owner SET ";
    const data = [];
    const fields = [];

    // Check which fields are provided and add them to the query
    if (req.body.buisness_name) {
      fields.push("buisness_name = ?");
      data.push(req.body.buisness_name);
    }
    if (req.body.user_name) {
      fields.push("user_name = ?");
      data.push(req.body.user_name);
    }
    if (req.body.password) {
      fields.push("password = ?");
      data.push(req.body.password);
    }
    if (req.body.package_activate_date) {
      fields.push("package_activate_date = ?");
      data.push(req.body.package_activate_date);
    }
    if (req.body.status) {
      fields.push("status = ?");
      data.push(req.body.status);
    }
    if (req.body.contact_number) {
      fields.push("contact_number = ?");
      data.push(req.body.contact_number);
    }
    if (req.body.address) {
      fields.push("address = ?");
      data.push(req.body.address);
    }
    if (req.body.document) {
      fields.push("document_uid = ?");
      data.push(req.body.document_uid);
    }
    if (req.body.type) {
      fields.push("type = ?");
      data.push(req.body.type);
    }
    // Ensure at least one field is being updated
    if (fields.length === 0) {
      return res.status(400).send({ error: "No fields provided for update" });
    }

    // Join the fields with commas and add the WHERE clause
    query += fields.join(", ") + " WHERE id = ?";
    data.push(req.params.id);

    // Execute the query
    con.query(query, data, (err, result) => {
      if (err) {
        res.status(500).send({ error: err.message });
      } else {
        res.send(result);
      }
    });
  }

  static deleteBuisnessOwner(req, res) {
    const buisness_owner_id = req.params.id;
    con.query(
      "DELETE FROM buisness_owner WHERE id = ?",
      [buisness_owner_id],
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

module.exports = OwnersController;
