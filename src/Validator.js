const moment = require("moment");
const Query = require("./Query");

class Validator {
  /**
   * Constructor
   * Initialize errors list
   */
  constructor() {
    this.errors = [];
  }

  /**
   * Execute tests on a field's value
   * @param {String} field_name Field's name
   * @param {*} value Value of the field
   * @param {Array} validations List of validations to execute
   * @param {Boolean} make_all_tests False if you want to stop execution (default: true)
   * @returns {Boolean} True if all is OK
   */
  execute(field_name, value, validations, make_all_tests = true) {
    // Loop on all validations tests
    for (let test in validations) {
      // If exists : so we have parameters for the test
      if (test.indexOf(":") > -1) {
        let exp = test.split(":");
        // Execute test on field (name and value) and the parameter
        exp[0](field_name, value, exp[1]);
      } else {
        // No parameter for this case
        // prettier-ignore
        (test)(field_name, value);
      }

      // If stop on first error
      if (make_all_tests === false && this.errors.length > 0) {
        return false;
      }
    }

    // Return true if no error
    return this.errors.length === 0;
  }

  /**
   * Get list of errors (empty array if no error)
   * @returns {Array}
   */
  getErrors() {
    return this.errors;
  }

  /**
   * Check if field required is not empty
   * @param {String} field_name Field name
   * @param {*} value Value of the field
   * @returns {Boolean}
   */
  required(field_name, value) {
    if (this.empty(value) || this.undefined(value)) {
      // Put error in list here because two methods have no error pushment
      this.errors.push(`Field ${field_name} can not be empty or undefined`);
      return false;
    }
    return true;
  }

  /**
   * Check if value is a Number
   * @param {String} field_name Field name
   * @param {*} value Value of the field
   * @returns {Boolean}
   */
  number(field_name, value) {
    if (isNaN(value) === false && this.emptyOrNull(value) === false) {
      this.errors.push(`Field ${field_name} must be a number (received : ${value})`);
      return false;
    }
    return true;
  }

  /**
   * Check if field is a Boolean
   * @param {String} field_name Field name
   * @param {*} value Value of the field
   * @returns {Boolean}
   */
  boolean(field_name, value) {
    if (typeof value !== "boolean" && this.emptyOrNull(value) === false) {
      this.errors.push(`Field ${field_name} must be a boolean (received : ${value})`);
      return false;
    }
    return true;
  }

  /**
   * Check if value is an Integer
   * @param {String} field_name Field name
   * @param {*} value Value of the field
   * @returns {Boolean}
   */
  integer(field_name, value) {
    if (Number.isInteger(value) === false && this.emptyOrNull(value) === false) {
      this.errors.push(`Field ${field_name} must be an integer (received : ${value})`);
      return false;
    }
    return true;
  }

  /**
   * Check if value is a string (not empty)
   * @param {String} field_name Field name
   * @param {*} value Value of the field
   * @returns {Boolean}
   */
  string(field_name, value) {
    // prettier-ignore
    if (typeof value !== "string" && (value instanceof String) === false && this.emptyOrNull(value) === false) {
      this.errors.push(
        `Field ${field_name} must be a string (received : ${value})`
      );
      return false;
    }
    return true;
  }

  /**
   * Check if value is an Object
   * @param {String} field_name Field name
   * @param {*} value Value of the field
   * @returns {Boolean}
   */
  object(field_name, value) {
    // prettier-ignore
    if (typeof value !== "object" && (value instanceof Object) === false && this.emptyOrNull(value) === false) {
      this.errors.push(
        `Field ${field_name} must be an Object (received : ${value})`
      );
      return false;
    }
    return true;
  }

  /**
   * Check if value is a Date
   * @param {String} field_name Field name
   * @param {*} value Value of the field
   * @returns {Boolean}
   */
  date(field_name, value) {
    if (moment(value).isValid() === false && this.emptyOrNull(value) === false) {
      this.errors.push(`Field ${field_name} must be a Date (received : ${value})`);
      return false;
    }
    return true;
  }

