const util = require("util");
const AddressController = require("../address_api_controller/address_controller");
const con = require("../connection");
const DocumentsController = require("../document_api_controller/documents_controller");
const SpecificationController = require("../specifications_api_controller/specifications_controller");

class BuildingController {
  static getAllBuildingForRooms(docSpecId, type) {
    const query = util.promisify(con.query).bind(con);
    return query(
      "SELECT * FROM building WHERE id = ?",
      [docSpecId, type]
    )
      .then((result) => {
        console.log(result);
        return result;
      })
      .catch((err) => {
        console.error(err);
        throw err;
      });
  }
  static getAllBuilding(req, res) {
    const query = util.promisify(con.query).bind(con);

    query("SELECT * FROM building WHERE building_owner_id = ?", [req.params.id])
      .then(async (buildings) => {
        // Map through the buildings and fetch additional data
        const results = await Promise.all(
          buildings.map(async (building) => {
            const address = await AddressController.getAddress(
              building.address_id
            );
            const specification =
              await SpecificationController.getAllSpecifications(
                building.id,
                "building"
              );
            const documents = await DocumentsController.getAllDocument(
              building.id,
              "building"
            );
            return {
              id: building.id,
              name: building.name,
              description: building.description,
              balace: building.total_rooms - building.filled_rooms,
              no_of_floors: building.no_of_floors,
              total_rooms: building.total_rooms,
              filled_rooms: building.filled_rooms,
              specifications: specification,
              documents: documents,
              address: address || {}, // Ensure address defaults to an empty object if not found
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
  static async deleteBuildingById(building_id) {
    return new Promise((resolve, reject) => {
      con.query(
        "DELETE FROM building WHERE id = ?",
        [building_id],
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      );
    });
  }

  static async addBuilding(req, res) {
    console.log("error");
    const data = req.body;
    const files = req.files;
    const specifications = data.specifications;
    delete data.specifications;
    console.log("error");
    try {
      // Handle address
      if (data.address) {
        const result = await AddressController.addAddress(data.address);
        data.address_id = result.data.docid;
        delete data.address;
      }

      // Insert building
      con.query("INSERT INTO building SET ?", data, async (err, result) => {
        if (err) {
          return res.status(500).send({ error: "Something went wrong" });
        }

        try {
          await DocumentsController.addDocumentWithtype(
            files,
            "building",
            result.insertId
          );
          await SpecificationController.addSpecifications(
            specifications,
            "building",
            result.insertId
          );
          return res.status(200).send({ success: true });
        } catch (e) {
          console.log(e);
          await BuildingController.deleteBuildingById(result.insertId);
          await AddressController.deleteAddressById(data.address_id);
          return res
            .status(500)
            .send({ error: "Something went wrong " + result.insertId });
        }
      });
    } catch (e) {
      console.log(e);
      return res.status(500).send({ error: "Something went wrong" });
    }
  }
  static async updateBuilding(req, res) {
    const query = util.promisify(con.query).bind(con);
    try {
      // First, fetch the document IDs and address ID from the database
      const fetchQuery = "SELECT address_id FROM building WHERE id = ?";
      const fetchResult = await query(fetchQuery, [req.params.id]);
      if (fetchResult.length == 0) {
        return res.status(404).send({ error: "Building not found" });
      }

      const addressId = fetchResult[0].address_id;

      // Start with the base update query
      let updateQuery = "UPDATE building SET ";
      const data = [];
      const fields = [];
      const files = req.files;

      // Check which fields are provided and add them to the query
      if (req.body.no_of_floors) {
        fields.push("no_of_floors = ?");
        data.push(req.body.no_of_floors);
      }
      if (req.body.description) {
        fields.push("description = ?");
        data.push(req.body.description);
      }
      if (req.body.name) {
        fields.push("name = ?");
        data.push(req.body.name);
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
      if (req.body.specifications) {
        await SpecificationController.updateOrAdd(req.body.specifications);
      }

      // Ensure at least one field is being updated
      if (fields.length === 0) {
        return res.status(400).send({ error: "No fields provided for update" });
      }

      // Join the fields with commas and add the WHERE clause
      updateQuery += fields.join(", ") + " WHERE id = ?";
      data.push(req.params.id);

      // Execute the update query
      await query(updateQuery, data);

      // Process documents if provided
      if (files.length > 0) {
        if (!Array.isArray(req.body.documentIds)) {
          req.body.documentIds = JSON.parse(req.body.documentIds);
        }
        // console.log(req.body.documentIds);
        const documents = files.map((file, index) => ({
          id: req.body.documentIds?.[index] ?? null,
          file: [file],
        }));

        await DocumentsController.processDocuments(
          documents,
          "building",
          req.params.id
        );
      }

      res.send({
        success: true,
        data: {},
        message: "Building updated successfully",
      });
    } catch (err) {
      console.log(err);
      res.status(500).send({ error: err.message });
    }
  }

  static deleteBuilding(req, res) {
    const building_id = req.params.id;
    con.query(
      "DELETE FROM building WHERE id = ?",
      [building_id],
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

module.exports = BuildingController;
