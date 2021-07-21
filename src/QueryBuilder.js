const Query = require("./Query");
const Validator = require("./Validator");
const BabyOrmError = require("./Error");

class queryBuilder {
  /**
   * Constructor
   * No parameter, just to initialize our object
   */
  constructor() {
    this.objectQuery = {
      select: [],
      from: null,
      join: [],
      where: "",
      limit: { nb: null, offset: null },
      group: null,
      order: [],
    };
    this.params = [];
  }

  /**
   * Add select part in the query
   * Parameter can be a string of field(s) or you can pass an array
   * @param {Array, String} fields required : fields in array or a string
   * @param {String} as optionnal : name you want to get
   * @returns {Object} this class
   */
  select(fields, as = null) {
    // If fields are in an array, we join all columns in a string
    if (Array.isArray(fields)) {
      if (fields.length > 0) {
        // Concat fields only if fields array is not empty
        this.objectQuery.select = this.objectQuery.select.concat(fields);
      }
      return this;
    }

    // If alternative name of field, add it to the field
    if (as !== null) {
      fields += ` AS ${as}`;
    }

    // Push new value in select array
    this.objectQuery.select.push(fields);
    return this;
  }

  /**
   * Add from part in th e query
   * @param {String} table table name
   * @param {String} alias optionnal : the alternative name for the table
   * @returns {Object} this class
   */
  from(table, alias = null) {
    this.objectQuery.from = `${table}`;

    // If alias exist, add it in the
    if (alias !== null && alias.length > 0) {
      this.objectQuery.from += ` AS ${alias}`;
    }

    return this;
  }

  /**
   * Add inner join part in the query
   * @param {String} table table name for join part
   * @param {String} alias alias for the name of the table
   * @param {String} condition condition for joining tables
   * @returns {Object} this class
   */
  join(table, alias, condition) {
    this.objectQuery.join.push({
      type: "INNER",
      table: table,
      alias: alias,
      condition: condition,
    });
    return this;
  }

  /**
   * Add left join part in the query
   * @param {String} table table name for join part
   * @param {String} alias alias for the name of the table
   * @param {String} condition condition for joining tables
   * @returns {Object} this class
   */
  leftJoin(table, alias, condition) {
    this.objectQuery.join.push({
      type: "LEFT",
      table: table,
      alias: alias,
      condition: condition,
    });
    return this;
  }

  /**
   * Add a condition in the WHERE part
   * @param {String} condition condition for the where
   * @returns {Object} this class
   */
  where(condition) {
    // If not null or empty ?
    if (this.objectQuery.where !== null && this.objectQuery.where.length > 0) {
      this.objectQuery.where += ` AND `;
    }

    // Complete where condition
    this.objectQuery.where += ` (${condition}) `;
    return this;
  }

  /**
   * Add a condition in the WHERE part
   * @param {String} field impacted field for the where
   * @param {Mixed} value value for the where
   * @returns {Object} this class
   */
  where(field, value) {
    // If not null or empty ?
    if (this.objectQuery.where !== null && this.objectQuery.where.length > 0) {
      this.objectQuery.where += ` AND `;
    }

    // Complete where condition and add param in object
    this.objectQuery.where += ` (${field} = $${this.params.length}) `;
    this.params.push(value);

    return this;
  }

  /**
   * Add a condition in the WHERE part
   * @param {String} field impacted field for the where
   * @param {String} sign particular sign for the where
   * @param {Mixed} value value for the where
   * @returns {Object} this class
   */
  where(field, sign, value) {
    // If not null or empty ?
    if (this.objectQuery.where !== null && this.objectQuery.where.length > 0) {
      this.objectQuery.where += ` AND `;
    }

    // Complete where condition and params array
    this.objectQuery.where += ` (${field} ${sign} $${this.params.length}) `;
    this.params.push(value);

    return this;
  }

  /**
   * Add a condition in WHERE part with OR (if where part not empty)
   * @param {String} condition condition for the where
   * @returns {Object} this class
   */
  orWhere(condition) {
    // If not null or empty ?
    if (this.objectQuery.where !== null && this.objectQuery.where.length > 0) {
      this.objectQuery.where += ` OR `;
    }

    this.objectQuery.where += ` (${condition}) `;
    return this;
  }

