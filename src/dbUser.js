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

module.exports = (client) => {
  const { Client } = require('pg');
  client.dbSchema = require('./db-schema.json');

  client.initializeDB = async function() {
    client.db = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });
    client.db.connect();

    for (let table in client.dbSchema) {
      if (client.dbSchema.hasOwnProperty(table)) {
        let columns = Object.keys(client.dbSchema[table]);
        client[table] = new Table(table, columns);
      }
    }
  };

  class Table {
    constructor(tableName, columns) {
      this.name = tableName;
      this.mainColumn  = columns[0];
      this.secondaryColumn = columns[1];
    }

    cacheDB(){
      return client.db.query(`SELECT * FROM ${this.name}`);
    }

    async ensure(primaryKey, defaultValue, col){
      const column = col ? col : this.secondaryColumn;
      const query = `SELECT "${column}" FROM ${this.name} WHERE "${this.mainColumn}" = $1`;
      try {
        let res = await client.db.query(query, [primaryKey]);
        if (res && res.rows && res.rows.length > 0) {
          res = res.rows[column];
          if (res) return res;
          this.update(primaryKey, defaultValue, column)
            .catch((err) => {
              client.handle(err, 'ensure update')
            });
          return defaultValue;
        }
        this.insert(primaryKey, defaultValue, column)
            .catch((err) => {
              client.handle(err, 'ensure insert');
            });
        return defaultValue;
      } catch(err) {
        client.handle(new DBError(query, err), "ensure's select");
      }
    }

    treatData(primaryKey, vals, cols){
      let columns;
      let values;
      if(cols) columns = `${cols.unshift(this.mainColumn).join('", "')}`;
      else columns = `${this.mainColumn}", "${this.secondaryColumn}`;
      if(vals instanceof Array) values = vals.unshift(primaryKey);
      else values = [primaryKey, vals ? vals : ''];
      return [columns, values];
    }

    async insert(primaryKey, vals, cols){
      const [columns, values] = this.treatData(primaryKey, vals, cols);
      const valueCall = `${values.map((v, i) => `$${i+1}`).join(', ')}`;
      const query = `INSERT INTO ${this.name} ("${columns}") VALUES (${valueCall})`;
      client.db.query(query, values)
        .catch((err) => {
          client.handle(new DBError(query, err), 'insert')
        });
    }

    async delete(primaryKey){
      const query = `DELETE FROM ${this.name} WHERE "${this.mainColumn}" = $1`;
      client.db.query(query, [primaryKey])
        .catch((err) => {
          client.handle(new DBError(query, err), 'remove');
        });
    }

    async update(primaryKey, value, column){
      const query = `UPDATE ${this.name} SET "${column}" = $1 WHERE "${this.mainColumn}" = $2`;
      client.db.query(query, [value, primaryKey])
        .catch((err) => {
          client.handle(new DBError(query, err), 'update');
        });
    }

    async push(primaryKey, value, column){
      const query = `UPDATE ${this.name} SET "${column}" = "${column}" || $1 WHERE "${this.mainColumn}" = $2`;
      client.db.query(query, [JSON.stringify(value), primaryKey])
        .catch((err) => {
          client.handle(new DBError(query, err), 'push');
        })
    }

    async pop(primaryKey, value, column){
      const query =`UPDATE ${this.name} SET "${column}" = array_remove("${column}", $1) WHERE "${this.mainColumn}" = $2`;
      client.db.query(query, [value, primaryKey])
        .catch((err) => {client.handle(new DBError(query, err), 'pop')});
    }

    async safeUpdate(primaryKey, value, column, push){
      const query = `SELECT "${column}" FROM ${this.name} WHERE "${this.mainColumn}" = $1`;
      client.db.query(query, [primaryKey])
        .then((res) => {
          if(!res || res.rows < 1){
            this.insert(primaryKey, value, column)
              .catch((err) => {client.handle(err, 'safeUpdate insert')});
          }
          else if(push) {
            this.push(primaryKey, value, column)
              .catch((err) => {client.handle(err, 'safeUpdate push')});
          }
          else{
            this.update(primaryKey, value, column)
              .catch((err)=> {client.handle(err, 'safeUpdate update')});
          }
        })
        .catch((err) => {
          client.handle(new DBError(query, err), 'safeUpdate');
        });
    }

    async select(primaryKey, col){
      let column = col ? col : this.secondaryColumn;
      const query = `SELECT "${column}" FROM ${this.name} WHERE "${this.mainColumn}" = $1`;
      try{
        const res = await client.db.query(query, [primaryKey]);
        if(!res || !res.rows || res.rows.length < 1) return null;
        return res.rows[0][column];
      }
      catch (err) {
        client.handle(new DBError(query, err), 'select');
      }
    }

    async selectAll(primaryKey){
      const query = `SELECT * FROM ${this.name} WHERE "${this.mainColumn}" = $1`;
      return client.db.query(query, [primaryKey]);
    }

    async math(primaryKey, oldValue, modifier, column) {
      const query = `UPDATE ${this.name} SET "${column}" = $2 WHERE "${this.mainColumn}" = $1`;
      try {
          const newValue = oldValue ? `"${column}" + ${modifier}` : modifier;
          client.db.query(query, [primaryKey, newValue])
            .catch(e=>{client.handle(new DBError(query, e), 'math')});
      }
      catch (err) {
        client.handle(new DBError(query, err), 'math')
      }
    };

    async selectSearchArray(value, column) {
      const query = `SELECT * FROM ${this.name} WHERE $1 = ANY "${column}"`;
      return client.db.query(query, [value]);
    }

    async searchArray(primaryKey, value, column){
      const query = `SELECT * FROM ${this.name} WHERE "${this.mainColumn}" = $1 AND $2 = ANY "${column}"`
      try {
        const res = await client.db.query(query, [primaryKey, value]);
        if(res && res.rows && res.rows.length > 0) return res.rows[0];
        else return false;
      } catch(err) {
        client.handle(new DBError(query, err), 'searchArray');
      }
    }

    async levenshtein(primaryKey){
      const query = `SELECT *, levenshtein($1, ${this.mainColumn}) AS lv FROM ${this.name} WHERE lv <= 2 ORDER BY lv LIMIT 2`;
      try {
        const villagers = await (client.db.query(query, [primaryKey]));
        if(!villagers || !villagers.rows || villagers.rows.length < 1) return null;
        if(villagers.rows.length > 1 && villagers.rows[0].lv === villagers.rows[1].lv) return null;
        return villagers.rows[0];
      } catch(err) {client.handle(new DBError(query, err), 'levenshtein')}
    }

    //
    // async find(primaryKey, wantedColumn){
    //   const column = wantedColumn ? wantedColumn : this.secondaryColumn;
    //   const [query, value] = this.writeQuery('select', primaryKey, undefined, wantedColumn);
    //   try{
    //     let res = await client.db.query(query, [primaryKey]);
    //     if(!res || res.rows.length < 1) return undefined;
    //     return res.rows[0][column] ? res.rows[0][column] : null;
    //   } catch(err) {
    //     throw new DBError(query, 'find', err);
    //   }
    // }
    //
    // async insert(vals, cols){
    //   const columns = cols ? cols.join('", "') : this.secondaryColumn;
    //   const values = vals.map((x, i) => `$${i+1}`).join(', ');
    //   const query = `INSERT INTO ${this.name} ("${this.mainColumn}", "${columns}") VALUES (${values})`;
    //   await client.db.query(query, values)
    //     .catch(err => throw new DBError(query, 'insert', err))
    // }
    //
    // async update(primaryKey, value, col, valCall){
    //   const column = col ? col : this.secondaryColumn;
    //
    //   const valueCall = valCall ? valCall : '$1';
    //   const query = `UPDATE ${this.name} SET "${column}" = $2 WHERE "${this.mainColumn}" = ${valueCall}`;
    //   await client.db.query(query, [primaryKey, value])
    //     .catch(err => throw new DBError(query, 'update', err))
    // }
    //
    // async ensure(primaryKey, column, defaultValue){
    //   try {
    //     let result = await this.find(primaryKey, column);
    //     if(!result) {
    //       if (result === undefined) await this.insert([primaryKey, defaultValue], [column]);
    //       else if (result === null) await this.update(primaryKey, defaultValue, column);
    //       re9sult = defaultValue;
    //     }
    //     return result;
    //   } catch(err) {
    //     throw err;
    //   }
    // }
    //
    // async getArray(col){
    //   const column = col ? col : this.mainColumn;
    //   const query = `SELECT "${column}" FROM ${this.name}`;
    //   try {
    //     const resultArray = [];
    //     let res = await client.db.query(query);
    //     res.rows.forEach(row => {
    //       resultArray.push(row[column]);
    //     });
    //     return resultArray;
    //   } catch(err) {
    //     throw new DBError(query, 'getArray', err);
    //   }
    // }
    //
    // async write(primaryKey, newValue, column, valueCall){
    //   try {
    //     const update = await this.doesItExist(primaryKey, column);
    //     if (update) await this.update(primaryKey, newValue, column, valueCall);
    //     else await this.insert([primaryKey, newValue], [column]);
    //   }
    //   catch(err) {
    //     throw err;
    //   }
    // }
    //
    // async doesItExist(primaryKey, column){
    //   const query = `SELECT "${column}" FROM ${this.name} WHERE "${this.mainColumn}" = $1`;
    //   try {
    //     const res = client.db.query(query, [primaryKey]);
    //     if (!res || !res.rows || res.rows.length < 1) return null;
    //     return res.rows[0][column];
    //   }
    //   catch(err) {
    //     throw new DBError(query, 'doesItExist', err)
    //   }
    // }
    //
    // async pushToArray(primaryKey, newValue, column){
    //   try{
    //     const exist = await this.doesItExist(primaryKey, column);
    //     if(exist === null) await this.insert([primaryKey, `{${newValue}}`], [column]);
    //     else if(exist === false) await this.update(primaryKey, `{${newValue}}`, column);
    //     else if(exist) await this.update(primaryKey, `"${column}"||'${JSON.stringify(newValue)}'`, column);
    //   }
    //   catch(err) {
    //     throw err;
    //   }
    // }
    //
    // async removeFromArray(primaryKey, oldValue, column)
    //
    // push(mainID, newValue, column) {
    //   return this.query(`UPDATE ${this.name} SET "${column}" = "${column}"||'${JSON.stringify(newValue)}'`, mainID);
    // };
    //
    // remove(mainID, toRemove, column) {
    //   return this.query(`UPDATE ${this.name} SET "${column}" = array_remove("${column}", '${toRemove}')`, mainID);
    // };
    //
    // has(mainID) {
    //   return this.query(`SELECT * FROM ${this.name}`, mainID).rows === null;
    // };
    //
    // delete(mainID, column) {
    //   if (!column) return this.query(`DELETE FROM ${this.name}`, mainID);
    //   return this.query(`UPDATE ${this.name} SET "${column}" = null`, mainID);
    // };
    //
    // setProp(mainID, column, value) {
    //   if (value === []) return this.query(`UPDATE ${this.name} SET "${column}" = null`, mainID);
    // };
    //
    // keyArray() {
    //   const valuePairs = this.query(`select "${this.mainColumn}" from ${this.name}`);
    //   if(!valuePairs) return [];
    //   let keyArray = [];
    //   for (let row of valuePairs.rows) {
    //     keyArray.push(row[this.mainColumn]);
    //   }
    //   return keyArray;
    // };
    //
    // count() {
    //   return this.query(`SELECT COUNT("${this.mainColumn}") AS dracula FROM ${this.name}`).rows[0].dracula;
    // }
    //
    // map(method) {
    //   const table = this.query(`SELECT * FROM ${this.name}`).rows;
    //   let result = [];
    //   table.forEach(row => {
    //     result.push(method(row[this.secondaryColumn], row[this.mainColumn]))
    //   });
    //   return result;
    // };
    //
    // getProp(mainID, column) {
    //   return this.query(`SELECT "${column}" FROM ${this.name}`, mainID).rows[0];
    // };
    //
    // removeFrom(mainID, column, remove) {
    //   return this.remove(mainID, remove, column);
    // };
    //
    // pushIn(mainID, column, newValue) {
    //   return this.push(mainID, newValue, column);
    // };
    //
    // dec(mainID) {
    //   this.math(mainID, "-", "1", this.secondaryColumn);
    // };
    //
    // inc(mainID) {
    //   this.math(mainID, "+", "1", this.secondaryColumn);
    // };
    //
    // sweep(method) {
    //   this.keyArray().forEach((key, index) => {
    //     if (method(index, key)) this.delete(key);
    //   });
    // };
    //
    //
    // randomKey() {
    //   const theWholeDamnDB = this.query(`SELECT "${this.mainColumn}" FROM ${this.name}`);
    //   return theWholeDamnDB[Math.floor(Math.random() * theWholeDamnDB.rows.length)];
    // };
  }
};