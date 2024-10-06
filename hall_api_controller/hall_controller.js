const util = require("util");
const con = require("../connection");

class HallController {
  static async getAllhall(req, res) {
    const query = util.promisify(con.query).bind(con);
    const userId = req.params.id;

    if (!userId) {
      return res.status(400).send({ error: "User ID is required" });
    }

    try {
      const halls = await query("SELECT * FROM hall WHERE user_id = ?", [userId]);
      res.send({
        success: true,
        data: halls,
      });
    } catch (err) {
      console.error("Error fetching halls:", err);
      res.status(500).send({ error: err.message });
    }
  }
  static getHallsbyBuildingId(building_id) {
    const query = util.promisify(con.query).bind(con);
    return query(
      "SELECT * FROM hall WHERE building_id = ?", 
      [building_id]
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

  static async deletehallById(hall_id) {
    const query = util.promisify(con.query).bind(con);

    if (!hall_id) {
      throw new Error("Hall ID is required");
    }

    try {
      const result = await query("DELETE FROM hall WHERE id = ?", [hall_id]);
      return result;
    } catch (err) {
      console.error("Error deleting hall:", err);
      throw err;
    }
  }

  static async addhall(req, res) {
    console.log("Request received");
    const data = req.body;
    console.log("Data received:", data);

    if (!data || Object.keys(data).length === 0) {
      console.log("Data is empty");
      return res.status(400).send({ error: "No data provided" });
    }

    const query = util.promisify(con.query).bind(con);
   

    try {
      const sql = con.format("INSERT INTO hall SET ?", data);
      console.log("SQL Query:", sql);

      await query(sql);
      console.log("Insert successful");
      res.status(200).send({ success: true });
    } catch (err) {
      console.error("SQL Error:", err);
      res.status(500).send({ error: "Something went wrong" });
    }
  }

  static async updatehall(req, res) {
    const query = util.promisify(con.query).bind(con);
    const hallId = req.params.id;
    const data = req.body;

    if (!hallId) {
      return res.status(400).send({ error: "Hall ID is required" });
    }

    try {
      const fetchResult = await query("SELECT * FROM hall WHERE id = ?", [hallId]);

      if (fetchResult.length === 0) {
        return res.status(404).send({ error: "Hall not found" });
      }

      let updateQuery = "UPDATE hall SET ";
      const fields = [];
      const values = [];

      // Construct the query dynamically based on provided fields
      Object.keys(data).forEach((key) => {
        if (["building_id", "floor_no", "hall_name", "no_of_rooms", "kitchen", "bathroom", "user_id"].includes(key)) {
          fields.push(`${key} = ?`);
          values.push(data[key]);
        }
      });

      if (fields.length === 0) {
        return res.status(400).send({ error: "No fields provided for update" });
      }

      updateQuery += fields.join(", ") + " WHERE id = ?";
      values.push(hallId);

      await query(updateQuery, values);
      res.send({
        success: true,
        message: "Hall updated successfully",
      });
    } catch (err) {
      console.error("Error updating hall:", err);
      res.status(500).send({ error: err.message });
    }
  }

  static async deletehall(req, res) {
    const hallId = req.params.id;

    if (!hallId) {
      return res.status(400).send({ error: "Hall ID is required" });
    }

    try {
      const result = await this.deletehallById(hallId);
      res.send({
        success: true,
        message: "Hall deleted successfully",
        data: result
      });
    } catch (err) {
      console.error("Error deleting hall:", err);
      res.status(500).send({ error: err.message });
    }
  }
}

module.exports = HallController;
