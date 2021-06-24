class BabyOrmError extends Error {
  constructor(name, description, isFatal = false) {
    super(description);
    Object.setPrototypeOf(this, new.target.prototype);

    this.name = name;
    this.isFatal = isFatal;

    Error.captureStackTrace(this);

    console.error(
      this.isFatal
        ? `FATAL : ${this.name} : ${this.description}`
        : `${this.name} : ${this.description}`
    );
  }
}

module.exports = BabyOrmError;