  /**
   * Add a condition in the WHERE part
   * @param {String} field impacted field for the where
   * @param {Mixed} value value for the where
   * @returns {Object} this class
   */
  orWhere(field, value) {
    // If not null or empty ?
    if (this.objectQuery.where !== null && this.objectQuery.where.length > 0) {
      this.objectQuery.where += ` OR `;
    }

    // Complete where condition
    this.objectQuery.where += ` (${field} = $${this.params.length}) `;
    this.params.push(value);

    return this;
  }

  /**
   * Add a condition in the WHERE part
   * @param {String} field impacted field for the where
   * @param {String} sign particular sign for the where
   * @param {Mixed} value value for the where
   * @returns {Object} this class
   */
  orWhere(field, sign, value) {
    // If not null or empty ?
    if (this.objectQuery.where !== null && this.objectQuery.where.length > 0) {
      this.objectQuery.where += ` OR `;
    }

    // Complete where condition
    this.objectQuery.where += ` (${field} ${sign} $${this.params.length}) `;
    this.params.push(value);

    return this;
  }

  /**
   * Add a WHERE X IS NULL condition in the query
   * @param {String} field condition for this where
   * @returns {Object} this class
   */
  whereNull(field) {
    // If not null or empty ?
    if (this.objectQuery.where !== null && this.objectQuery.where.length > 0) {
      this.objectQuery.where += ` AND `;
    }

    // Complete where condition
    this.objectQuery.where += ` (${field} IS NULL) `;
    return this;
  }

  /**
   * Add a WHERE X IS NOT NULL condition to the query
   * @param {String} field condition for this where
   * @returns {Object} this class
   */
  whereNotNull(field) {
    // If not null or empty ?
    if (this.objectQuery.where !== null && this.objectQuery.where.length > 0) {
      this.objectQuery.where += ` AND `;
    }

    // Complete where condition
    this.objectQuery.where += ` (${field} IS NOT NULL) `;
    return this;
  }

  /**
   * Add limit condition in the query
   * @param {Integer} nb number of results
   * @param {Integer, Null} offset optionnal : offset or null
   * @returns {Object} this class
   */
  limit(nb, offset = null) {
    this.objectQuery.limit.nb = nb;

    // If there is an offset, set offset to the correct value
    if (offset !== null) {
      return this.offset(offset);
    }

    return this;
  }

  /**
   * Add offset condition in the query
   * @param {Integer} nb Offset
   * @returns {Object} this class
   */
  offset(nb) {
    // If no limit = error
    if (this.objectQuery.limit === null) {
      throw new BabyOrmError(`QueryBuilderError`, `Can not set OFFSET if there is no LIMIT`);
    }

    this.objectQuery.limit.offset = nb;
    return this;
  }

  /**
   * Add group by conditions to the query
   * @param {String} fields Fields you want to group by
   * @returns {Object} this class
   */
  groupBy(condition) {
    // Add coma if groupBy is not empty
    if (Validator.empty(this.objectQuery.group) === false) {
      this.objectQuery.group += `, `;
    }

    this.objectQuery.group += condition;
    return this;
  }

  /**
   * Add the order by condition in the query
   * @param {String} field Field you want to order by
   * @param {String} direction ASC or DESC, default ASC
   * @returns {Object} this class
   */
  orderBy(field, direction = "ASC") {
    this.objectQuery.order.push({
      field: field,
      direction: direction,
    });
    return this;
  }

  /**
   * Add an ORDER BY in raw mode
   * @param {String} string Condition raw for the order by
   * @returns {Object} this class
   */
  orderByRaw(string) {
    this.objectQuery.order.push({
      field: string,
      direction: "",
    });
    return this;
  }

  /**
   * Make the complete SQL query
   * @returns {String} complete query string
   */
  getQuery() {
    // Create SELECT part of the query
    let query = `SELECT ` + (this.objectQuery.select.length > 0 ? this.objectQuery.select.join(",") : `*`);

    // Make FROM part of the query
    if (Validator.empty(this.objectQuery.from)) {
      throw new BabyOrmError(`QueryBuilderError`, `You must provide a FROM part to execute the query`);
    }
    query += ` FROM ${this.objectQuery.from} `;

    // If joins, make JOIN part of the query
    if (this.objectQuery.join.length > 0) {
      for (let i in this.objectQuery.join) {
        query += ` ${this.objectQuery.join[i].type} JOIN ${this.objectQuery.join[i].table} ${this.objectQuery.join[i].alias} ON ${this.objectQuery.join[i].condition} `;
      }
    }

    // Make WHERE part of the query if needed
    if (this.objectQuery.where !== null && this.objectQuery.where.length > 0) {
      query += ` WHERE ${this.objectQuery.where} `;
    }

    // Make GROUP BY part of the query if needed
    if (this.objectQuery.group !== null) {
      query += ` GROUP BY ${this.objectQuery.group} `;
    }

    // Make ORDER BY part of the query if needed
    if (this.objectQuery.order.length > 0) {
      query += ` ORDER BY `;
      for (let i in this.objectQuery.order) {
        query += ` ${this.objectQuery.order[i].field} ${this.objectQuery.order[i].direction} `;
        if (i < this.objectQuery.order.length - 1) {
          query += `, `;
        }
      }
    }

    // Make LIMIT part of the query if needed
    if (this.objectQuery.limit.nb !== null) {
      query += ` LIMIT ${this.objectQuery.limit.nb} `;
      if (this.objectQuery.limit.offset !== null) {
        query += ` OFFSET ${this.objectQuery.limit.offset} `;
      }
    }

    // Query is complete, return it
    return query;
  }

