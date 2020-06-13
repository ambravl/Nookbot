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
  const reload = true;
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

    if(reload && client.resetDB()) client.cacheConfig();
    else client.cacheConfig();
  };

  client.resetDB = function() {
    let creationQuery = "";
    client.tableList.forEach(table => {
      console.log(`table name: ${table}`);
      creationQuery += `CREATE TABLE ${table} (`;
      for (let column in schema[table]) {
        if (schema[table].hasOwnProperty(column)) {
          creationQuery += `"${column}" ${schema[table][column]},`;
        }
      }
      creationQuery = creationQuery.slice(0, -1) + ");";
    });
    client.db.query(`DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public; ${creationQuery}`, (err) => {
      if(err){
        console.log(`Got error while trying to run query [DROP TABLE ${client.tableList.join(", ")}; ${creationQuery}], error: ${err}`);
      }
      console.log(`Successfully reset database`);
      client.db.query(`INSERT INTO configDB ("config_name", "config_value", "testing_value", "config_type") VALUES 
('raidJoinsPerSecond', '10', '10', 'int'),
('raidJoinCount', '10', '10', 'int'),
('prefix', '.', '.', 'text'),
('staffChat', '718581551331409971', '720568062490705931', 'text'),
('modMail', '720057587768229989', '720568062490705931', 'text'),
('reportMail', '720058757954011231', '720568062490705931', 'text'),
('actionLog', '720057918791090212', '720568062490705931', 'text'),
('joinLeaveLog', '720057918791090212', '720568062490705931', 'text'),
('modLog', '720057897626632242', '720568062490705931', 'text'),
('musicText', '720055418923122788', '720568062490705931', 'text'),
('music', '718645777399808001', '721429219187359794', 'text'),
('sesReqText', '', '720568062490705931', 'text'),
('sesCategory', '', '698388740040556586', 'text'),
('calendar', '720054742562242600', '720568062490705931', 'text'),
('imageOnlyChannels', '717588460160155779', '718192476828991550', 'array'),
('newlineLimitChannels', '', '718192476828991550', 'array'),
('newlineLimit', '10', '10', 'int'),
('imageLinkLimit', '3', '3', 'int'),
('noMentionChannels', '', '720568062490705931', 'array'),
('negativeRepLimit', '20', '20', 'int'),
('positiveRepLimit', '20', '20', 'int'),
('banAppealLink', '', '720568062490705931', 'text'),
('ignoreMember', '', '435195670702325791', 'array'),
('ignoreChannel', '', '716935607934386257', 'array')
`, (err) => {
        if(err) console.error(err);
      });
      client.db.query(`INSERT INTO permissionDB ("level", "name", "roleID") VALUES (0, 'User', 0), 
(1, 'Verified', 1), 
(2, 'Redd', 2), 
(3, 'Head Redd', 3), 
(4, 'Mod', 718580735253938196), 
(5, 'Head Mod', 5), 
(6, 'Admin', 6), 
(7, 'Server Owner', 7), 
(8, 'Bot Support', 8), 
(9, 'Bot Admin', 9), 
(10, 'Bot Owner', 10)`, (err) => {
        if(err) console.error(`Got error while creating permission database: ${err}`);
        return true;
      })
    })
  };

  class Table {
    constructor(tableName, mainColumn, secondaryColumn) {
      this.name = tableName;
      this.mainColumn = mainColumn;
      this.secondaryColumn = secondaryColumn;
    }

    query(query, mainID) {
      const whereQuery = mainID ? query + ` WHERE "${this.mainColumn}" = '${mainID}'` : query;
      client.db.query(whereQuery, (err, res) => {
        if (err){
          console.error(`Got error while running query "${whereQuery}", error is ${err}`);
          throw err;
        }
        return res;
      })
    }

    get(mainID) {
      let res = this.query(`SELECT "${this.secondaryColumn}" FROM ${this.name}`, mainID);
      if (!res || res.rows === null) return undefined;
      res = res.rows[0][this.secondaryColumn];
      console.log(`Got value ${res} from key ${mainID}`);
      const columnType = schema[this.name][this.secondaryColumn];
      if(columnType ===  "boolean") return res === "t";
      if(columnType.search("[") !== -1) return res.slice(1, -1).split(", ");
    };

    ensure(mainID, defaultValue) {
      const res = this.get(mainID);
      if(res === undefined){
        this.set(mainID, defaultValue, this.secondaryColumn);
        return defaultValue;
      }
      return res;
    };

    set(mainID, setValue, setColumn) {
      if(this.query(`SELECT "${this.mainColumn}" FROM ${this.name}`, mainID)) return this.query(`UPDATE ${this.name} SET "${setColumn}" = '${setValue}'`, mainID);
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