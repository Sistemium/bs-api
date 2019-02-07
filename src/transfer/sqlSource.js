import external from '../processing/external';

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

    return this.exec(prepared, values);

  }

}

export default new SqlSource(SQLA_CONNECTION);

export const columns = {
  EgaisMark: ['barcode', 'xid as id', 'egaisArticleId', 'site'],
};
