import db from 'sqlanywhere';
import log from 'sistemium-telegram/services/log';

// eslint-disable-next-line
const { debug, error } = log('processing:external');

export default class {

  constructor(connParams) {
    this.connParams = connParams;
    this.connection = db.createConnection();
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

  // eslint-disable-next-line
  async exportMark(params) {
    const {
      articleId,
      egaisMarkId,
      egaisBoxId,
      barcode,
    } = params;
    debug('exportMark', articleId, egaisMarkId, egaisBoxId, barcode);
  }

}
