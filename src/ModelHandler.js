const Helpers = require("./Helpers");
const BabyOrmError = require("./Error");

module.exports = {
  /**
   * Constructor
   * @param {Class} target Target class
   * @param {*} args Arguments
   * @returns {Class}
   */
  construct(target, args) {
    return new target(...args);
  },

  /**
   * Defines property if possible
   * @param {Class} target Target class
   * @param {*} key Entry key in properties
   * @param {Class} descriptor Descriptor class
   * @returns {Boolean}
   */
  defineProperty(target, key, descriptor) {
    if (target.config.fillable_fields.includes(key) === false) {
      throw new BabyOrmError(`ModelHandlerError`, `Can not modify field ${key} because it is protected in write !`);
    }
    return true;
  },

  /**
   * Check if Model has a particular field
   * @param {Class} target Target class
   * @param {String} key Name
   * @returns {Boolean}
   */
  has(target, key) {
    if (key[0] === "_") {
      return false;
    }
    return key in target;
  },

  /**
   * Get a property from the Model
   * @param {Class} target Target class
   * @param {String} prop Property
   * @param {Object} receiver Object class
   * @returns {Mixed}
   */
  get(target, prop, receiver) {
    // If property exists in fields list, return its value
    if (typeof target.fields !== "undefined" && typeof target.fields[prop] !== "undefined") {
      return target.getField(prop);
    }

    // Perhaps it is a method get
    const method = "get" + Helpers.ucfirst(prop);
    if (typeof target.methods[method] === "function") {
      return target.methods[method]();
    }

    // No idea, so let do the destiny
    return Reflect.get(...arguments);
  },

  /**
   * Set a particular value to the Model
   * @param {Object} target Target Class
   * @param {String} prop Property name
   * @param {*} value Value of the property
   * @returns {*}
   */
  set(target, prop, value) {
    if (target.config.fillable_fields.includes(prop) === false) {
      throw new BabyOrmError(`ModelHandlerError`, `Can not modify field ${prop} because it is not fillable !`);
    } else {
      return Reflect.set(...arguments);
    }
  },

  /**
   * Execute method on the Model
   * @param {Object} target Target class
   * @param {String} thisArg Method name
   * @param {Array} argumentsList Method's list
   * @returns {*}
   */
  apply: function (target, thisArg, argumentsList) {
    if (typeof target.methods[thisArg] !== "function") {
      throw new BabyOrmError(`ModelHandlerError`, `Method ${thisArg} seems not exist for model`);
    }
    return target[thisArg](...argumentsList);
  },
};
