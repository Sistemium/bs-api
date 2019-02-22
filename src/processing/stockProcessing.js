import log from 'sistemium-telegram/services/log';

import Anywhere from '../lib/anywhere';

import Stock from '../mongo/model/Stock';

const { debug, error } = log('stockProcessing');

let busy = false;

export default async function processing() {

  const site = 1;

  if (busy) {
    debug('busy');
    return;
  }

  busy = true;

  try {

    const { timestamp } = await Stock.findOne({ site }).sort({ timestamp: -1 });

    debug('timestamp', timestamp);

    const data = await Stock.find({ timestamp, site });

    debug('data', data.length);

    const conn = new Anywhere();

    await conn.connect();

    await exportStock(site, conn, data);

    await conn.disconnect();

  } catch (e) {
    busy = false;
    error(e.message || e);
  }

  busy = false;

}


async function exportStock(site, conn, stockData) {

  const declare = `declare local temporary table #stock (
    site IDREF,
    stock INT, 
    price PRICE, 
    priceAgent PRICE, 
    newMark INT null,
    articleId GUID
  )`;

  const insert = `insert into #stock (
    site, stock, price, priceAgent, newMark, articleId
  ) values (?, ?, ?, ?, ?, ?)`;

  const merge = `merge into bs.WarehouseArticle as d using with auto name (
    select
      s.site,
      a.id as article,
      s.stock,
      s.price,
      s.priceAgent,
      s.site as warehouse,
      s.newMark
    from #stock s
      join bs.ArticleTable a on a.xid = s.articleId
  ) as t on t.site = d.site and t.article = d.article
  when not matched then insert
  when matched and d.stock <> t.stock or d.newMark <> t.newMark then update
  `;

  const nullify = `update bs.WarehouseArticle 
    set stock = 0
    from bs.ArticleTable a
    where a.id = WarehouseArticle.article
      and site = ?
      and stock <> 0 
      and a.xid not in (
        select articleId from #stock
      )
  `;

  const values = stockData.map(s => [
    s.site,
    s.volume,
    s.price,
    s.priceAgent,
    s.newMark === undefined ? -1 : s.newMark,
    s.articleId,
  ]);

  try {

    await conn.execImmediate(declare);

    await conn.execImmediate(insert, values);

    const merged = await conn.execImmediate(merge);

    debug('merged', merged || 0);

    const nullified = await conn.execImmediate(nullify, [site]);

    debug('nullified', nullified || 0);

    await conn.commit();

  } catch (e) {
    await conn.rollback();
    throw e;
  }

}
