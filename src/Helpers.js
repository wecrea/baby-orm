module.exports = {
  /**
   * Capitalize first letter of a word or a sentence
   * @param {String} str Word or string
   * @returns {String} transformed string
   */
  ucfirst: (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  /**
   * Create a random string of <length> char
   * @param {Integer} length Length of the random string
   * @returns {String}
   */
  randomStr: (length = 8) => {
    return Math.random()
      .toString(36)
      .substring(parseInt(length) + 1);
  },

  /**
   * Get a random uniqid like uniqid() method in PHP
   * @param {String} prefix Prefix of the unique ID
   * @param {Boolean} random True if you want more anthropy
   * @returns {String}
   */
  uniqid: (prefix = "", random = false) => {
    // Based on Date object and Random float
    const sec = Date.now() * 1000 + Math.random() * 1000;

    // Create the ID on 14 char
    const id = sec.toString(16).replace(/\./g, "").padEnd(14, "0");

    // return with prefix and add a random interger if needed (with random)
    return `${prefix}${id}${
      random ? `.${Math.trunc(Math.random() * 100000000)}` : ""
    }`;
  },
};
