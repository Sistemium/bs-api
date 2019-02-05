import db from 'sqlanywhere';
import log from 'sistemium-telegram/services/log';

// eslint-disable-next-line
const { debug, error } = log('processing:external');

export default class {

  constructor(connParams) {
    this.connParams = connParams;
    this.connection = db.createConnection();
    this.statements = {};
    debug(process.env.SQLANY16);
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.connection.connect(this.connParams, err => {
        debug('connected', !err);
        if (!err) {
          resolve();
        } else {
          error('connected', err);
          reject(err);
        }
      });
    });
  }

  async disconnect() {
    return new Promise((resolve, reject) => {
      this.connection.disconnect(err => {
        debug('disconnect', !err);
        if (!err) {
          resolve();
        } else {
          error('disconnect', err);
          reject(err);
        }
      });
    });
  }

  async prepare(sql) {

    const prepared = this.statements[sql];

    if (prepared) {
      return prepared;
    }

    return new Promise((resolve, reject) => {
      this.connection.prepare(sql, (err, stmt) => {
        if (!err) {
          this.statements[sql] = stmt;
          resolve(stmt);
        } else {
          error('prepare', err);
          reject(err);
        }
      });
    });

  }

  async commit() {

    return new Promise((resolve, reject) => {
      this.connection.commit(err => {
        if (!err) {
          resolve();
        } else {
          error('commit', err);
          reject(err);
        }
      });
    });

  }

  async exportPalette(params) {

    const {
      id,
      barcode,
      site,
    } = params;

    debug('exportPalette', id, barcode, site);

    const sql = `merge into bs.WarehousePalette as d using with auto name (
      select 
        ? as xid,
        ? as barcode,
        now() as deviceCts,
        'new' as processing,
        ? as site
    ) as t on t.xid = d.xid
    when not matched then insert
    when matched then update
    `;

    const prepared = await this.prepare(sql);

    const values = [id, barcode, site];

    await exec(prepared, values);

    return this.commit();

  }

  async exportBox(params) {

    const {
      parentId,
      id,
      barcode,
      site,
    } = params;

    debug('exportBox', id, barcode, parentId, site);

    const sql = `merge into bs.WarehouseBox as d using with auto name (
      select 
        ? as xid,
        ? as barcode,
        (select id from bs.WarehousePalette where xid = ?) as currentPalette,
        now() as deviceCts,
        'new' as processing,
        ? as site
    ) as t on t.xid = d.xid
    when not matched then insert
    when matched then update
    `;

    const prepared = await this.prepare(sql);

    const values = [id, barcode, parentId, site];

    await exec(prepared, values);

    return this.commit();

  }

  async exportMark(params) {

    const {
      articleId,
      egaisMarkId,
      egaisBoxId,
      barcode,
      site,
    } = params;

    debug('exportMark', articleId, egaisMarkId, egaisBoxId, barcode, site);

    const sql = `merge into bs.WarehouseItem as d using with auto name (
      select 
        a.id as article,
        (select id from bs.WarehouseBox where xid = ?) as currentBox,
        ? as barcode,
        ? as xid,
        now() as deviceCts,
        'new' as processing,
        ? as site
      from bs.ArticleTable a
      where a.xid = ?
    ) as t on t.xid = d.xid
    when not matched then insert
    when matched then update
    `;

    const prepared = await this.prepare(sql);

    const values = [egaisBoxId, barcode, egaisMarkId, site, articleId];

    await exec(prepared, values);

    return this.commit();

  }

}

async function exec(prepared, values) {

  return new Promise((resolve, reject) => {

    prepared.exec(values, (err, res) => {

      if (!err) {
        // debug('exec', res);
        resolve(res);
      } else {
        error('exec', err);
        reject(err);
      }

    });

  });

}
