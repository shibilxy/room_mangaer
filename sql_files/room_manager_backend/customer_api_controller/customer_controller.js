const con = require('../connection');

class CustomersController {
    static getAllCustomers(req, res) {
        con.query("SELECT * FROM customer", (err, result) => {
            if (err) {
                res.status(500).send({ error: err.message });
            } else {
                res.send(result);
            }
        });
    }

    static addCustomers(req, res) {
        const data = req.body;
        if(data.document){
            
        }
        con.query("INSERT INTO customer SET ?", data, (err, result) => {
            if (err) {
                res.status(500).send({ error: err.message });
            } else {
                res.send(result);
            }
        });
    }
    static updateCustomers(req, res) {
        // Start with the base query
        let query = "UPDATE customer SET ";
        const data = [];
        const fields = [];
    
        // Check which fields are provided and add them to the query
        if (req.body.hostel_uid) {
            fields.push("hostel_uid = ?");
            data.push(req.body.hostel_uid);
        }
        if (req.body.user_name) {
            fields.push("user_name = ?");
            data.push(req.body.user_name);
        }
        if (req.body.password) {
            fields.push("password = ?");
            data.push(req.body.password);
        }
        if (req.body.contact_number) {
            fields.push("contact_number = ?");
            data.push(req.body.contact_number);
        }
        if (req.body.alternative_number) {
            fields.push("alternative_number = ?");
            data.push(req.body.alternative_number);
        }
        if (req.body.document) {
            fields.push("document_uid = ?");
            data.push(req.body.document_uid);
        }
        if (req.body.room_uid) {
            fields.push("room_uid = ?");
            data.push(req.body.room_uid);
        }
        if (req.body.building_id) {
            fields.push("building_id = ?");
            data.push(req.body.building_id);
        }
        if (req.body.registration_fees) {
            fields.push("registration_fees = ?");
            data.push(req.body.registration_fees);
        }
        if (req.body.caution_deposit) {
            fields.push("caution_deposit = ?");
            data.push(req.body.caution_deposit);
        }
        if (req.body.paid_amount) {
            fields.push("paid_amount = ?");
            data.push(req.body.paid_amount);
        }
        if (req.body.paid_date) {
            fields.push("paid_date = ?");
            data.push(req.body.paid_date);
        }
        if (req.body.address) {
            fields.push("address = ?");
            data.push(req.body.address);
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
    
    

    static deleteCustomers(req, res) {
        const customer_id = req.params.id;
        con.query("DELETE FROM customer WHERE id = ?", [customer_id], (err, result) => {
            if (err) {
                res.status(500).send({ error: err.message });
            } else {
                res.send(result);
            }
        });
    }
}

module.exports = CustomersController;
