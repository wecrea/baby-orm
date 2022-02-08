const Validator = require("./Validator");
const BabyOrmError = require("./Error");
const { Pool } = require("pg");

class Query {
  /**
   * Constructor of Query class
   * @param {String} queryString Query complete
   * @param {Array, Null} params Parameters of the query
   * @returns {Object} this class
   */
  constructor(queryString, params = null) {
    this.query = queryString;
    this.params = params;

    try {
      const pool = new Pool();
      pool.connect((err, client, done) => {
        if (err) throw err;
        this.client = client;
      });
    } catch (e) {
      console.error(e);
      throw new BabyOrmError("ConnexionError", e);
    }

    return this;
  }

  /**
   * Set the query before execute it
   * @param {String} queryString SQL query
   * @returns {Object} this class
   */
  setQuery(queryString) {
    this.query = queryString;
    return this;
  }

  /**
   * Add paramters for the query
   * @param {Array} params List of parameters
   * @returns {Object} this class
   */
  setParams(params) {
    this.params = params;
    return this;
  }

  /**
   * Get current query string
   * @returns {String} current query
   */
  getQuery() {
    return this.query;
  }

  /**
   * Get all current parameters
   * @returns {Array} List of parameters
   */
  getParams() {
    return this.params;
  }

  /**
   * Construct and get SQL query with all parameters inside
   * @returns {String} the complete query with params inside
   */
  showSQL() {
    // Init our query
    let sql = this.query;

    // If there is paramters
    if (typeof this.params === "object" && this.params !== null && this.params.length > 0) {
      // For each parameter, repalace $x with the good parameter
      for (let i in this.params) {
        sql = sql.replace("$" + (parseInt(i) + 1), this.params[i]);
      }
    }

    // Returning the string query
    return sql;
  }

  /**
   * Execute query and get result
   * @returns {Promise} Query result by a Promise
   */
  execute() {
    // Error if there is no current query
    if (Validator.emptyOrNull(this.query)) {
      throw new BabyOrmError("Empty Query", "It seems the SQL query is empty and can not be executed");
    }

    try {
      // Execute without parameters
      if (this.params === null || this.params.length === 0) {
        const result = this.client.query(this.query);
        this.client.release();
        return result;
      }

      // Execute with parameters
      const result = this.client.query(this.query, this.params);
      this.client.release();
      return result;
    } catch (err) {
      this.client.release();
      throw new BabyOrmError("QueryError", err.message);
    }
  }

  async getRow() {
    // Error if there is no current query
    if (Validator.emptyOrNull(this.query)) {
      throw new BabyOrmError("Empty Query", "It seems the SQL query is empty and can not be executed");
    }

    try {
      let result = null;

      if (this.params === null || this.params.length === 0) {
        // Execute without parameters
        result = await this.client.query(this.query);
      } else {
        // Execute with parameters
        result = await this.client.query(this.query, this.params);
      }

      this.client.release();

      // Return only the first row
      return result.rows[0];
    } catch (err) {
      this.client.release();
      throw new BabyOrmError("QueryError", err.message);
    }
  }

  async getValue(name) {
    // Error if there is no current query
    if (Validator.emptyOrNull(this.query)) {
      throw new BabyOrmError("Empty Query", "It seems the SQL query is empty and can not be executed");
    }

    try {
      let result = null;

      if (this.params === null || this.params.length === 0) {
        // Execute without parameters
        result = await this.client.query(this.query);
      } else {
        // Execute with parameters
        result = await this.client.query(this.query, this.params);
      }

      this.client.release();

      // Return only the first row
      return result.rows[0][name];
    } catch (err) {
      this.client.release();
      throw new BabyOrmError("QueryError", err.message);
    }
  }
}

module.exports = Query;
