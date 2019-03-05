import log from 'sistemium-telegram/services/log';
import { serverDateTimeFormat } from 'sistemium-telegram/services/moments';
import SQL from 'sql-template-strings';

import Anywhere from '../lib/anywhere';

const { debug } = log('processing:external');

export default class ExternalDB extends Anywhere {

  async exportPalette(params) {

    const {
      id,
      barcode,
      site,
      cts,
    } = params;

    debug('exportPalette', id, barcode, site);

    const sql = SQL`merge into bs.WarehousePalette as d using with auto name (
      select 
        ${id} as xid,
        ${barcode} as barcode,
        'stock' as processing,
        ${site} as site,
        ${serverDateTimeFormat(cts)} as deviceCts
    ) as t on t.xid = d.xid
    when not matched then insert
    when matched then skip
    `;

    const prepared = await this.prepare(sql.query);

    await this.exec(prepared, sql.values);

  }

  async exportPaletteBoxes(paletteId, boxIds) {

    const sql = `merge into bs.WarehouseBox as d using with auto name (
      select 
        id,
        (select id from bs.WarehousePalette where xid = ?) as currentPalette
      from bs.WarehouseBox
      where xid in (${boxIds.map(() => '?').join(',')})
    ) as t on t.id = d.id
    when matched
        and d.processing = 'stock' 
        and d.currentPalette is null 
        and t.currentPalette is not null
      then update set currentPalette = t.currentPalette
    `;

    const count = await this.execImmediate(sql, [paletteId, ...boxIds]);

    debug('exportPaletteBoxes:', count || 0, 'of', boxIds.length);

    if (count) {
      await this.commit();
    }

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

    const sql = SQL`merge into bs.WarehouseBox as d using with auto name (
      select 
        ${id} as xid,
        ${barcode} as barcode,
        (select id from bs.WarehousePalette where xid = ${parentId}) as currentPalette,
        ${site} as site,
        'stock' as processing,
        ${serverDateTimeFormat(cts)} as deviceCts
    ) as t on t.xid = d.xid
    when not matched then insert
    when matched
        and d.processing = 'stock' 
        and d.currentPalette is null 
        and t.currentPalette is not null
      then update set currentPalette = t.currentPalette
    `;

    const prepared = await this.prepare(sql.query);

    await this.exec(prepared, sql.values);

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

    const sql = SQL`merge into bs.WarehouseItem as d using with auto name (
      select 
        (select id from bs.ArticleTable where xid = ${articleId}) as article,
        (select id from bs.WarehouseBox where xid = ${egaisBoxId}) as currentBox,
        ${barcode} as barcode,
        ${egaisMarkId} as xid,
        'stock' as processing,
        ${site} as site,
        ${serverDateTimeFormat(cts)} as deviceCts
    ) as t on t.xid = d.xid
    when not matched then insert
    when matched and d.article <> t.article then
      update set article = t.article
    `;

    const prepared = await this.prepare(sql.query);

    await this.exec(prepared, sql.values);

  }

}
