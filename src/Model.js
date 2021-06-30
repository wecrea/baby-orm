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
    const path = [
      Config.base_path,
      Config.models_dir,
      `${name.toLowerCase()}.model.js`,
    ];

    let file = path.join("/");
    if (fs.existsSync(file) === false) {
      throw new BabyOrmError("ModelError", `File ${file} does not exist`);
    }

    let model = require(file);

    // Initialize config
    this.config = {
      table: model.config.table || name,
      use_autoincrement: model.config.use_autoincrement || true,
      timestamps: model.config.timestamps || true,
      soft_delete: model.config.soft_delete || false,
      fillable_fields: model.config.fillable_fields || null,
      hidden_fields: model.config.hidden_fields || [],
      validations: model.config.validations || {},
      relations: model.config.relations || [],
    };

    // Initialize fields and methods
    this.fields = model.fields;
    this.methods = model.methods || {};

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
    for (const [key, value] of Object.entries(data)) {
      // Only if field is fillable
      if (this.config.fillable_fields.includes(key)) {
        this.fields[key] = value;
      }
    }
    return this.fields;
  }

  complete(data) {
    for (const [key, value] of Object.entries(data)) {
      // Only if field is fillable
      if (this.config.hidden_fields.includes(key)) {
        continue;
      }
      this.fields[key] = value;
    }
    return this.fields;
  }
}

module.exports = Model;
