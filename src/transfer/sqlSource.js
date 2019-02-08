import log from 'sistemium-telegram/services/log';
import external from '../processing/external';

// eslint-disable-next-line
const { debug, error } = log('transfer');

const { SQLA_CONNECTION } = process.env;

class SqlSource extends external {

  // constructor(options) {
  //   super(options);
  // }

  async getData(table, pageSize, startAt, columns) {

    const sql = `
      select top ? start at ? ${columns.join(',')} 
      from c1.${table}
      order by ts, id`;

    const prepared = await this.prepare(sql);

    const values = [pageSize, startAt];

    const data = this.exec(prepared, values);

    await this.dropPrepared(sql);

    return data;

  }

}

export default new SqlSource(SQLA_CONNECTION);

export const columns = {
  EgaisMark: ['barcode', 'xid as id', 'egaisArticleId', 'site'],
  ArticleDoc: [
    'xid as id',
    'site',
    'articleId',
    'egaisArticleId',
    'egaisDocumentId',
    'dateProduction',
    'quantity',
    'barcodes',
    'egaisBoxIds',
  ],
  EgaisMarkOperation: [
    'xid as id',
    'site',
    'egaisMarkId',
    'documentId',
    'type',
    'egaisBoxId',
    'timestamp',
    'quantity',
  ],
};
