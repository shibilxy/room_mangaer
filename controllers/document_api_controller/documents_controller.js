const { log } = require("console");
const con = require("../../connection");
const fs = require("fs");
const path = require("path");
const util = require("util");

class DocumentsController {
  static url = "http://localhost:3000/";

  static getDocument(documentId) {
    const query = util.promisify(con.query).bind(con);
    return query("SELECT path FROM document WHERE id = ? ", [documentId])
      .then((result) => (result[0] ? result[0].path : "")) // Return the document URL or an empty string if not found
      .catch((err) => {
        console.error(err);
        throw err;
      });
  }
  static getAllDocument(docSpecId, type) {
    const query = util.promisify(con.query).bind(con);
    return query("SELECT * FROM document WHERE doc_type_id = ? AND type = ?", [
      docSpecId,
      type,
    ])
      .then((result) => {
        console.log(result);
        // Add updated: false to each item
        return result;
      })
      .catch((err) => {
        console.error(err);
        throw err;
      });
  }
  static addDocuments(file, type, doc_type_id) {
    return new Promise((resolve, reject) => {
      const projectDir = path.dirname(require.main.filename);
      const storageDir = path.join(projectDir, "storage");

      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir);
      }

      const uniqueFilename = `${Date.now()}-${file[0].originalname}`;
      const filePath = path.join(storageDir, uniqueFilename);

      const storePath = this.url + "storage/" + uniqueFilename; // Use forward slash

      fs.writeFile(filePath, file[0].buffer, (err) => {
        if (err) {
          return reject({
            success: false,
            message: err.message,
          });
        }

        const data = {
          name: file[0].originalname,
          path: storePath,
          date: new Date(),
          type: type,
          doc_type_id: doc_type_id,
        };

        con.query("INSERT INTO document SET ?", data, (err, result) => {
          if (err) {
            return reject({
              success: false,
              message: err.message,
            });
          } else {
            return resolve({
              success: true,
              data: {
                docid: result.insertId,
              },
            });
          }
        });
      });
    });
  }

  static async addDocumentsWithtype(filesvalues, type, doc_type_id) {
    try {
      const filePromises = filesvalues.map((file) => {
        return this.addDocuments([file], type, doc_type_id);
      });

      const results = await Promise.all(filePromises);
      return results;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
  static processDocuments(documents, type, doc_type_id) {
    return Promise.all(
      documents.map((doc) => {
        console.log(doc.id);
        if (doc.id) {
          return this.updateDocument(doc.id, doc.file, type, doc_type_id);
        } else {
          return this.addDocuments(doc.file, type, doc_type_id);
        }
      })
    );
  }

  static updateDocument(id, file, type, doc_type_id) {
    console.log(id);
    const query =
      "UPDATE document SET name = ?, path = ?, date = ? WHERE id = ?";

    return new Promise((resolve, reject) => {
      const projectDir = path.dirname(require.main.filename);
      const storageDir = path.join(projectDir, "storage");

      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir);
      }

      const uniqueFilename = `${Date.now()}-${file[0].originalname}`;
      const filePath = path.join(storageDir, uniqueFilename);
      const storePath = this.url + "storage/" + uniqueFilename; // Use forward slashes

      fs.writeFile(filePath, file[0].buffer, (err) => {
        if (err) {
          console.log("Error writing file:", err);
          return reject({
            success: false,
            message: err.message,
          });
        }

        con.query(
          "SELECT path FROM document WHERE id = ?",
          [id],
          (err, result) => {
            if (err) {
              return reject({
                success: false,
                message: err.message,
              });
            }

            if (result.length > 0) {
              const existingFilePath = result[0].path.replace(this.url, "");
              const absoluteExistingFilePath = path.join(
                projectDir,
                existingFilePath
              );

              fs.unlink(absoluteExistingFilePath, (err) => {
                if (err) {
                  console.log(
                    `Failed to delete existing file: ${absoluteExistingFilePath}`
                  );
                }
              });
            } else {
              return reject({
                success: false,
                message: "No document found with the given ID",
              });
            }

            console.log("New file stored at:", storePath);

            const data = {
              name: file[0].originalname,
              path: storePath,
              date: new Date(),
              type: type,
              doc_type_id: doc_type_id,
            };

            con.query(
              query,
              [data.name, data.path, data.date, id],
              (err, result) => {
                if (err) {
                  return reject({
                    success: false,
                    message: err.message,
                  });
                } else {
                  return resolve({
                    success: true,
                    data: {
                      docid: id,
                    },
                  });
                }
              }
            );
          }
        );
      });
    });
  }

  static deleteDocument(req, res) {
    const document_id = req.params.id;
    con.query(
      "DELETE FROM document WHERE id = ?",
      [document_id],
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

module.exports = DocumentsController;
