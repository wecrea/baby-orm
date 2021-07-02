const async = require("async");
const Model = require("./Model");
const Query = require("./Query");
const Validator = require("./Validator");
const BabyOrmError = require("./Error");
const Helpers = require("./Helpers");

class ORM {
  /**
   * Constructor
   */
  constructor() {
    this.currentModel = null;
    this.errors = [];
    this.autoFillableFields = ["id", "created_at", "updated_at", "deleted_at"];
  }

  /**
   * Load model from ORM
   * @param {String} name Model name
   * @returns {Object} this class
   */
  model(name) {
    this.currentModel = new Model(name);
    return this;
  }

  /**
   * Get Object from the model
   * @returns {Object}
   */
  get() {
    return this.currentModel.getObject();
  }

  /**
   * Get the value of a field
   * @param {String} name Field name
   * @returns {*}
   */
  getField(name) {
    return this.currentModel.getField(name);
  }

  /**
   * Get list of errors from the model
   * @returns {Array}
   */
  getErrors() {
    return this.errors;
  }

  /**
   * Create a new entity from a specific model
   * @param {Object} data Data of the model fields
   * @returns {Object}
   */
  create(data) {
    // Create query and execute it before return the complete Object
    return new Promise((resolve, reject) => {
      // fill new object model with data
      let object = this.currentModel.fill(data);

      // Valid result with Model Validations
      let validResult = Validator.execute(object, this.currentModel.config.validations);
      if (validResult === false) {
        // We have errors, store them and return false to the parent
        this.errors = Validator.getErrors();
        reject(false);
        return false;
      }

      // Initialize INSERT query string
      let query = `INSERT INTO ${this.currentModel.config.table} `;
      let fields = [],
        values = [],
        params = [],
        i = 1;

      // for each field, created an entry
      for (let field in object) {
        // Field is fillable ?
        if (this.autoFillableFields.includes(field)) {
          continue;
        }

        fields.push(field);
        values.push("$" + i++);
        params.push(object[field]);
      }

      // Special cases :-)

      // Manage id field : auto-increment or generated ?
      if (this.currentModel.config.use_autoincrement === false && this.currentModel.fields.id !== undefined) {
        fields.push("id");
        values.push("$" + i++);
        params.push(Helpers.uniqid());
      }

      // use auto fillable timestamps fields ?
      if (this.currentModel.config.timestamps === true) {
        fields.push("created_at");
        values.push("$" + i++);
        params.push("NOW()");
      }

      // Make the query with all field and values (returning ID to load Object after)
      query += ` (${fields.join(",")}) VALUES (${values.join(",")}) RETURNING id`;

      async.waterfall(
        [
          (cb) => {
            // Execute INSERT query to create entry in DB
            let Q = new Query(query);
            if (params.length > 0) {
              Q.setParams(params);
            }
            Q.execute()
              .then((result) => {
                // If OK, then call next method to retrieve all object
                cb(null, result.rows[0].id);
              })
              .catch((e) => {
                // Error, please log me somewhere ^^
                cb(e);
              });
          },
          (result, cb) => {
            // Retrieve new object in DB
            let Q = new Query(`SELECT * FROM ${this.currentModel.config.table} WHERE id = $1 LIMIT 1`, [result]);
            Q.execute()
              .then((result) => {
                // OK, we get the row and go to the callback
                cb(null, result.rows[0]);
              })
              .catch((e) => {
                // Error, please log me somewhere ^^
                cb(e);
              });
          },
        ],
        (err, data) => {
          if (err) {
            // Error part
            this.errors.push(err.toString());
            reject(err);
            return false;
          }

          // Fill result in an object form the model fields
          let result = this.currentModel.complete(data);

          // Return it to the caller
          resolve(result);
        }
      );
    });
  }
  findById(id) {
    let query = `SELECT * FROM ${this.currentModel.config.table} WHERE id = $1 LIMIT 1`;
    return new Promise((resolve, reject) => {
      let Q = new Query(query, [id]);
      Q.execute()
        .then((result) => {
          let res = this.currentModel.complete(result.rows[0]);
          resolve(res);
        })
        .catch((e) => {
          // Error, please log me somewhere ^^
          reject(e);
        });
    });
  }
  findOne(where, order_by = []) {
    let query = `SELECT * FROM ${this.currentModel.config.table} `;
    let params = [],
      i = 1;
    if (typeof where !== "undefined" && where.length > 0) {
      query += ` WHERE `;
      if (typeof where === "string") {
        query += ` ${where} `;
      } else {
        for (let field_w in where) {
          if (field_w > 0) {
            query += ` AND `;
          }
          if (where[field_w].length === 1) {
            query += ` ${where[field_w]} `;
          }
          if (where[field_w].length === 2) {
            query += ` ${where[field_w][0]} = $${i++} `;
            params.push(where[field_w][1]);
          }
          if (where[field_w].length === 3) {
            query += ` ${where[field_w][0]} ${where[field_w][1]} $${i++} `;
            params.push(where[field_w][1]);
          }
        }
      }
    }

    if (order_by.length > 0) {
      query += ` ORDER BY ${order_by[0]} ${order_by[1]} `;
    }

    query += ` LIMIT 1`;
    return new Promise((resolve, reject) => {
      let Q = new Query(query, params);
      Q.execute()
        .then((result) => {
          let res = this.currentModel.complete(result.rows[0]);
          resolve(res);
        })
        .catch((e) => {
          // Error, please log me somewhere ^^
          reject(e);
        });
    });
  }
  findMany(where, order_by = []) {
    let query = `SELECT * FROM ${this.currentModel.config.table} `;
    let params = [],
      i = 1;
    if (typeof where !== "undefined" && where.length > 0) {
      query += ` WHERE `;
      if (typeof where === "string") {
        query += ` ${where} `;
      } else {
        for (let field_w in where) {
          if (field_w > 0) {
            query += ` AND `;
          }
          if (where[field_w].length === 1) {
            query += ` ${where[field_w]} `;
          }
          if (where[field_w].length === 2) {
            query += ` ${where[field_w][0]} = $${i++} `;
            params.push(where[field_w][1]);
          }
          if (where[field_w].length === 3) {
            query += ` ${where[field_w][0]} ${where[field_w][1]} $${i++} `;
            params.push(where[field_w][1]);
          }
        }
      }
    }

    if (order_by.length > 0) {
      query += ` ORDER BY ${order_by[0]} ${order_by[1]} `;
    }

    return new Promise((resolve, reject) => {
      let Q = new Query(query, params);
      Q.execute()
        .then((result) => {
          let finalArray = [];
          for (let row of result.rows) {
            let obj = this.currentModel.complete(row);
            finalArray.push({ ...obj });
          }
          resolve(finalArray);
        })
        .catch((e) => {
          // Error, please log me somewhere ^^
          reject(e);
        });
    });
  }
  findManyPaginate(where, page = 1, limit = 25, order_by = []) {
    let query = `SELECT * FROM ${this.currentModel.config.table} `;
    let params = [],
      i = 1;
    if (typeof where !== "undefined" && where.length > 0) {
      query += ` WHERE `;
      if (typeof where === "string") {
        query += ` ${where} `;
      } else {
        for (let field_w in where) {
          if (field_w > 0) {
            query += ` AND `;
          }
          if (where[field_w].length === 1) {
            query += ` ${where[field_w]} `;
          }
          if (where[field_w].length === 2) {
            query += ` ${where[field_w][0]} = $${i++} `;
            params.push(where[field_w][1]);
          }
          if (where[field_w].length === 3) {
            query += ` ${where[field_w][0]} ${where[field_w][1]} $${i++} `;
            params.push(where[field_w][1]);
          }
        }
      }
    }

    let query_total = query.replace("SELECT *", "SELECT COUNT(*) AS total");

    // Order by
    if (order_by.length > 0) {
      query += ` ORDER BY ${order_by[0]} ${order_by[1]} `;
    }

    // Limit for pagination
    let offset = (page > 0 ? page - 1 : 0) * limit;
    query += ` LIMIT ${limit} OFFSET ${offset}`;

    console.log(query);
    console.log(query_total);

    return new Promise(async (resolve, reject) => {
      try {
        let Q_total = new Query(query_total, params);
        let result_total = await Q_total.execute();
        let total = parseInt(result_total.rows[0].total);
        let resultFinal = {
          total: total,
          nb_page: Math.ceil(total / parseInt(limit)),
          current_page: page,
          nb_per_page: limit,
          data: [],
        };

        let Q = new Query(query, params);
        Q.execute()
          .then((result) => {
            let finalArray = [];
            for (let row of result.rows) {
              let obj = this.currentModel.complete(row);
              finalArray.push({ ...obj });
            }
            resultFinal.data = finalArray;
            resolve(resultFinal);
          })
          .catch((e) => {
            // Error, please log me somewhere ^^
            reject(e);
          });
      } catch (err) {
        reject(err);
      }
    });
  }
  update(id, data, force = false) {
    return new Promise((resolve, reject) => {
      this.findById(id).then((result) => {
        let finalObject = this.currentModel.fill(data);

        // Valid result with Model Validations
        let validResult = Validator.execute(finalObject, this.currentModel.config.validations);
        if (validResult === false) {
          // We have errors, store them and return false to the parent
          this.errors = Validator.getErrors();
          reject(false);
        }

        let query = `UPDATE ${this.currentModel.config.table} SET `;
        let params = [],
          i = 1;
        for (let field in data) {
          if (this.autoFillableFields.includes(field) && force === false) {
            continue;
          }

          query += ` ${field} = $${i++}, `;
          params.push(data[field]);
        }
        if (this.currentModel.config.timestamps === true) {
          query += ` updated_at = $${i++}, `;
          params.push("NOW()");
        }
        query = query.slice(0, -2) + ` WHERE id = $${i}`;
        params.push(id);

        let Q = new Query(query, params);
        Q.execute()
          .then((result) => {
            resolve(finalObject);
          })
          .catch((e) => {
            reject(e);
          });
      });
    });
  }
  updateWhere(data, where) {
    return new Promise((resolve, reject) => {
      let finalObject = this.currentModel.fill(data);

      // Valid result with Model Validations
      let validResult = Validator.execute(finalObject, this.currentModel.config.validations);
      if (validResult === false) {
        // We have errors, store them and return false to the parent
        this.errors = Validator.getErrors();
        reject(false);
      }

      let query = `UPDATE ${this.currentModel.config.table} SET `;
      let params = [],
        i = 1;
      for (let field in data) {
        if (this.autoFillableFields.includes(field)) {
          continue;
        }

        query += ` ${field} = $${i++}, `;
        params.push(data[field]);
      }
      if (this.currentModel.config.timestamps === true) {
        query += ` updated_at = $${i++}, `;
        params.push("NOW()");
      }

      // delete last space and coma
      query = query.slice(0, -2) + ` WHERE ${where}`;

      for (let field_w in where) {
        if (field_w > 0) {
          query += ` AND `;
        }
        if (where[field_w].length === 1) {
          query += ` ${where[field_w]} `;
        }
        if (where[field_w].length === 2) {
          query += ` ${where[field_w][0]} = $${i++} `;
          params.push(where[field_w][1]);
        }
        if (where[field_w].length === 3) {
          query += ` ${where[field_w][0]} ${where[field_w][1]} $${i++} `;
          params.push(where[field_w][1]);
        }
      }

      let Q = new Query(query, params);
      Q.execute()
        .then((result) => {
          resolve(finalObject);
        })
        .catch((e) => {
          reject(e);
        });
    });
  }
  upsert(data, conflict_field) {
    return new Promise((resolve, reject) => {
      let finalObject = this.currentModel.fill(data);

      // Valid result with Model Validations
      let validResult = Validator.execute(finalObject, this.currentModel.config.validations);
      if (validResult === false) {
        // We have errors, store them and return false to the parent
        this.errors = Validator.getErrors();
        reject(false);
      }

      let query = `INSERT INTO ${this.currentModel.config.table} `;
      let fields = [],
        values = [],
        params = [],
        i = 1;

      // for each field, created an entry
      for (let field in object) {
        // Field is fillable ?
        if (this.autoFillableFields.includes(field)) {
          continue;
        }

        fields.push(field);
        values.push("$" + i++);
        params.push(object[field]);
      }

      // Make the query with all field and values (returning ID to load Object after)
      query += ` (${fields.join(",")}) VALUES (${values.join(",")}) `;
      query += `ON CONFLICT (${conflict_field}) DO UPDATE SET `;

      // Make update part
      for (let j in fields) {
        if (fields[j] === conflict_field) {
          continue;
        }
        query += ` ${fields[j]} = ${values[j]}, `;
      }

      // Remove last coma and space
      query = query.slice(0, -2);

      let Q = new Query(query, params);
      Q.execute()
        .then((result) => {
          resolve(finalObject);
        })
        .catch((e) => {
          reject(e);
        });
    });
  }
  delete(id) {
    if (this.currentModel.config.soft_delete === true) {
      return this.update(
        id,
        {
          deleted_at: "NOW()",
        },
        true
      );
    }
    let query = `DELETE FROM ${this.currentModel.config.table} WHERE id = $1 `;
    let params = [id];

    return new Promise((resolve, reject) => {
      let Q = new Query(query, params);
      Q.execute()
        .then((result) => {
          resolve(result.rowCount);
        })
        .catch((e) => {
          reject(e);
        });
    });
  }
  save() {
    // todo : save current object with update if exists id, create otherwise
    throw new BabyOrmError(`OrmError`, `Method not implemented for the moment, sorry !`);
  }
  async load(relation_name) {
    if (this.currentModel.config.relations.includes(relation_name) === false) {
      throw new BabyOrmError(`OrmError`, `Can not find relation ${relation_name} for model ${this.currentModel.config.file}`);
    }

    let relation = this.currentModel.config.relations[relation_name];
    let relationModel = new Model(relation.name);

    try {
      let Q = new Query(`SELECT * FROM ${relationModel.config.table} WHERE ${relation.distant_field} = $1`, [this.currentModel.fields[relation.local_field]]);
      let result = await Q.execute();
      return Validator.emptyOrNull(result) ? {} : relationModel.complete(result);
    } catch (err) {
      throw new BabyOrmError(`OrmError`, `Can not load relation ${relation_name} for model ${this.currentModel.config.file}`);
    }
  }
}

module.exports = new ORM();
