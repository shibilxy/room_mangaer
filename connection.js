const mysql = require('mysql');
const con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123123',
    database: 'hostel_db'
});

module.exports = con;

con.connect((err) => {
    if (err) {
        console.log("Connection not proper");
    } else {
        console.log("connected");
    }
});
