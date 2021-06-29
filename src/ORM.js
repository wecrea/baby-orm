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
      let validResult = Validator.execute(
        object,
        this.currentModel.config.validations
      );
      if (validResult === false) {
        // We have errors, store them and return false to the parent
        this.errors = Validator.getErrors();
        reject(false);
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
      if (
        this.currentModel.config.use_autoincrement === false &&
        "id" in this.currentModel.fields
      ) {
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
      query += ` (${fields.join(",")}) VALUES (${values.join(
        ","
      )}) RETURNING id`;

      async.waterfall(
        [
          function (cb) {
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
          function (result, cb) {
            // Retrieve new object in DB
            let Q = new Query(
              `SELECT * FROM ${this.currentModel.config.table} WHERE id = $1 LIMIT 1`,
              result
            );
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
        function (err, data) {
          if (err) {
            // Error part
            this.errors.push(err.toString());
            reject(err);
          }

          // Fill result in an object form the model fields
          let result = this.currentModel.fill(data);

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
          let res = this.currentModel.fill(result.rows[0]);
          resolve(res);
        })
        .catch((e) => {
          // Error, please log me somewhere ^^
          reject(e);
        });
    });
  }
  find(data) {
    let query = `SELECT * FROM ${this.currentModel.config.table} `;
    let params = [];
    if (data) {
      query += ` WHERE `;
      for (let key in data) {
        query += ` ${key} = $` + (params.length + 1);
        params.push(data[key]);
      }
    }
    query += ` LIMIT 1`;
    return new Promise((resolve, reject) => {
      let Q = new Query(query, params);
      Q.execute()
        .then((result) => {
          let res = this.currentModel.fill(result.rows[0]);
          resolve(res);
        })
        .catch((e) => {
          // Error, please log me somewhere ^^
          reject(e);
        });
    });
  }
  findAll(data) {
    let query = `SELECT * FROM ${this.currentModel.config.table} `;
    let params = [];
    if (data) {
      query += ` WHERE `;
      for (let key in data) {
        query += ` ${key} = $` + (params.length + 1);
        params.push(data[key]);
      }
    }
    return new Promise((resolve, reject) => {
      let Q = new Query(query, params);
      Q.execute()
        .then((result) => {
          let res = this.currentModel.fill(result.rows);
          resolve(res);
        })
        .catch((e) => {
          // Error, please log me somewhere ^^
          reject(e);
        });
    });
  }
  update(id, data) {
    return new Promise((resolve, reject) => {
      this.findById(id).then((result) => {
        let finalObject = this.currentModel.fill(data);

        // Valid result with Model Validations
        let validResult = Validator.execute(
          finalObject,
          this.currentModel.config.validations
        );
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
      let validResult = Validator.execute(
        finalObject,
        this.currentModel.config.validations
      );
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
      let validResult = Validator.execute(
        finalObject,
        this.currentModel.config.validations
      );
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
      return this.update(id, {
        deleted_at: "NOW()",
      });
    }
    let query = `DELETE FROM ${this.currentModel.config.table} WHERE id = $1 `;
    let params = [id];

    return new Promise((resolve, reject) => {
      let Q = new Query(query, params);
      Q.execute()
        .then((result) => {
          resolve(result);
        })
        .catch((e) => {
          reject(e);
        });
    });
  }
  save() {
    // todo : save current object with update if exists id, create otherwise
    throw new BabyOrmError(
      `OrmError`,
      `Method not implemented for the moment, sorry !`
    );
  }
  async load(relation_name) {
    if (this.currentModel.config.relations.includes(relation_name) === false) {
      throw new BabyOrmError(
        `OrmError`,
        `Can not find relation ${relation_name} for model ${this.currentModel.config.file}`
      );
    }

    let relation = this.currentModel.config.relations[relation_name];
    let relationModel = new Model(relation.name);

    // todo : load relation
    try {
      let Q = new Query(
        `SELECT * FROM ${relationModel.config.table} WHERE ${relation.distant_field} = $1`,
        [this.currentModel.fields[relation.local_field]]
      );
      let result = await Q.execute();
      return Validator.emptyOrNull(result) ? {} : relationModel.fill(result);
    } catch (err) {
      throw new BabyOrmError(
        `OrmError`,
        `Can not load relation ${relation_name} for model ${this.currentModel.config.file}`
      );
    }
  }
}

module.exports = new ORM();