  /**
   * Add parameter before running the query
   * @param {Array,String} params Parameter for the query
   * @returns {Object} this class
   */
  addParams(params) {
    if (!Array.isArray(params)) {
      params = [params];
    }
    this.params = this.params.concat(params);
    return this;
  }

  /**
   * Set or replace parameters before running the query
   * @param {Array} params Parameter for the query
   * @returns {Object} this class
   */
  setParams(params) {
    this.params = params;
    return this;
  }

  /**
   * Get parameters before running the query
   * @returns {Array} parameters
   */
  getParams() {
    return this.params;
  }

  /**
   * Retrieve the object of the model with
   * @param {String} modelName Model name
   * @returns {Object} the model object
   */
  getModel(modelName) {
    // todo : create the method
    return [];
  }

  /**
   * Execute query after building
   * @param {Function} callback Callback function to execute
   * @returns {Promise}
   */
  execute(callback) {
    // Initialize the Query
    let q = new Query(this.getQuery());

    // If parameters, add them to the query
    if (Array.isArray(this.params) && this.params.length > 0) {
      q.setParams(this.params);
    }

    // Execute query then execute the callback
    return q.execute(callback);
  }

  /**
   * Execute query and return Promise
   * @returns {Promise}
   */
  execute() {
    // Initialize the Query
    let q = new Query(this.getQuery());

    // If parameters, add them to the query
    if (Array.isArray(this.params) && this.params.length > 0) {
      q.setParams(this.params);
    }

    // Create Promise for the execution
    return new Promise((resolve, reject) => {
      q.execute()
        .then((result) => {
          resolve(result);
        })
        .catch((e) => {
          console.error(e);
          reject(e);
        });
    });
  }

  getValue() {
    this.objectQuery.limit = { nb: 1, offset: 0 };
    let q = new Query(this.getQuery());

    if (this.params.length > 0) {
      q.setParams(this.params);
    }

    return new Promise((resolve, reject) => {
      q.execute()
        .then((result) => {
          if (result.rowCount !== 1) {
            resolve(null);
          }
          let row = result.rows[0];
          resolve(row[Object.keys(row)[0]]);
        })
        .catch((e) => {
          console.error(e);
          reject(e);
        });
    });
  }
  getRow() {
    this.objectQuery.limit = { nb: 1, offset: 0 };
    let q = new Query(this.getQuery());

    if (this.params.length > 0) {
      q.setParams(this.params);
    }

    return new Promise((resolve, reject) => {
      q.execute()
        .then((result) => {
          if (result.rowCount !== 1) {
            resolve(null);
          }
          resolve(result.rows[0]);
        })
        .catch((e) => {
          console.error(e);
          reject(e);
        });
    });
  }
  count(field) {
    if (this.objectQuery.select.length > 0) {
      throw new BabyOrmError(`QueryBuilderError`, "SELECT instruction already present in the query");
    }

    if (typeof field === "undefined" || field.length === 0) {
      field = "*";
    }
    this.objectQuery.select.push(`COUNT(${field}) AS total`);

    let q = new Query(this.getQuery());

    if (this.params.length > 0) {
      q.setParams(this.params);
    }

    return new Promise((resolve, reject) => {
      q.execute()
        .then((result) => {
          if (result.rowCount !== 1) {
            resolve(0);
          }
          let row = result.rows[0];
          resolve(row.total);
        })
        .catch((e) => {
          console.error(e);
          reject(e);
        });
    });
  }
}

//exports.queryBuilder = queryBuilder;
module.exports = queryBuilder;
