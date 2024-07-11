const con = require('../connection');
const fs = require('fs');
const path = require('path');

class DocumentsController {
    static getdocuments(id) {
        con.query("SELECT * FROM document WHERE id = ?",[id], (err, result) => {
            console.log(result);
            console.log(err);
            if (err) {
              return  { 
                success:false,
                message: err.message };
            } else {
              return  {
                success:true,
                data:result
              }
            }
        });
    }
    static addDocument(file, name) {
        return new Promise((resolve, reject) => {
            // Create the storage directory if it doesn't exist
            const storageDir = path.join(__dirname, 'storage');
            if (!fs.existsSync(storageDir)){
                fs.mkdirSync(storageDir);
            }
    
            // Generate a unique filename
            const uniqueFilename = `${Date.now()}-${file.originalname}`;
            const filePath = path.join(storageDir, uniqueFilename);
    
            // Save the file to the storage directory
            fs.writeFile(filePath, file.buffer, (err) => {
                if (err) {
                    return reject({
                        success: false,
                        message: err.message
                    });
                }
    
                // Prepare data for the database insertion
                const data = {
                    name: name,
                    path: filePath,
                    date: new Date(),
                };
    
                // Insert into the database
                con.query("INSERT INTO document SET ?", data, (err, result) => {
                    if (err) {
                        return reject({
                            success: false,
                            message: err.message,
                        });
                    } else {
                        return  resolve({
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
    
    

    static updateDocument(id, file, name) {
        // Start with the base query
        let query = "UPDATE document SET name = ?, path = ?, date = ? WHERE id = ?";
      
        return new Promise((resolve, reject) => {
            // Create the storage directory if it doesn't exist
            const storageDir = path.join(__dirname, 'storage');
            if (!fs.existsSync(storageDir)) {
                fs.mkdirSync(storageDir);
            }
    
            // Generate a unique filename
            const uniqueFilename = `${Date.now()}-${file.originalname}`;
            const filePath = path.join(storageDir, uniqueFilename);
    
            // Save the file to the storage directory
            fs.writeFile(filePath, file.buffer, (err) => {
                if (err) {
                    return reject({
                        success: false,
                        message: err.message
                    });
                }
    
                // First, retrieve the existing file path from the database
                con.query("SELECT path FROM document WHERE id = ?", [id], (err, result) => {
                    if (err) {
                        return reject({
                            success: false,
                            message: err.message,
                        });
                    }
    
                    if (result.length > 0) {
                        const existingFilePath = result[0].path;
    
                        // Delete the existing file from the file system
                        fs.unlink(existingFilePath, (err) => {
                            if (err) {
                                console.warn(`Failed to delete existing file: ${existingFilePath}`);
                            }
    
                            // Prepare data for the database update
                            const data = {
                                name: name,
                                path: filePath,
                                date: new Date(),
                            };
    
                            // Update the database
                            con.query(query, [data.name, data.path, data.date, id], (err, result) => {
                                if (err) {
                                    return reject({
                                        success: false,
                                        message: err.message,
                                    });
                                } else {
                                    return  resolve({
                                        success: true,
                                        data: {
                                            docid: id, // Assuming id remains the same
                                        },
                                    });
                                }
                            });
                        });
                    } else {
                        reject({
                            success: false,
                            message: "No document found with the given ID"
                        });
                    }
                });
            });
        });
    }
    

    static deleteDocument(req, res) {
        const document_id = req.params.id;
        con.query("DELETE FROM document WHERE id = ?", [document_id], (err, result) => {
            if (err) {
                res.status(500).send({ error: err.message });
            } else {
                res.send(result);
            }
        });
    }
}

module.exports = DocumentsController;
