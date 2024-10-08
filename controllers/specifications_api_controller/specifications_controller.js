const { log } = require("console");
const con = require("../../connection");
const util = require("util");
class SpecificationController {
  static getAllSpecifications(docSpecId, type) {
    const query = util.promisify(con.query).bind(con);
    return query(
      "SELECT * FROM specification WHERE doc_type_id = ? AND type = ?",
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

  static async addSpecifications(datas, type, doc_type_id) {
    try {
      if (!Array.isArray(datas)) {
        datas = JSON.parse(datas);
      }

      console.log(datas);

      const specificationsPromises = datas.map((data) => {
        return new Promise((resolve, reject) => {
          // Added reject here
          data.type = type;
          data.doc_type_id = doc_type_id;
          con.query("INSERT INTO specification SET ?", data, (err, result) => {
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
      });

      const results = await Promise.all(specificationsPromises);
      return results;
    } catch (error) {
      console.error(error);
      throw error; // Rethrow the error to ensure it's handled by the caller
    }
  }
  static async updateOrAdd(specifications) {
    if (!Array.isArray(specifications)) {
      specifications = JSON.parse(specifications);
    }
    let promises = specifications.map((specification) => {
      if (specification.id) {
        return this.updateSpecification(specification);
      } else {
        return this.addSpecification(specification);
      }
    });

    return Promise.all(promises)
      .then((results) => {
        console.log("All operations completed successfully:", results);
        return { success: true, results: results };
      })
      .catch((error) => {
        console.error("An error occurred:", error);
        return { success: false, error: error.message };
      });
  }

  static updateSpecification(specification) {
    return new Promise((resolve, reject) => {
      let query = "UPDATE specification SET ";

      let fields = [];
      let values = [];
      for (let key in specification) {
        if (key !== "id") {
          fields.push(`${key} = ?`);
          values.push(specification[key]);
        }
      }
      query += fields.join(", ") + " WHERE id = ?";
      values.push(specification.id);

      con.query(query, values, (err, result) => {
        if (err) {
          console.error(err.message);
          reject({ success: false, message: err.message });
        } else {
          console.log(result);
          resolve({ success: true, result: result });
        }
      });
    });
  }

  static addSpecification(specification) {
    return new Promise((resolve, reject) => {
      con.query(
        "INSERT INTO specification SET ?",
        specification,
        (err, result) => {
          if (err) {
            console.error(err.message);
            reject({ success: false, message: err.message });
          } else {
            resolve({
              success: true,
              data: {
                docid: result.insertId,
              },
            });
          }
        }
      );
    });
  }

  static deleteSpecification(req, res) {
    const specification_id = req.params.id;
    con.query(
      "DELETE FROM specification WHERE id = ?",
      [specification_id],
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

module.exports = SpecificationController;
