const { pool } = require("../config/database");

module.exports = {
  pool,
  query: (text, params, callback) => pool.query(text, params, callback),
  connect: (callback) => pool.connect(callback),
};
