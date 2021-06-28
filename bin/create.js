#!/usr/bin/env node
const fs = require("fs");
const Config = require("../src/Config");
const args = process.argv.slice(2);

// No argument, display help informations
if (args.length === 0) {
  console.log("You must fill a parameter with this command");
  help();
}

// If user need help to use this command
if (args[0] === "help") {
  help();
}

// Create a filename with first parameter
const filename = makeFileName(args[0]);

// Table name is second parameter (default: tablename)
const table_name = args.length > 1 ? args[1] : "tablename";

// Third parameter is type of query (default: create)
const query_type =
  (args.length > 2 && (args[2] == "create" || args[2] == "alter")
    ? args[2].toUpperCase()
    : "CREATE") + " TABLE";

// Default content of SQL file
const init_content = `//auto-generated SQL Migration file
export default {
  queries: [
    \`${query_type} ${table_name} (
      id SERIAL PRIMARY KEY,
      field VARCHAR(64) NOT NULL,
			created_at TIMESTAMP NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NULL,
			deleted_at TIMESTAMP DEFAULT NULL
      );\`,
  ]
}`;

// Write file on disk
fs.writeFile(
  Config.database_dir + "/migration/" + filename,
  init_content,
  () => {
    console.log(`Database migration ${filename} successfully created !`);
    process.exit();
  }
);

/**
 * Create a unique filename for the SQL file
 * @param {String} name Base name of the file
 * @returns {String}
 */
function makeFileName(name) {
  // Init data
  const now = new Date();
  let formatedDate = "";

  // Create datetime part : 20211231235959
  formatedDate += now.getFullYear();
  formatedDate += (now.getMonth() < 10 ? "0" : "") + now.getMonth();
  formatedDate += (now.getDate() < 10 ? "0" : "") + now.getDate();
  formatedDate += (now.getHours() < 10 ? "0" : "") + now.getHours();
  formatedDate += (now.getMinutes() < 10 ? "0" : "") + now.getMinutes();
  formatedDate += (now.getSeconds() < 10 ? "0" : "") + now.getSeconds();

  // Add name and extension
  return formatedDate + "-" + name + ".js";
}

/**
 * Display help message
 */
function help() {
  console.log(
    "USAGE : npm run baby-orm migration migration_name [table_name] [create|alter]"
  );
  process.exit();
}
