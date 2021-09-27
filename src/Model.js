const Config = require("./Config");
const BabyOrmError = require("./Error");
const ModelHandler = require("./ModelHandler");
const fs = require("fs");

class Model {
  /**
   * Constructor of Model
   * @param {String} name Name of the model
   * @returns {Object}
   */
  constructor(name) {
    // create path to load correct file
    const path = [Config.base_path, Config.models_dir, `${name.toLowerCase()}.model.js`];

    let file = path.join("/");
    if (fs.existsSync(file) === false) {
      throw new BabyOrmError("ModelError", `File ${file} does not exist`);
    }

    let model = require(file);

    // Initialize config
    this.config = {
      table: typeof model.config.table !== "undefined" ? model.config.table : name,
      use_autoincrement: typeof model.config.use_autoincrement !== "undefined" ? model.config.use_autoincrement : true,
      timestamps: typeof model.config.timestamps !== "undefined" ? model.config.timestamps : true,
      soft_delete: typeof model.config.soft_delete !== "undefined" ? model.config.soft_delete : false,
      fillable_fields: typeof model.config.fillable_fields !== "undefined" ? model.config.fillable_fields : null,
      hidden_fields: typeof model.config.hidden_fields !== "undefined" ? model.config.hidden_fields : [],
      validations: typeof model.config.validations !== "undefined" ? model.config.validations : {},
      relations: typeof model.config.relations !== "undefined" ? model.config.relations : [],
    };

    // Initialize fields and methods
    this.fields = model.fields;
    this.methods = typeof model.methods !== "undefined" ? model.methods : {};

    // crate proxy to access methods and fields directly
    return new Proxy(this, ModelHandler);
  }

  /**
   * Get Object with fields only
   * @returns {Object}
   */
  getObject() {
    // Copy object in a variable to manipulate it
    let object = this.fields;

    // If we have some hidden fields
    if (this.config.hidden_fields.length > 0) {
      // Delete all hidden fields if exist in obejct
      for (let field_name of this.config.hidden_fields) {
        if (object[field_name] !== undefined) {
          delete object[field_name];
        }
      }
    }

    // return modified object
    return object;
  }

  /**
   * Get field if exist (null otherwise)
   * @param {String} name Field name
   * @returns {*}
   */
  getField(name) {
    return this.fields[name] || null;
  }

  /**
   * Fill object fields with some data
   * @param {Object} data Content to fill
   * @returns {Object}
   */
  fill(data) {
    if (data === undefined || data === null) {
      return this.fields;
    }
    for (const [key, value] of Object.entries(data)) {
      // Only if field is fillable
      if (this.config.fillable_fields.includes(key)) {
        this.fields[key] = value;
      }
    }
    return this.fields;
  }

  /**
   * Complete model with data and hide hidden fields
   * @param {Object} data Content to fill
   * @returns {Object}
   */
  complete(data) {
    if (data === undefined || data === null) {
      return this.fields;
    }
    for (const [key, value] of Object.entries(data)) {
      // Only if field is fillable
      if (this.config.hidden_fields.includes(key)) {
        continue;
      }
      this.fields[key] = value;
    }
    return this.fields;
  }

  /**
   * Get all fields names in an array
   * @returns {Array}
   */
  getFieldNames() {
    return this.config.fields.keys;
  }

  /**
   * Get all relations in an object
   * @returns {Object}
   */
  getRelations() {
    return this.config.relations;
  }
}

module.exports = Model;
