require("dotenv").config();
console.log("DB_HOST from dotenv in script:", process.env.DB_HOST);
const { pool } = require("../config/db");
console.log("Pool Host:", pool.options.host);
console.log("Pool Database:", pool.options.database);
console.log("Pool User:", pool.options.user);
console.log("Pool SSL:", pool.options.ssl);
process.exit(0);