  /**
   * Check the minimum length if the field
   * @param {String} field_name Field name
   * @param {*} value Value of the field
   * @param {Number} length Length of the value
   * @returns {Boolean}
   */
  minLength(field_name, value, length) {
    if (value.length < length && this.emptyOrNull(value) === false) {
      this.errors.push(`Length of ${field_name} must be greater or equal than ${length} (actual length : ${value.length})`);
      return false;
    }
    return true;
  }

  /**
   * Check the maximum lentgh of the field
   * @param {String} field_name Field name
   * @param {*} value Value of the field
   * @param {Number} length Length of the value
   * @returns {Boolean}
   */
  maxLength(field_name, value, length) {
    if (value.length > length && this.emptyOrNull(value) === false) {
      this.errors.push(`Length of ${field_name} must be less than or equal to ${length} (actual length : ${value.length})`);
      return false;
    }
    return true;
  }

  /**
   * Check the minimum value of a number
   * @param {String} field_name Field name
   * @param {*} value Value of the field
   * @param {Number} minVal Minimum value
   * @returns {Boolean}
   */
  minValue(field_name, value, minVal) {
    if (value < minVal && this.emptyOrNull(value) === false) {
      this.errors.push(`Field ${field_name} must have a value less than ${minVal} (received : ${value})`);
      return false;
    }
    return true;
  }

  /**
   * Check the maximum value of a number
   * @param {String} field_name Field name
   * @param {*} value Value of the field
   * @param {Number} maxVal Maximum value
   * @returns {Boolean}
   */
  maxValue(field_name, value, maxVal) {
    if (value > maxVal && this.emptyOrNull(value) === false) {
      this.errors.push(`Field ${field_name} must have a value greater than ${maxVal} (received : ${value})`);
      return false;
    }
    return true;
  }

  /**
   * Check if number is between min and max
   * @param {String} field_name Field name
   * @param {*} value Value of the field
   * @param {*} minmax minimum and maximum (format = min,max)
   * @returns {Boolean}
   */
  between(field_name, value, minmax) {
    let { minVal, maxVal } = minmax.split(",");
    if ((value < minVal || value > maxVal) && this.emptyOrNull(value) === false) {
      this.errors.push(`Field ${field_name} must have a value between ${minVal} and ${maxVal} (received : ${value})`);
      return false;
    }
    return true;
  }

  /**
   * Check if value is a UniqId on 14 char
   * @param {String} field_name Field name
   * @param {*} value Value of the field
   * @returns {Boolean}
   */
  uniqid(field_name, value) {
    const UNIQID_REGEX = /^([a-zA-Z0-9]{14})$/;
    if (UNIQID_REGEX.test(value) === false && this.emptyOrNull(value) === false) {
      this.errors.push(`Field ${field_name} must be a UniqId of database (received: ${value})`);
      return false;
    }
    return true;
  }

  /**
   * Check if value a password format on minimum 8 char
   * (1+ lowercase, 1+ uppercase, 1+ number, 1+ special char)
   * @param {String} field_name Field name
   * @param {*} value Value of the field
   * @returns {Boolean}
   */
  password(field_name, value) {
    const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@+?#\$%&\*])(?=.{8,})/;
    if (PASSWORD_REGEX.test(value) === false && this.emptyOrNull(value) === false) {
      this.errors.push(`Field ${field_name} must be a correct password which contains minimum 8 char, 1 lowercase, 1 uppercase, 1 number and 1 special char (in : !@+?#$%&*)`);
      return false;
    }
    return true;
  }

  /**
   * Check if value is a correct email
   * @param {String} field_name Field name
   * @param {*} value Value of the field
   * @returns {Boolean}
   */
  email(field_name, value) {
    const EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (EMAIL_REGEX.test(value) && this.emptyOrNull(value) === false) {
      this.errors.push(`Field ${field_name} must have an email format (received : ${value})`);
      return false;
    }
    return true;
  }

  /**
   * Check if value is a zipcode
   * @param {String} field_name Field name
   * @param {*} value Value of the field
   * @returns {Boolean}
   */
  zipcode(field_name, value) {
    const ZIPCODE_REGEX = /^(([0-8][0-9])|(9[0-5])|(2[abAB]))[0-9]{3}$/;
    if (ZIPCODE_REGEX.test(value) && this.emptyOrNull(value) === false) {
      this.errors.push(`Field ${field_name} must be a french zipcode (received : ${value})`);
      return false;
    }
    return true;
  }

