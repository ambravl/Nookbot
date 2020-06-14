/*
* User Infractions Schema:
    case
    action
    points
    reason
    moderator
    dmSent
    date
* */
/*
* Reaction Roles Schema:
* roleID
* emojiID
* */
module.exports = (client) => {
  const { Client } = require('pg');
  const schema = require('./db-schema.json');

  client.initialize = function() {
    client.db = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });
    client.db.connect();

    client.tableList = [];
    for (let table in schema) {
      if (schema.hasOwnProperty(table)) {
        client.tableList.push(table);
        let columns = Object.keys(schema[table]);
        client[table] = new Table(table, columns[0], columns[1]);
        console.log(`Attempting to create table object for ${table}...`);
      }
    }
  };

  class Table {
    constructor(tableName, mainColumn, secondaryColumn) {
      this.name = tableName;
      this.mainColumn = mainColumn;
      this.secondaryColumn = secondaryColumn;
    }

    async query(query, mainID) {
      const whereQuery = mainID ? query + ` WHERE "${this.mainColumn}" = '${mainID}'` : query;
      try {
        const res = await client.db.query(whereQuery);
        console.log(`Ran [${whereQuery}] with a result size of ${res ? res.rows.length : res}`);
        return res;
      } catch (err) {
        console.error(`Got error while running query "${whereQuery}", error is ${err}`);
        throw err;
      }
    }

    makeQuery(queryType, args){
      let query;
      switch (queryType) {
        case 'select':
          query = `SELECT "${args[0]}" FROM ${this.name} WHERE "${this.mainColumn}" = $1`;
          break;
        case 'selectAll':
          query = `SELECT "${args[0]}" FROM ${this.name}`;
          break;
        case 'update':
          query =  `UPDATE ${this.name} SET "${args[0]}" = $1 WHERE "${this.mainColumn}" = $2`;
          break;
        case 'insert':
          query = `INSERT INTO ${this.name} ("${args.join('", "')}") VALUES ($${args.map((k, i) => i+1).join(', $')})`;
          break;
        default:
          query = args[0];
      }
      return query;
    }

    async get(mainID) {
      try {
        let res = await client.db.query(this.makeQuery('select', this.secondaryColumn), [mainID]);
        if (!res || res.rows === null) return undefined;
        res = res.rows[0][this.secondaryColumn];
        console.log(`Got value ${res} from key ${mainID}`);
        const columnType = schema[this.name][this.secondaryColumn];
        if(columnType ===  "boolean") return res === "t";
        if(columnType.search("[") !== -1) return res.slice(1, -1).split(", ");
        return res;
      } catch (err) {
        console.error(err);
        return undefined;
      }
    };

    ensure(mainID, defaultValue) {
      const res = this.get(mainID);
      if(res === undefined){
        console.log(mainID);
        this.set(mainID, defaultValue, this.secondaryColumn);
        return defaultValue;
      }
      return res;
    };

    set(mainID, setValue, setColumn) {
      if(this.query(`SELECT "${this.mainColumn}" FROM ${this.name}`, mainID) ) return this.query(`UPDATE ${this.name} SET "${setColumn}" = '${setValue}'`, mainID);
      return this.query(`INSERT INTO ${this.name} ("${this.mainColumn}", "${setColumn}") VALUES ('${mainID}', '${setValue}')`);
    };

    math(mainID, operation, modifier, column) {
      return this.query(`UPDATE ${this.name} SET "${column}" = "${column}" ${operation} ${modifier}`, mainID);
    };

    push(mainID, newValue, column) {
      return this.query(`UPDATE ${this.name} SET "${column}" = "${column}"||'${JSON.stringify(newValue)}'`, mainID);
    };

    remove(mainID, toRemove, column) {
      return this.query(`UPDATE ${this.name} SET "${column}" = array_remove("${column}", '${toRemove}')`, mainID);
    };

    has(mainID) {
      return this.query(`SELECT * FROM ${this.name}`, mainID).rows === null;
    };

    delete(mainID, column) {
      if (!column) return this.query(`DELETE FROM ${this.name}`, mainID);
      return this.query(`UPDATE ${this.name} SET "${column}" = null`, mainID);
    };

    setProp(mainID, column, value) {
      if (value === []) return this.query(`UPDATE ${this.name} SET "${column}" = null`, mainID);
    };

    keyArray() {
      const valuePairs = this.query(`select "${this.mainColumn}" from ${this.name}`);
      if(!valuePairs) return [];
      let keyArray = [];
      for (let row of valuePairs.rows) {
        keyArray.push(row[this.mainColumn]);
      }
      return keyArray;
    };

    count() {
      return this.query(`SELECT COUNT("${this.mainColumn}") AS dracula FROM ${this.name}`).rows[0].dracula;
    }

    map(method) {
      const table = this.query(`SELECT * FROM ${this.name}`).rows;
      let result = [];
      table.forEach(row => {
        result.push(method(row[this.secondaryColumn], row[this.mainColumn]))
      });
      return result;
    };

    getProp(mainID, column) {
      return this.query(`SELECT "${column}" FROM ${this.name}`, mainID).rows[0];
    };

    removeFrom(mainID, column, remove) {
      return this.remove(mainID, remove, column);
    };

    pushIn(mainID, column, newValue) {
      return this.push(mainID, newValue, column);
    };

    dec(mainID) {
      this.math(mainID, "-", "1", this.secondaryColumn);
    };

    inc(mainID) {
      this.math(mainID, "+", "1", this.secondaryColumn);
    };

    sweep(method) {
      this.keyArray().forEach((key, index) => {
        if (method(index, key)) this.delete(key);
      });
    };

    findKey(value) {
      return this.query(`SELECT "${this.mainColumn}" FROM ${this.name} WHERE "${this.secondaryColumn}" = '${value}'`).rows[0][this.mainColumn];
    };

    add(value) {
      return this.query(`INSERT INTO ${this.name} ("${this.mainColumn}", "${this.secondaryColumn}") VALUES ( DEFAULT, '${value}') RETURNING "${this.mainColumn}"`);
    };

    randomKey() {
      const theWholeDamnDB = this.query(`SELECT "${this.mainColumn}" FROM ${this.name}`);
      return theWholeDamnDB[Math.floor(Math.random() * theWholeDamnDB.rows.length)];
    };
  }
};