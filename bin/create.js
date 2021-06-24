#!/usr/bin/env node
const fs = require("fs");
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log("Il faut renseigner au moins un paramètre !");
  help();
}

if (args[0] === "help") {
  help();
}

const filename = makeFileName(args[0]);

const table_name = args.length > 1 ? args[1] : "tablename";
const query_type =
  (args.length > 2 && (args[2] == "create" || args[2] == "alter")
    ? args[2].toUpperCase()
    : "CREATE") + " TABLE";
const init_content = `//auto-generated SQL Migration file
module.exports = {
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

fs.writeFile("./database/migration/" + filename, init_content, () => {
  console.log(`Fichier de migration ${filename} créé avec succès !`);
});

function makeFileName(name) {
  const now = new Date();
  let dateFormat = "";

  dateFormat += now.getFullYear();
  dateFormat += now.getMonth() < 10 ? "0" + now.getMonth() : now.getMonth();
  dateFormat += now.getDate() < 10 ? "0" + now.getDate() : now.getDate();
  dateFormat += now.getHours() < 10 ? "0" + now.getHours() : now.getHours();
  dateFormat +=
    now.getMinutes() < 10 ? "0" + now.getMinutes() : now.getMinutes();
  dateFormat +=
    now.getSeconds() < 10 ? "0" + now.getSeconds() : now.getSeconds();

  return dateFormat + "-" + name + ".js";
}

function help() {
  console.log(
    "USAGE : npm run make:migration migration_name [table_name] [create|alter]"
  );
  process.exit();
}
