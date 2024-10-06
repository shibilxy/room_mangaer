const util = require("util");
const con = require("../connection");
const AddressController = require("../address_api_controller/address_controller");
const DocumentsController = require("../document_api_controller/documents_controller");

class OwnersController {
  // Utility function to get complete owner data
  static async getCompleteOwnerData(owner) {
    try {
      const address = owner.address_id
        ? await AddressController.getAddress(owner.address_id)
        : {};
      const documentFronturl = owner.documentFrontid
        ? await DocumentsController.getDocument(owner.documentFrontid)
        : "";
      const documentBackurl = owner.documentBackid
        ? await DocumentsController.getDocument(owner.documentBackid)
        : "";

      return {
        id: owner.id,
        user_name: owner.user_name,
        buisness_name: owner.buisness_name,
        phone_number: owner.phone_number,
        address: address || {},
        documentFronturl: documentFronturl || "",
        documentBackurl: documentBackurl || "",
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
    } catch (err) {
      console.error("Error fetching owner data:", err);
      throw new Error("Failed to retrieve complete owner data.");
    }
  }

  // Validate required fields
  static validateRequiredFields(data, requiredFields) {
    const missingFields = requiredFields.filter(
      (field) => !data.hasOwnProperty(field) || !data[field]
    );
    return missingFields;
  }

  // Check if email already exists
  static async emailExists(email) {
    const query = util.promisify(con.query).bind(con);
    const result = await query("SELECT * FROM buisness_owner WHERE email = ?", [email]);
    return result.length > 0;
  }

  // Login method
  static async login(req, res) {
    const { email, password } = req.body;
    const query = util.promisify(con.query).bind(con);

    try {
      if (!email || !password) {
        return res.status(400).send({ error: "Email and password are required." });
      }

      // Check if the email exists
      const owners = await query("SELECT * FROM buisness_owner WHERE email = ?", [email]);
      if (owners.length === 0) {
        return res.status(401).send({ error: "Invalid email or password." });
      }

      const owner = owners[0];
      // Check the password (assuming plain text for demo purposes; use hashing in production)
      if (owner.password !== password) {
        return res.status(401).send({ error: "Invalid email or password." });
      }

      // Fetch complete owner data
      const ownerData = await OwnersController.getCompleteOwnerData(owner);

      res.send({
        success: true,
        data: ownerData,
      });
    } catch (err) {
      console.log(err);
      res.status(500).send({ error: err.message });
    }
  }

  // Get all business owners
  static async getAllBusinessOwners(req, res) {
    try {
      const query = util.promisify(con.query).bind(con);

      // Get all business owners
      const owners = await query("SELECT * FROM buisness_owner");

      // Map through the owners and fetch additional data using the utility function
      const results = await Promise.all(
        owners.map(async (owner) => await OwnersController.getCompleteOwnerData(owner))
      );

      // Send the response
      res.send({
        success: true,
        data: results,
      });
    } catch (err) {
      console.log(err);
      res.status(500).send({ error: err.message });
    }
  }

  // Get business owner by ID
  static async getOwnerById(req, res) {
    const ownerId = req.params.id;
    const query = util.promisify(con.query).bind(con);

    try {
      // Fetch owner by ID
      const owners = await query("SELECT * FROM buisness_owner WHERE id = ?", [ownerId]);

      if (owners.length === 0) {
        return res.status(404).send({ error: "Owner not found." });
      }

      // Fetch complete owner data
      const ownerData = await OwnersController.getCompleteOwnerData(owners[0]);

      res.send({
        success: true,
        data: ownerData,
      });
    } catch (err) {
      console.log(err);
      res.status(500).send({ error: err.message });
    }
  }

  // Add a new business owner
  static async addBusinessOwner(req, res) {
    const data = req.body;
    const files = req.files;

    try {
      // Validate required fields
      const requiredFields = [
        "user_name",
        "password",
        "start_date",
        "end_date",
        "price",
        "email",
        "type",
        "documentFront",
        "address",
        "buisness_name",
        "phone_number",
      ];
    
      const missingFields = OwnersController.validateRequiredFields(data, requiredFields);
      if (missingFields.length > 0) {
        return res.status(400).send({ error: `Missing required fields: ${missingFields.join(", ")}` });
      }

      // Check if email already exists
      if (await OwnersController.emailExists(data.email)) {
        return res.status(400).send({ error: "Email already exists." });
      }

      // Add documentFront if present
      if (files.documentFront) {
        const result = await DocumentsController.addDocument(files.documentFront, null, null);
        data.documentFrontid = result.data.docid;
      }

      // Add documentBack if present
      if (files.documentBack) {
        const result = await DocumentsController.addDocument(files.documentBack, null, null);
        data.documentBackid = result.data.docid;
      }

      // Add address if present
      if (data.address) {
        const result = await AddressController.addAddress(data.address);
        data.address_id = result.data.docid;
        delete data.address;
      }

      // Insert business owner data into the database
      const query = util.promisify(con.query).bind(con);
      await query("INSERT INTO buisness_owner SET ?", data);

      res.status(200).send({
        success: true,
        data: {},
        message: "Owner added successfully",
      });
    } catch (err) {
      console.log(err);
      res.status(500).send({
        success: false,
        data: {},
        message: "Failed to add owner",
      });
    }
  }

  // Update an existing business owner
  static async updateBusinessOwner(req, res) {
    const query = util.promisify(con.query).bind(con);
    try {
      // Fetch the document IDs and address ID from the database
      const fetchQuery = "SELECT documentFrontid, documentBackid, address_id FROM buisness_owner WHERE id = ?";
      const fetchResult = await query(fetchQuery, [req.params.id]);

      if (fetchResult.length === 0) {
        return res.status(404).send({ error: "Business owner not found" });
      }

      const frontDocId = fetchResult[0].documentFrontid;
      const backDocId = fetchResult[0].documentBackid;
      const addressId = fetchResult[0].address_id;

      // Update fields
      const data = [];
      const fields = [];
      const files = req.files;

      // Check and add fields to be updated
      if (req.body.buisness_name) fields.push("buisness_name = ?"), data.push(req.body.buisness_name);
      if (req.body.user_name) fields.push("user_name = ?"), data.push(req.body.user_name);
      if (req.body.password) fields.push("password = ?"), data.push(req.body.password);
      if (req.body.status) fields.push("status = ?"), data.push(req.body.status);
      if (req.body.contact_number) fields.push("contact_number = ?"), data.push(req.body.contact_number);
      if (req.body.type) fields.push("type = ?"), data.push(req.body.type);
      if (req.body.alternative_number) fields.push("alternative_number = ?"), data.push(req.body.alternative_number);
      if (req.body.start_date) fields.push("start_date = ?"), data.push(req.body.start_date);
      if (req.body.end_date) fields.push("end_date = ?"), data.push(req.body.end_date);
      if (req.body.price) fields.push("price = ?"), data.push(req.body.price);
      if (req.body.total_income) fields.push("total_income = ?"), data.push(req.body.total_income);
      if (req.body.total_caution_deposit) fields.push("total_caution_deposit = ?"), data.push(req.body.total_caution_deposit);

      // Update documentFront
      if (files && files.documentFront) {
        if (!frontDocId) {
          const result = await DocumentsController.addDocument(files.documentFront, null, null);
          fields.push("documentFrontid = ?"), data.push(result.data.docid);
        } else {
          await DocumentsController.updateDocument(frontDocId, files.documentFront, null, null);
        }
      }

      // Update documentBack
      if (files && files.documentBack) {
        if (!backDocId) {
          const result = await DocumentsController.addDocument(files.documentBack, null, null);
          fields.push("documentBackid = ?"), data.push(result.data.docid);
        } else {
          await DocumentsController.updateDocument(backDocId, files.documentBack, null, null);
        }
      }

      // Update address
      if (req.body.address) {
        if (!addressId) {
          const result = await AddressController.addAddress(req.body.address);
          fields.push("address_id = ?"), data.push(result.data.docid);
        } else {
          await AddressController.updateAddress(addressId, req.body.address);
        }
      }

      // Ensure at least one field is being updated
      if (fields.length === 0) {
        return res.status(400).send({ error: "No fields provided for update" });
      }

      // Join the fields with commas and add the WHERE clause
      const updateQuery = "UPDATE buisness_owner SET " + fields.join(", ") + " WHERE id = ?";
      data.push(req.params.id);

      // Execute the update query
      await query(updateQuery, data);
      res.send({
        success: true,
        data: {},
        message: "Owner updated successfully",
      });
    } catch (err) {
      console.log(err);
      res.status(500).send({ error: err.message });
    }
  }

  // Delete a business owner
  static async deleteBusinessOwner(req, res) {
    try {
      const query = util.promisify(con.query).bind(con);
      const result = await query("DELETE FROM buisness_owner WHERE id = ?", [req.params.id]);

      if (result.affectedRows === 0) {
        return res.status(404).send({ error: "Business owner not found" });
      }

      res.send({
        success: true,
        message: "Owner deleted successfully",
      });
    } catch (err) {
      console.log(err);
      res.status(500).send({ error: err.message });
    }
  }
}

module.exports = OwnersController;
