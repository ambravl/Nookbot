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


class DBError extends Error{
  constructor(query, error){
    super(error.message);
    if(Error.captureStackTrace){
      Error.captureStackTrace(this, DBError);
    }
    this.name = 'Database Error!';
    this.date = new Date();
    this.message = `Database Error! [${error.name}] when running query: [${query}], error: ${error.message}`;
  }
}

module.exports = async (client) => {
  const {Client} = require('pg');
  client.dbSchema = require('./db-schema.json');

  client.initializeDB = async function () {
    client.db = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });
    client.db.connect();
    if (client.firstTime) {
      const firstTime = await require('./first-time-setup').run(client);
      client.db.query(firstTime)
        .catch((err) => {
          client.handle(new DBError(firstTime, err), 'first time query')
        });
    }

    for (let table in client.dbSchema) {
      if (client.dbSchema.hasOwnProperty(table)) {
        let columns = Object.keys(client.dbSchema[table]);
        client[table] = new Table(table, columns);
      }
    }
  };

  class Table {
    /**
     * @param {string} tableName
     * @param {Array<string>} columns
     */
    constructor(tableName, columns) {
      this.name = tableName;
      this.mainColumn = columns[0];
      this.secondaryColumn = columns[1];
    }

    async dropDB() {
      client.db.query(`DROP TABLE ${this.name}`)
        .catch((err) => console.log(err));
      let columns = [];
      Object.keys(client.dbSchema[this.name]).forEach((key) => {
        columns.push(`${key} ${client.dbSchema[this.name][key]}`)
      });
      let query = `CREATE TABLE ${this.name} (${columns.join(', ')})`;
      client.db.query(query)
        .catch((err) => {
          client.handle(new DBError(query, err), 'dropDB')
        });
    }

    cacheDB() {
      return client.db.query(`SELECT * FROM ${this.name}`);
    }

    async ensure(primaryKey, defaultValue, col) {
      let column = col ? col : this.secondaryColumn;
      const query = `SELECT ${column} FROM ${this.name} WHERE ${this.mainColumn} = $1`;
      try {
        let res = await client.db.query(query, [primaryKey]);
        console.log(res);
        if (!res || !res.rows || res.rows.length < 1) throw new Error('noExist');
        if (column === '*') return res.rows[0];
        else {
          res = res.rows[0][column];
          if (res) return res;
          this.update(primaryKey, defaultValue, column)
            .catch((err) => {
              client.handle(err, 'ensure update')
            });
        }
      } catch (e) {
        if (column === '*') {
          const insertQuery = `INSERT INTO ${this.name} (${this.mainColumn}) VALUES ($1)`;
          client.db.query(insertQuery, [primaryKey])
            .catch((err) => {
              client.handle(new DBError(insertQuery, err), 'ensure insert on *')
            });
        } else {
          this.insert(primaryKey, defaultValue, [column])
            .catch((err) => {
              client.handle(new DBError(e.message, err), 'ensure insert');
            });
          return defaultValue;
        }
      }
    }

    /**
     * @param {boolean} minus
     * @param {string} primaryKey
     * @param {string} keyToRemove
     */
    switchPoints(minus, primaryKey, keyToRemove) {
      const posRep = `"positiveRep" = "positiveRep" ${minus ? '-1' : '+1'}`;
      const negRep = `"negativeRep" = "negativeRep" ${minus ? '-1' : '+1'}`;
      const posRepL = `"posRepList" = ${minus ? 'array_remove("posRepList", $2)' : '"posRepList" || $2'}`;
      const negRepL = `"negRepList" = ${minus ? 'array_remove("negRepList", $2)' : '"negRepList" || $2'}`;
      const q = `UPDATE ${this.name} SET ${posRep}, ${negRep}, ${posRepL}, ${negRepL} WHERE ${this.mainColumn} = $1`;
      client.db.query(q, [primaryKey, keyToRemove])
        .catch((err) => {
          client.handle(new DBError(q, err), 'switchPoints')
        });
    }

    /**
     * @param {string} primaryKey
     * @param {Array<string>} values
     * @param {Array<string>} columns
     */
    mathAndPush(primaryKey, values, columns) {
      const query = `UPDATE ${this.name} SET ${columns[0]} = ${columns[0]} + $2, ${columns[1]} = ${columns[1]} || $3 WHERE ${this.mainColumn} = $1`;
      client.db.query(query, values.unshift(primaryKey))
        .catch((err) => {
          client.handle(new DBError(query, err), 'mathAndPush')
        });
    }

    /**
     * @param {string} primaryKey
     * @param {Array<string>|string} vals
     * @param {Array<string>} cols
     * @returns {(string|*[]|number)[]}
     */
    treatData(primaryKey, vals, cols) {
      let columns = cols;
      let values;
      if (columns) {
        columns.unshift(this.mainColumn);
        columns = columns.join(', ');
      } else columns = `${this.mainColumn}, ${this.secondaryColumn}`;
      if (vals instanceof Array) {
        values = vals;
        values.unshift(primaryKey);
      } else values = [primaryKey, vals !== undefined && vals !== null ? vals : ''];
      return [columns, values];
    }

    /**
     * @param {string} primaryKey
     * @param {Array<string>|string} vals
     * @param {Array<string>} cols
     */
    async insert(primaryKey, vals, cols) {
      const [columns, values] = this.treatData(primaryKey, vals, cols);
      let valueCall = [];
      for (let i = 0; i < values.length; i++) valueCall.push(`$${i + 1}`);
      const query = `INSERT INTO ${this.name} (${columns}) VALUES (${valueCall.join(', ')})`;
      client.db.query(query, values)
        .catch((err) => {
          client.handle(new DBError(query, err), 'insert')
        });
    }

    /**
     * @param {string} primaryKey
     */
    async delete(primaryKey) {
      const query = `DELETE FROM ${this.name} WHERE ${this.mainColumn} = $1 RETURNING ${this.secondaryColumn}`;
      client.db.query(query, [primaryKey])
        .catch((err) => {
          client.handle(new DBError(query, err), 'remove');
        });
    }

    /**
     * @param {string} primaryKey
     * @param {string} value
     * @param {string} column
     */
    async update(primaryKey, value, column) {
      const query = `UPDATE ${this.name} SET ${column} = $1 WHERE ${this.mainColumn} = $2`;
      client.db.query(query, [value, primaryKey])
        .catch((err) => {
          client.handle(new DBError(query, err), 'update');
        });
    }

    /**
     * @param {string} primaryKey
     * @param {Array<string>} values
     * @param {Array<string>} columns
     */
    multiUpdate(primaryKey, values, columns) {
      let updates = [];
      for (let i = 0; i < columns.length; i++) {
        updates.push(`${columns[i]} = $${i + 2}`);
      }
      const query = `UPDATE ${this.name} SET ${updates.join(', ')} WHERE ${this.mainColumn} = $1`;
      client.db.query(query, values.unshift(primaryKey))
        .catch((err) => {
          client.handle(new DBError(query, err), 'multiUpdate')
        })
    }

    /**
     * @param {string} primaryKey
     * @param {string} value
     * @param {string} column
     * @returns {Promise<void>}
     */
    async push(primaryKey, value, column) {
      const query = `UPDATE ${this.name} SET ${column} = ${column} || $1 WHERE ${this.mainColumn} = $2`;
      client.db.query(query, [value, primaryKey])
        .catch((err) => {
          client.handle(new DBError(query, err), 'push');
        })
    }

    /**
     * @param {string} value
     * @returns {*}
     */
    add(value) {
      return this.query(`INSERT INTO ${this.name} (${this.mainColumn}, ${this.secondaryColumn}) VALUES ( DEFAULT, '${value}') RETURNING ${this.mainColumn}`);
    };

    /**
     * @param {string} primaryKey
     * @param {string} value
     * @param {string} column
     */
    async pop(primaryKey, value, column) {
      const query = `UPDATE ${this.name} SET ${column} = array_remove(${column}, $1) WHERE ${this.mainColumn} = $2`;
      client.db.query(query, [value, primaryKey])
        .catch((err) => {
          client.handle(new DBError(query, err), 'pop')
        });
    }

    /**
     * @param {string} primaryKey
     * @param {string} value
     * @param {string} column
     * @param {boolean} push
     * @returns {Promise<void>}
     */
    async safeUpdate(primaryKey, value, column, push) {
      const query = `SELECT ${column} FROM ${this.name} WHERE ${this.mainColumn} = $1`;
      client.db.query(query, [primaryKey])
        .then((res) => {
          if (!res || res.rows < 1) {
            this.insert(primaryKey, value, [column])
              .catch((err) => {
                client.handle(err, 'safeUpdate insert')
              });
          } else if (push) {
            this.push(primaryKey, value, column)
              .catch((err) => {client.handle(err, 'safeUpdate push')});
          } else {
            this.update(primaryKey, value, column)
              .catch((err) => {
                client.handle(err, 'safeUpdate update')
              });
          }
        })
        .catch((err) => {
          client.handle(new DBError(query, err), 'safeUpdate');
        });
    }

    /**
     * @param {string} primaryKey
     * @param {string} col
     */
    async select(primaryKey, col) {
      let column = col ? col : this.secondaryColumn;
      const query = `SELECT ${column} FROM ${this.name} WHERE ${this.mainColumn} = $1`;
      try {
        const res = await client.db.query(query, [primaryKey]);
        if (!res || !res.rows || res.rows.length < 1) return null;
        return res.rows[0][column];
      } catch (err) {
        client.handle(new DBError(query, err), 'select');
      }
    }

    /**
     * @param {string} primaryKey
     */
    async selectAll(primaryKey) {
      const query = `SELECT * FROM ${this.name} WHERE ${this.mainColumn} = $1`;
      return client.db.query(query, [primaryKey]);
    }

    /**
     * @param {string} primaryKey
     * @param {string} operation
     * @param {Number} modifier
     * @param {string} column
     * @returns {Promise<void>}
     */
    math(primaryKey, operation, modifier, column) {
      const query = `UPDATE ${this.name} SET ${column} = ${column} ${operation} ${modifier} WHERE ${this.mainColumn} = $1 RETURNING ${column}`;
      return client.db.query(query, [primaryKey]);
    };

    /**
     * @param {string} value
     * @param {string} column
     */
    async selectSearchArray(value, column) {
      const query = `SELECT * FROM ${this.name} WHERE $1 = ANY ${column}`;
      return client.db.query(query, [value]);
    }

    /**
     * @param {Number} limit
     * @param {'ASC'|'DESC'} order
     * @param {Number} offset
     */
    rank(limit, order, offset) {
      let query = `SELECT * FROM ${this.name} ORDER BY ${this.secondaryColumn} ${order} LIMIT $1`;
      if (offset) query += ` OFFSET $2`;
      return client.db.query(query, offset ? [limit, offset] : [limit]);
    }

    /**
     * @param {Number} number
     * @param {'<'|'>'} signal
     */
    threshold(number, signal) {
      const query = `SELECT * FROM ${this.name} WHERE ${this.secondaryColumn} ${signal} $1`;
      return client.db.query(query, [number]);
    }

    /**
     * @param {Array<string>} primaryKeys
     */
    multipleSelect(primaryKeys) {
      const valueCalls = primaryKeys.map((v, i) => `$${i + 1}`).join(', ');
      const query = `SELECT * FROM ${this.name} WHERE ${this.mainColumn} IN (${valueCalls})`;
      return client.db.query(query, primaryKeys);
    }

    /**
     * @param {string} primaryKey
     * @param {string} col
     * @returns {Promise<*|HTMLTableRowElement|string|null>}
     */
    async levenshtein(primaryKey, col) {
      let column = col ? col : this.mainColumn;
      const query = `SELECT * FROM ${this.name} WHERE levenshtein($1, ${column}) <= 2 ORDER BY levenshtein($1, ${column}) LIMIT 2`;
      try {
        const villagers = await (client.db.query(query, [primaryKey]));
        if (!villagers || !villagers.rows || villagers.rows.length < 1) return null;
        if (villagers.rows.length > 1 && villagers.rows[0].lv === villagers.rows[1].lv) return null;
        return villagers.rows[0];
      } catch (err) {
        client.handle(new DBError(query, err), 'levenshtein')
      }
    }
  }
};