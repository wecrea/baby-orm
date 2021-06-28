#!/usr/bin/env node

// Load .env file if not in production
if (process.env.NODE_ENV !== "production") {
  console.log("DEBUG : load .env file because not in production mode");
  require("dotenv").config();
}

const fs = require("fs");
const async = require("async");
const Config = require("../src/Config");
const Query = require("../src/Query");

console.log("Start migration process");

// use waterfall to have a synchronous process
async.waterfall(
  [checkMigrationTable, createMigrationTable, getLastMigration, executeFiles],
  (err, result) => {
    if (err) {
      // called everywhere in waterfall if there is an error
      console.error(`An error occurred :`, err.message);
    } else {
      // Display success message at the end of the process
      console.log(`End of migration, ${result} file(s) imported !`);
    }

    // Kill node process anyway
    process.exit();
  }
);

/**
 * Check if Migration table exists in DB
 * @param {Object} callback Callback method for waterfall
 */
function checkMigrationTable(callback) {
  // This query helps to find or table named "migrations"
  let Q = new Query(
    `SELECT * 
  FROM information_schema.tables 
  WHERE table_catalog = $1 AND table_name = $2`,
    [process.env.PGDATABASE, "migrations"]
  );
  Q.execute()
    .then((result) => {
      return callback(null, result.rows.length > 0);
    })
    .catch((err) => {
      // Error = go to the end of the async waterfall
      return callback(err, null);
    });
}

/**
 * Create table Migration if not exists in DB
 * @param {Boolean} tableExist True if table Migrations exists in DB
 * @param {Object} callback Callback to go next waterfall function
 */
function createMigrationTable(tableExist, callback) {
  // If we found the table in previous step
  if (tableExist) {
    // Go to the next step :-)
    return callback(null, false);
  }

  // Create the Migration table
  let Q = new Query(
    `CREATE TABLE migrations (id SERIAL PRIMARY KEY,file VARCHAR NOT NULL)`
  );
  Q.execute()
    .then((result) => {
      console.log(`Migration table successfully created`);
      return callback(null, true);
    })
    .catch((err) => {
      // Error = go to the end of the waterfall
      return callback(err, null);
    });
}

/**
 * Get the last Migration filename if needed
 * @param {Boolean} created True if Migration table was created
 * @param {Object} callback Callback to the next function in the waterfall
 */
function getLastMigration(created, callback) {
  // Table has just been created so go the next step
  if (created) {
    return callback(null, null);
  }

  // Retrieve last file migrated
  let Q = new Query(`SELECT file FROM migrations ORDER BY id DESC LIMIT 1`);
  Q.execute()
    .then((result) => {
      return callback(
        null,
        result.rows.length > 0 ? result.rows[0].file : null
      );
    })
    .catch((err) => {
      return callback(err, null);
    });
}

/**
 * Execute files to migrate
 * @param {String, Null} lastFile Last migrated filename or null
 * @param {Object} callback Method callback to the next stepin waterfall
 */
function executeFiles(lastFile, callback) {
  let lastFileDate = null;

  // We display last file migrated if exists
  if (lastFile !== null) {
    console.log(`Last migrated file was ${lastFile}`);
    lastFileDate = lastFile.split("-")[0];
  }

  // Define the working directory
  const working_dir = `${Config.base_path}/${Config.database_dir}/migration`;

  // Read directory
  fs.readdir(working_dir, (err, files) => {
    if (err) {
      return callback(err, null);
    }

    // If there is no file, go the next step of waterfall
    if (files.length === 0) {
      return callback(null, 0);
    }

    // Count files migrated in this batch
    let nbFiles = 0;
    files.forEach(async (file, index) => {
      // Test if it a new file or not
      if (lastFileDate !== null && lastFileDate >= file.split("-")[0]) {
        // If old file and no file must be migrated, go to the next step of waterfall
        if (files.length - 1 === index) {
          return callback(null, nbFiles);
        }

        // Old file so go to next please
        return;
      }

      // Load file
      let migration_file_content = require(working_dir + "/" + file);

      // Only if there is many queries in the file
      if (migration_file_content.queries.length > 0) {
        // Execute all queries in the file

        let resultExecution = await executeQueries(
          migration_file_content.queries
        );
        if (resultExecution !== true) {
          return callback(resultExecution, null);
        }

        // Display message and increment counter
        console.log(`Executed migration file ${file} successfully !`);
        nbFiles++;

        // All files migrated, go to the next step of waterfall
        if (files.length - 1 === index) {
          return callback(null, nbFiles);
        }
      }
    });
  });
}

/**
 * Execute all queries in the SQL file
 * @param {Array} queries List of queries
 * @returns {Boolean, String}
 */
async function executeQueries(queries) {
  let lastError = null;
  await queries.reduce(async (memo, sql_query) => {
    await memo;

    if (lastError) {
      return;
    }

    let Q = new Query(sql_query);
    await Q.execute()
      .then((result) => {
        console.log(`Query ${result.command} executed`);
      })
      .catch((err) => {
        lastError = err;
      });
  }, undefined);
  return lastError || true;
}
