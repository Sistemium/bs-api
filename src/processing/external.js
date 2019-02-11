import db from 'sqlanywhere';
import log from 'sistemium-telegram/services/log';
import { serverDateTimeFormat } from 'sistemium-telegram/services/moments';

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

      this.statements = {};
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
      cts,
    } = params;

    debug('exportPalette', id, barcode, site);

    const sql = `merge into bs.WarehousePalette as d using with auto name (
      select 
        ? as xid,
        ? as barcode,
        'stock' as processing,
        ? as site,
        ? as deviceCts
    ) as t on t.xid = d.xid
    when not matched then insert
    when matched then skip
    `;

    const prepared = await this.prepare(sql);

    const values = [id, barcode, site, serverDateTimeFormat(cts)];

    await this.exec(prepared, values);

  }

  async exportBox(params) {

    const {
      parentId,
      id,
      barcode,
      site,
      cts,
    } = params;

    debug('exportBox', id, barcode, site);

    const sql = `merge into bs.WarehouseBox as d using with auto name (
      select 
        ? as xid,
        ? as barcode,
        (select id from bs.WarehousePalette where xid = ?) as currentPalette,
        ? as site,
        'stock' as processing,
        ? as deviceCts
    ) as t on t.xid = d.xid
    when not matched then insert
    when matched then skip
    `;

    const prepared = await this.prepare(sql);

    const values = [id, barcode, parentId, site, serverDateTimeFormat(cts)];

    await this.exec(prepared, values);

  }

  async exportMark(params) {

    const {
      articleId,
      egaisMarkId,
      egaisBoxId,
      barcode,
      site,
      cts,
    } = params;

    // debug('exportMark', egaisMarkId, site);

    const sql = `merge into bs.WarehouseItem as d using with auto name (
      select 
        a.id as article,
        (select id from bs.WarehouseBox where xid = ?) as currentBox,
        ? as barcode,
        ? as xid,
        'stock' as processing,
        ? as site,
        ? as deviceCts
      from bs.ArticleTable a
      where a.xid = ?
    ) as t on t.xid = d.xid
    when not matched then insert
    when matched then skip
    `;

    const prepared = await this.prepare(sql);

    const values = [egaisBoxId, barcode, egaisMarkId, site, serverDateTimeFormat(cts), articleId];

    await this.exec(prepared, values);

    // return this.commit();

  }

  async exec(prepared, values) {

    return new Promise((resolve, reject) => {

      prepared.exec(values, async (err, res) => {

        if (!err) {
          // debug('exec', res);
          await this.commit();
          resolve(res);
        } else {
          error('exec', err);
          this.connection.rollback();
          reject(err);
        }

      });

    });

  }

  async dropPrepared(sql) {

    const prepared = this.statements[sql];

    if (!prepared) {
      return false;
    }

    return new Promise((resolve, reject) => {

      delete this.statements[sql];

      prepared.drop(err => {

        if (!err) {
          resolve(true);
        } else {
          error('exec', err);
          reject(err);
        }

      });

    });

  }

}
