const util = require("util");
const con = require("../connection");
const AddressController = require("../address_api_controller/address_controller");

const DocumentsController = require("../document_api_controller/documents_controller");
class OwnersController {
  static getAllbuisness_owners(req, res) {
    // Promisify the query method
    const query = util.promisify(con.query).bind(con);

    query("SELECT * FROM buisness_owner")
      .then(async (owners) => {
        // Map through the owners and fetch additional data
        const results = await Promise.all(
          owners.map(async (owner) => {
            const address = await AddressController.getAddress(
              owner.address_id
            );
            const documentFronturl = await DocumentsController.getDocument(
              owner.documentFrontid
            );
            const documentBackurl = await DocumentsController.getDocument(
              owner.documentBackid
            );

            return {
              id: owner.id,
              user_name: owner.user_name,
              password: owner.password,
              buisness_name: owner.buisness_name,
              phone_number: owner.phone_number,
              address: address || {}, // Ensure address defaults to an empty object if not found
              documentFronturl: documentFronturl || "", // Ensure URLs default to an empty string if not found
              documentBackurl: documentBackurl || "", // Ensure URLs default to an empty string if not found
              alternative_number: owner.alternative_number,
              start_date: owner.start_date,
              end_date: owner.end_date,
              price: owner.price,
              total_income: owner.total_income,
              total_caution_deposit: owner.total_caution_deposit,
              status: owner.status,
              email: owner.email,
              type: owner.type,
            };
          })
        );

        // Send the response
        res.send({
          success: true,
          data: results,
        });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send({ error: err.message });
      });
  }

  static async addBusinessOwner(req, res) {
    const data = req.body;
    const files = req.files; // Assuming files are available in req.files

    try {
      // Add documentFront if present
      if (files.documentFront != null && files.documentFront) {
        const result = await DocumentsController.addDocument(
          files.documentFront
        );
        data.documentFrontid = result.data.docid;
      }

      // Add documentBack if present
      if (files.documentBack && files.documentBack != null) {
        const result = await DocumentsController.addDocument(
          files.documentBack
        );
        data.documentBackid = result.data.docid;
      }
      if (data.address) {
        const result = await AddressController.addAddress(data.address);

        data.address_id = result.data.docid;

        delete data.address;
      }
      // console.log(data);

      delete data.documentBack;

      delete data.documentFront;
      // Insert business owner data into the database
      con.query("INSERT INTO buisness_owner SET ?", data, (err, result) => {
        if (err) {
          console.log(err);
          res.status(450).send({
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
        succes: false,
        data: {},
        message: "owner addededdd failed",
      });
    }
  }
  static async updateBuisnessOwner(req, res) {
    const query = util.promisify(con.query).bind(con);
    try {
      // First, fetch the document IDs and address ID from the database
      const fetchQuery =
        "SELECT documentFrontid, documentBackid, address_id FROM buisness_owner WHERE id = ?";
      const fetchResult = await query(fetchQuery, [req.params.id]);
      console.log(fetchResult.length);
      if (fetchResult.length == 0) {
        return res.status(404).send({ error: "Business owner not found" });
      }
      const frontDocId = fetchResult[0].documentFrontid;
      const backDocId = fetchResult[0].documentBackid;
      const addressId = fetchResult[0].address_id;

      console.log();
      // Start with the base update query
      let updateQuery = "UPDATE buisness_owner SET ";
      const data = [];
      const fields = [];
      const files = req.files;

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
      if (req.body.status) {
        fields.push("status = ?");
        data.push(req.body.status);
      }
      if (req.body.contact_number) {
        fields.push("contact_number = ?");
        data.push(req.body.contact_number);
      }
      if (files && files.documentFront) {
        if (frontDocId == null) {
          const result = await DocumentsController.addDocument(
            files.documentFront
          );
          const documentFrontid = result.data.docid;
          fields.push("documentFrontid = ?");
          data.push(documentFrontid);
        } else {
          await DocumentsController.updateDocument(
            frontDocId,
            files.documentFront
          );
        }
      }
      if (files && files.documentBack) {
        if (backDocId == null) {
          const result = await DocumentsController.addDocument(
            files.documentBack
          );
          const documentBackid = result.data.docid;
          fields.push("documentBackid = ?");
          data.push(documentBackid);
        } else {
          console.log("hhhh");
          await DocumentsController.updateDocument(
            backDocId,
            files.documentBack
          );
        }
      }
      if (req.body.address) {
        if (addressId == null) {
          const result = await AddressController.addAddress(req.body.address);

          const address_id = result.data.docid;
          fields.push("address_id = ?");
          data.push(address_id);
        } else {
          await AddressController.updateAddress(addressId, req.body.address);
        }
      }
      if (req.body.type) {
        fields.push("type = ?");
        data.push(req.body.type);
      }
      if (req.body.alternative_number) {
        fields.push("alternative_number = ?");
        data.push(req.body.alternative_number);
      }
      if (req.body.start_date) {
        fields.push("start_date = ?");
        data.push(req.body.start_date);
      }
      if (req.body.end_date) {
        fields.push("end_date = ?");
        data.push(req.body.end_date);
      }
      if (req.body.price) {
        fields.push("price = ?");
        data.push(req.body.price);
      }
      if (req.body.total_income) {
        fields.push("total_income = ?");
        data.push(req.body.total_income);
      }
      if (req.body.total_caution_deposit) {
        fields.push("total_caution_deposit = ?");
        data.push(req.body.total_caution_deposit);
      }

      // Ensure at least one field is being updated
      if (fields.length === 0) {
        return res.status(400).send({ error: "No fields provided for update" });
      }

      // Join the fields with commas and add the WHERE clause
      updateQuery += fields.join(", ") + " WHERE id = ?";
      data.push(req.params.id);

      // Execute the update query
      const updateResult = await query(updateQuery, data);
      res.send(updateResult);
    } catch (err) {
      console.log(err);
      res.status(500).send({ error: err.message });
    }
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
