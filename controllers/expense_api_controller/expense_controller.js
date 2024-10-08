const util = require("util");
const con = require("../../connection");

const DocumentsController = require("../document_api_controller/documents_controller");
class ExpenseController {
  static getExpenseWithType(req, res) {
    // Promisify the query method
    const query = util.promisify(con.query).bind(con);

    query("SELECT * FROM expense where user_id ?",req.params.id)
      .then(async (owners) => {
        // Map through the owners and fetch additional data
        const results = await Promise.all(
          owners.map(async (owner) => {
            const bill_doc = await DocumentsController.getDocument(
              owner.bill_doc_id
            );

            return {
              id: owner.id,
              user_name: owner.user_name,
              buisness_name: owner.buisness_name,
              phone_number: owner.phone_number,
              bill_doc: bill_doc || "", // Ensure URLs default to an empty string if not found
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

  static async addExpense(req, res) {
    const data = req.body;
    const files = req.files; // Assuming files are available in req.files

    try {
      // Add documentFront if present

      // Add documentBack if present
      if (files.bill_doc && files.bill_doc != null) {
        const result = await DocumentsController.addDocuments(
          files.bill_doc,
          null,
          null
        );
        data.bill_doc_id = result.data.docid;
      }

      // console.log(data);

      //   delete data.documentBack;

      // Insert business owner data into the database
      con.query("INSERT INTO expense SET ?", data, (err, result) => {
        if (err) {
          console.log(err);
          res.status(450).send({
            succes: false,
            data: {},
            message: "Expense added failed",
          });
        } else {
          res.status(200).send({
            succes: true,
            data: {},
            message: "Expense added sucessfully",
          });
        }
      });
    } catch (err) {
      console.log(err);
      res.status(500).send({
        succes: false,
        data: {},
        message: "Expense addededdd failed",
      });
    }
  }
  static async updateExpense(req, res) {
    const query = util.promisify(con.query).bind(con);
    try {
      // First, fetch the document IDs and address ID from the database
      const fetchQuery = "SELECT bill_doc_id FROM expense WHERE id = ?";
      const fetchResult = await query(fetchQuery, [req.params.id]);
      console.log(fetchResult.length);
      if (fetchResult.length == 0) {
        return res.status(404).send({ error: "Business owner not found" });
      }
      const bill_doc_id = fetchResult[0].bill_doc_id;

      console.log();
      // Start with the base update query
      let updateQuery = "UPDATE expense SET ";
      const data = [];
      const fields = [];
      const files = req.files;

      // Check which fields are provided and add them to the query

      if (files && files.bill_doc) {
        if (bill_doc_id == null) {
          const result = await DocumentsController.addDocuments(
            files.bill_doc,
            null,
            null
          );
          const bill_do_id = result.data.docid;
          fields.push("bill_doc_id = ?");
          data.push(bill_do_id);
        } else {
          await DocumentsController.updateDocument(
            bill_doc_id,
            files.documentFront,
            null,
            null
          );
        }
      }

      if (req.body.building_id) {
        fields.push("building_id = ?");
        data.push(req.body.building_id);
      }
      if (req.body.floor) {
        fields.push("floor = ?");
        data.push(req.body.floor);
      }
      if (req.body.hall_id) {
        fields.push("hall_id = ?");
        data.push(req.body.hall_id);
      }
      if (req.body.expense_name) {
        fields.push("expense_name = ?");
        data.push(req.body.expense_name);
      }
      if (req.body.amount) {
        fields.push("amount = ?");
        data.push(req.body.amount);
      }
      if (req.body.date) {
        fields.push("date = ?");
        data.push(req.body.date);
      }
      if (req.body.paid) {
        fields.push("paid = ?");
        data.push(req.body.paid);
      }
      if (req.body.user_id) {
        fields.push("user_id = ?");
        data.push(req.body.user_id);
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
      res.send({
        success: true,
        data: {},
        message: "owner updated successfully",
      });
    } catch (err) {
      console.log(err);
      res.status(500).send({ error: err.message });
    }
  }
  static deleteBuisnessOwner(req, res) {
    const expense_id = req.params.id;
    con.query(
      "DELETE FROM expense WHERE id = ?",
      [expense_id],
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

module.exports = ExpenseController;
