import log from 'sistemium-telegram/services/log';

import * as mongo from '../mongo';

import marksProcessing from './marksProcessing';
import { processBox } from './processing';

import ExternalDB from './external';

const { debug, error } = log('processAll');

const { SQLA_CONNECTION } = process.env;

debug('start');

processAll()
  .then(() => debug('done'))
  .catch(err => error(err.message));

async function processAll() {

  const externalDb = new ExternalDB(SQLA_CONNECTION);

  await externalDb.connect();
  debug('external db connected');

  await mongo.connect();
  debug('mongo connected');

  await marksProcessing(box => processBox(box, externalDb), args => externalDb.exportMark(args));
  debug('finish');

  await mongo.disconnect();
  await externalDb.disconnect();

  debug('disconnected');

}
