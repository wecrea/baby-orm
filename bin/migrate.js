#!/usr/bin/env node

if (process.env.NODE_ENV !== "production") {
  console.log("DEBUG : load .env file because not in production mode");
  require("dotenv").config();
}

const fs = require("fs");
const db = require("../src/libraries/db");
const working_dir = "./database/migration";

const main = async () => {
  try {
    const result = await db.query(
      `SELECT * 
      FROM information_schema.tables 
      WHERE table_catalog = '${process.env.PGDATABASE}' AND table_name = 'migrations'`
    );
    if (result.rows.length === 0) {
      await createMigrationTable(migrateFiles);
    } else {
      const lastfile = await db.query(
        `SELECT file FROM migrations ORDER BY id DESC LIMIT 1`
      );
      await migrateFiles(
        lastfile.rows.length > 0 ? lastfile.rows[0].file : null
      );
    }
  } catch (e) {
    console.error(e.stack);
    process.exit();
  }
};

const createMigrationTable = async (callback) => {
  try {
    await db.query(
      `CREATE TABLE migrations (id SERIAL PRIMARY KEY,file VARCHAR NOT NULL);`
    );
    console.log("Created migrations table successfully");
    await callback(null);
  } catch (e) {
    throw new Error(e.stack);
  }
};

const migrateFiles = async (lastfile) => {
  let lastfile_date = null;
  if (lastfile !== null) {
    console.log(`Dernier fichier traité : ${lastfile}`);
    lastfile_date = lastfile.split("-")[0];
  }

  fs.readdir(working_dir, (err, files) => {
    if (err) throw new Error(err);

    if (files.length === 0) {
      console.log("Aucun fichier à traiter");
      process.exit();
    }

    files.forEach((file) => {
      if (lastfile_date !== null && lastfile_date >= file.split("-")[0]) {
        return;
      }

      let migration_file_content = require("." + working_dir + "/" + file);
      if (migration_file_content.queries.length > 0) {
        executeQueries(migration_file_content.queries)
          .then(async () => {
            await db.query(`INSERT INTO migrations (file) VALUES ('${file}')`);
            console.log(`${file} traité avec succès !`);
          })
          .catch((e) => {
            console.log(e);
            //throw new Error(e.stack);
          });
      }
    });
  });
};

const executeQueries = async (queries) => {
  return new Promise((resolve, reject) => {
    queries.forEach(async (sql_query, index, array) => {
      try {
        await db.query(sql_query);
        if (array.length - 1 === index) {
          resolve();
        }
      } catch (e) {
        reject(e);
      }
    });
  });
};

main();
