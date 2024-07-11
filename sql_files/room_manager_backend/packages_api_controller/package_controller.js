const con = require('../connection');

class PackageController {
    static getAllPackages(req, res) {
        con.query("SELECT * FROM package", (err, result) => {
            if (err) {
                res.status(500).send({ error: err.message });
            } else {
                res.send(result);
            }
        });
    }

    static addPackage(req, res) {
        const data = req.body;
        con.query("INSERT INTO package SET ?", data, (err, result) => {
            if (err) {
                res.status(500).send({ error: err.message });
            } else {
                res.send(result);
            }
        });
    }

    static updatePackage(req, res) {
        // Start with the base query
        let query = "UPDATE package SET ";
        const data = [];
        const fields = [];
    
        // Check which fields are provided and add them to the query
        if (req.body.name) {
            fields.push("name = ?");
            data.push(req.body.name);
        }
        if (req.body.price) {
            fields.push("price = ?");
            data.push(req.body.price);
        }
        if (req.body.duration) {
            fields.push("duration = ?");
            data.push(req.body.duration);
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
    

    static deletePackage(req, res) {
        const package_id = req.params.id;
        con.query("DELETE FROM package WHERE id = ?", [package_id], (err, result) => {
            if (err) {
                res.status(500).send({ error: err.message });
            } else {
                res.send(result);
            }
        });
    }
}

module.exports = PackageController;
