const util = require("util");
const AddressController = require("../address_api_controller/address_controller");
const con = require("../connection");
const DocumentsController = require("../document_api_controller/documents_controller");
const SpecificationController = require("../specifications_api_controller/specifications_controller");
const BuildingController = require("../building_api_controler/building_controllers");

class RoomController {
  static getAllroom(req, res) {
    const query = util.promisify(con.query).bind(con);

    query("SELECT * FROM room WHERE building_owner_id = ?", [req.params.id])
      .then(async (rooms) => {
        // Map through the rooms and fetch additional data
        const results = await Promise.all(
          rooms.map(async (room) => {
            const address = await AddressController.getAddress(
              room.address_id
            );
            const specification =
              await SpecificationController.getAllSpecifications(
                room.id,
                "room"
              );
            const documents = await DocumentsController.getAllDocument(
              room.id,
              "room"
            ); const building = await BuildingController.getAllBuildingForRooms(
              room.building_id,
              "room"
            );
            return {
              id: room.id,
              building: building,
              floor_no: room.floor_no,
              hall_id: room.hall_id,
              sharing: room.sharing,
              default_price: room.default_price,
              kitchen: room.kitchen,
              bathroom: room.bathroom,
              filled: room.filled_rooms,
              balance: room.sharing - room.filled_rooms,
  
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
  static async deleteroomById(room_id) {
    return new Promise((resolve, reject) => {
      con.query(
        "DELETE FROM room WHERE id = ?",
        [room_id],
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      );
    });
  }

  static async addRoom(req, res) {
    console.log("error");
    const data = req.body;
    const files = req.files;
    const specifications = data.specifications;
    delete data.specifications;
    console.log("error");
    try {
      // Handle address
      
      console.log(data);

      // Insert room
      con.query("INSERT INTO room SET ?", data, async (err, result) => {
        if (err) {
          
          console.log(err);
          return res.status(500).send({ error: "Something went wrong" });
        }

        try {
          await DocumentsController.addDocumentWithtype(
            files,
            "room",
            result.insertId
          );
          await SpecificationController.addSpecifications(
            specifications,
            "room",
            result.insertId
          );
          return res.status(200).send({ success: true });
        } catch (e) {
          console.log(e);
          await RoomController.deleteroomById(result.insertId);
        
          return res
            .status(500)
            .send({ error: "Something went wrong " + result.insertId });
        }
      });
    } catch (e) {
      console.log(e);
      
      return res.status(500).send({ error: "Something went wrongg" });
    }
  }
  static async updateroom(req, res) {
    const query = util.promisify(con.query).bind(con);
    try {


      // Start with the base update query
      let updateQuery = "UPDATE room SET ";
      const data = [];
      const fields = [];
      const files = req.files;

      // Check which fields are provided and add them to the query
      if (req.body.building_id) {
        fields.push("building_id = ?");
        data.push(req.body.building_id);
      }
      if (req.body.floor_no) {
        fields.push("floor_no = ?");
        data.push(req.body.floor_no);
      }
      if (req.body.hall_id) {
        fields.push("hall_id = ?");
        data.push(req.body.hall_id);
      }
      if (req.body.sharing) {
        fields.push("sharing = ?");
        data.push(req.body.sharing);
      }
      if (req.body.default_price) {
        fields.push("default_price = ?");
        data.push(req.body.default_price);
      }
      if (req.body.kitchen) {
        fields.push("kitchen = ?");
        data.push(req.body.kitchen);
      }
      if (req.body.bathroom) {
        fields.push("bathroom = ?");
        data.push(req.body.bathroom);
      }
      if (req.body.building_owner_id) {
        fields.push("building_owner_id = ?");
        data.push(req.body.building_owner_id);
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
          "room",
          req.params.id
        );
      }

      res.send({
        success: true,
        data: {},
        message: "room updated successfully",
      });
    } catch (err) {
      console.log(err);
      res.status(500).send({ error: err.message });
    }
  }

  static deleteroom(req, res) {
    const room_id = req.params.id;
    con.query(
      "DELETE FROM room WHERE id = ?",
      [room_id],
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

module.exports = RoomController;
