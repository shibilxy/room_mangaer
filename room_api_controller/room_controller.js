import { promisify } from "util";
import con, { query as _query } from "../connection";
import { getAllDocument, addDocuments, processDocuments } from "../document_api_controller/documents_controller";
import { getAllSpecifications, addSpecifications, updateOrAdd } from "../specifications_api_controller/specifications_controller";
import { getBuildingById, updateBuildingRooms } from "../building_api_controller/building_controller";

class RoomController {
  static async getAllRooms(req, res) {
    const query = promisify(_query).bind(con);

    try {
      const rooms = await query("SELECT * FROM room WHERE building_owner_id = ?", [req.params.id]);

      const results = await Promise.all(rooms.map(async (room) => {
        const specifications = await getAllSpecifications(room.id, "room");
        const documents = await getAllDocument(room.id, "room");
        const building = await getBuildingById(room.building_id);

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
          specifications: specifications,
          documents: documents,
        };
      }));

      res.send({
        success: true,
        data: results,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send({ error: err.message });
    }
  }

  static async getRoomsByBuildingId(building_id) {
    const query = promisify(_query).bind(con);

    try {
      const result = await query("SELECT * FROM room WHERE building_id = ?", [building_id]);
      return result;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  static async deleteRoomById(room_id) {
    const query = promisify(_query).bind(con);

    try {
      const result = await query("DELETE FROM room WHERE id = ?", [room_id]);
      return result;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  static async addRoom(req, res) {
    const data = req.body;
    const files = req.files;
    const specifications = data.specifications;

    data.kitchen = data.kitchen.toLowerCase() === "true";
    data.bathroom = data.bathroom.toLowerCase() === "true";
    delete data.specifications;

    try {
      if (data.building_id) {
        await updateBuildingRooms(data.building_id, false);
      }

      _query("INSERT INTO room SET ?", data, async (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).send({ error: "Something went wrong" });
        }

        try {
          await addDocuments(files, "room", result.insertId);
          await addSpecifications(specifications, "room", result.insertId);

          res.status(200).send({ success: true });
        } catch (err) {
          console.error(err);
          await RoomController.deleteRoomById(result.insertId);
          res.status(500).send({ error: "Something went wrong during room creation" });
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).send({ error: "Something went wrong" });
    }
  }

  static async updateRoom(req, res) {
    const query = promisify(_query).bind(con);
    const data = [];
    const fields = [];
    const files = req.files;

    try {
      if (req.body.building_id) {
        await this.updateBuildingRoomsCount(req.params.id, req.body.building_id);
        fields.push("building_id = ?");
        data.push(req.body.building_id);
      }

      this.addFieldIfExists(req.body.floor_no, "floor_no", fields, data);
      this.addFieldIfExists(req.body.hall_id, "hall_id", fields, data);
      this.addFieldIfExists(req.body.sharing, "sharing", fields, data);
      this.addFieldIfExists(req.body.default_price, "default_price", fields, data);
      this.addFieldIfExists(req.body.kitchen, "kitchen", fields, data, true);
      this.addFieldIfExists(req.body.bathroom, "bathroom", fields, data, true);
      this.addFieldIfExists(req.body.building_owner_id, "building_owner_id", fields, data);

      if (req.body.specifications) {
        await updateOrAdd(req.body.specifications);
      }

      if (fields.length === 0) {
        return res.status(400).send({ error: "No fields provided for update" });
      }

      const updateQuery = `UPDATE room SET ${fields.join(", ")} WHERE id = ?`;
      data.push(req.params.id);

      await query(updateQuery, data);

      if (files && files.length > 0) {
        if (!Array.isArray(req.body.documentIds)) {
          req.body.documentIds = JSON.parse(req.body.documentIds);
        }

        const documents = files.map((file, index) => ({
          id: req.body.documentIds?.[index] ?? null,
          file: [file],
        }));

        await processDocuments(documents, "room", req.params.id);
      }

      res.send({
        success: true,
        message: "Room updated successfully",
      });
    } catch (err) {
      console.error(err);
      res.status(500).send({ error: err.message });
    }
  }

  static async deleteRoom(req, res) {
    try {
      await this.updateBuildingRoomsCount(req.params.id, null);

      await this.deleteRoomById(req.params.id);

      res.send({
        success: true,
        message: "Room deleted successfully",
      });
    } catch (err) {
      console.error(err);
      res.status(500).send({
        success: false,
        message: "Room deletion failed",
        error: err.message,
      });
    }
  }

  static async updateBuildingRoomsCount(roomId, newBuildingId) {
    const query = promisify(_query).bind(con);

    try {
      const [room] = await query("SELECT building_id FROM room WHERE id = ?", [roomId]);

      if (room) {
        const oldBuildingId = room.building_id;

        if (newBuildingId !== null && oldBuildingId !== newBuildingId) {
          await updateBuildingRooms(oldBuildingId, true);
          await updateBuildingRooms(newBuildingId, false);
        } else {
          await updateBuildingRooms(oldBuildingId, true);
        }
      } else {
        throw new Error("Room not found");
      }
    } catch (err) {
      console.error(`Error updating building room count: ${err.message}`);
      throw new Error("Failed to update building room count");
    }
  }

  static addFieldIfExists(value, fieldName, fields, data, isBoolean = false) {
    if (value) {
      fields.push(`${fieldName} = ?`);
      data.push(isBoolean ? value.toLowerCase() === "true" : value);
    }
  }
}

export default RoomController;