  /**
   * Check if value is a FR phone format
   * @param {String} field_name Field name
   * @param {*} value Value of the field
   * @returns {Boolean}
   */
  telephone(field_name, value) {
    const PHONE_REGEX = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
    if (PHONE_REGEX.test(value) && this.emptyOrNull(value) === false) {
      this.errors.push(`Field ${field_name} must be a french number phone (received : ${value})`);
      return false;
    }
    return true;
  }

  /**
   * Check if value is in list of values
   * @param {String} field_name Field name
   * @param {*} value Value of the field
   * @param {*} list List of value with coma
   * @returns {Boolean}
   */
  in(field_name, value, list) {
    let authorize_values = list.split(",");
    if (authorize_values.includes(value) === false) {
      this.errors.push(`Field ${field_name} must be in the list : ${list} (received : ${value})`);
      return false;
    }
    return true;
  }

  /**
   * Check if value exist in database (for relation)
   * @param {String} field_name Field name
   * @param {*} value Value of the field
   * @param {String} data format = table,column
   * @returns {Boolean}
   */
  async exist(field_name, value, data) {
    let { table, column } = data.split(",");
    let Q = new Query(`SELECT COUNT(*) AS total FROM ${table} WHERE ${column} = $1`, [value]);
    try {
      let result = await Q.execute();
      return result.total > 0;
    } catch (err) {
      this.errors.push(`Field ${field_name} must exist in database (received : ${value})`);
      return false;
    }
  }

  /**
   * Check if value exist in database and deleted_at field is null
   * @param {String} field_name Field name
   * @param {*} value Value of the field
   * @param {String} data format = table,column
   * @returns {Boolean}
   */
  async existNotDeleted(field_name, value, data) {
    let { table, column } = data.split(",");
    let Q = new Query(`SELECT COUNT(*) AS total FROM ${table} WHERE ${column} = $1 AND deleted_at IS NULL`, [value]);
    try {
      let result = await Q.execute();
      return result.total > 0;
    } catch (err) {
      this.errors.push(`Field ${field_name} must exist in database (received : ${value})`);
      return false;
    }
  }

  /**
   * Check if value exist in database and enabled is true
   * @param {String} field_name Field name
   * @param {*} value Value of the field
   * @param {String} data format = table,column
   * @returns {Boolean}
   */
  async existEnabled(field_name, value, data) {
    let { table, column } = data.split(",");
    let Q = new Query(`SELECT COUNT(*) AS total FROM ${table} WHERE ${column} = $1 AND enabled = TRUE`, [value]);
    try {
      let result = await Q.execute();
      return result.total > 0;
    } catch (err) {
      this.errors.push(`Field ${field_name} must exist in database (received : ${value})`);
      return false;
    }
  }

  /**
   * Check if value exist in database , enabled and not soft-deleted
   * @param {String} field_name Field name
   * @param {*} value Value of the field
   * @param {String} data format = table,column
   * @returns {Boolean}
   */
  async existEnabledNotDeleted(field_name, value, data) {
    let { table, column } = data.split(",");
    let Q = new Query(`SELECT COUNT(*) AS total FROM ${table} WHERE ${column} = $1 AND enabled = TRUE AND deleted_at IS NULL`, [value]);
    try {
      let result = await Q.execute();
      return result.total > 0;
    } catch (err) {
      this.errors.push(`Field ${field_name} must exist in database (received : ${value})`);
      return false;
    }
  }

  /**
   * Check if value is undefined
   * Be careful : no log entry in errors
   * @param {*} value Value of the field
   * @returns {Boolean}
   */
  undefined(value) {
    return typeof value === "undefined";
  }

  /**
   * Check if value is empty
   * Be careful : no log entry in errors
   * @param {*} value Value of the field
   * @returns {Boolean}
   */
  empty(value) {
    if (value) {
      let string = value.toString();
      return string === "" || !string.replace(/\s/g, "").length;
    }
    return false;
  }

  /**
   * Check if value is empty or null
   * Be careful : no log entry in errors
   * @param {*} value Value of the field
   * @returns {Boolean}
   */
  emptyOrNull(value) {
    return this.empty(value) || value === null;
  }
}

module.exports = new Validator();
