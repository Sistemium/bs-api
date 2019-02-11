import log from 'sistemium-telegram/services/log';

import * as mongo from '../mongo';

import marksProcessing from './marksProcessing';
import { processBox } from './processing';

const { debug, error } = log('processAll');

debug('start');

processAll()
  .then(() => debug('done'))
  .catch(err => error(err.message));

async function processAll(externalDb) {

  await externalDb.connect();
  debug('external db connected');

  await mongo.connect();
  debug('mongo connected');

  await marksProcessing(processBox, args => externalDb.exportMark(args));
  debug('finish');

  await mongo.disconnect();
  await externalDb.disconnect();

  debug('disconnected');

}
