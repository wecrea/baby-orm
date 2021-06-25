# Baby ORM - Tiny NodeJS ORM for Postgresql

## Installation

Install node module

```
npm i -S baby-orm
```

## Scripts

If you want to use migrations scripts, add this lines in your `package.json`

```
"scripts": {
    "babyorm:create": "node ./node_modules/baby-orm/bin/create",
    "babyorm:migrate": "node ./node_modules/baby-orm/bin/migrate"
}
```

To use scripts :

```
npm run babyorm:create filename [table_name] [create|alter]
npm run babyorm:create help

npm run babyorm:migrate
```

## Env variables

You can create a .`env` file if you are not in Production mode.
Add the following lines in it :

```
## DATABASE
PGUSER=my_user
PGHOST=127.0.0.1
PGPASSWORD=secretpassword
PGDATABASE=my_database
PGPORT=5432

BABYORM_BASE_PATH="/path/to/your/project"
BABYORM_DATABASE_DIR=database
BABYORM_MODELS_DIR=src/models
```

## Make query

```
const { Query } = require("baby-orm");
let query = new Query();
query.setQuery(`SELECT * FROM users WHERE email = $1 AND valid = $2`);
query.setParams(['test@testmail.com', true]);
query.execute()
    .then(result => {
        console.log(result)
    })
    .catch(err => {
        console.error(err)
    });
```

It is possible to create directly in constructor

```
const { Query } = require("baby-orm");
let query = new Query(
    `SELECT * FROM users WHERE email = $1 AND valid = $2`,
    ['test@testmail.com', true]
);
query.execute()
    .then(result => {
        console.log(result)
    })
    .catch(err => {
        console.error(err)
    });
```

## Create Model

Create file Model in correct directory (default `src/models`).

Example `user.js` for a User model :

```
const { Helpers } = require("baby-orm");
const UserModel = {
    config: {
        table: "users",
        use_autoincrement: false, // default true to have numeric ID, otherwise unique string
        timestamps: true, // add created_at and updated_at fields
        soft_delete: true, // not really delete in DB, just fill deleted_at field
        fillable_fields: ["firstname", "lastname", "email"],
        validations: {
            firstname: ["string", "maxLength:64"],
            firstname: ["string", "maxLength:128"],
            email: ["email", "maxLength:128"],
        },
    },
    fields: {
        id: null,
        firstname: "John",
        lastname: "DOE",
        email: null,
    },
    methods: {
        getFullname: () => {
            return (
            Helpers.ucfirst(UserModel.fields.firstname) +
            " " +
            UserModel.fields.lastname.toUpperCase()
            );
        },
    },
};

module.exports = UserModel;
```

## Use ORM

```
const { ORM } = require("baby-orm");
let User = ORM.model('user')
User.create({
        firstname: "Mickael",
        lastname: "Scofield",
        email: "m.scofield@prison.break"
    })
    .then(result => {
        console.log("User created", result);
    })
    .catch(err => {
        console.error(err);
    });
```
