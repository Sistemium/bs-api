import log from 'sistemium-telegram/services/log';

import * as mongo from '../mongo';
import ExternalDB from './external';

import { processPalettes } from './marksProcessing';
// import { processBox } from './processing';

const { debug, error } = log('processAll');

const { SQLA_CONNECTION } = process.env;

debug('start');

process.on('SIGINT', async () => {
  error('SIGINT');
  await mongo.disconnect()
    .catch(error);
  process.exit();
});

processAll()
  .then(() => debug('done'))
  .catch(err => error(err.message));

async function processAll() {

  const externalDb = new ExternalDB(SQLA_CONNECTION);

  await externalDb.connect();
  debug('external db connected');

  await mongo.connect();
  debug('mongo connected');

  // await marksProcessing(box => processBox(box, externalDb), args => externalDb.exportMark(args));

  await processPalettes(externalDb);

  debug('finish');

  await mongo.disconnect();
  // await externalDb.disconnect();

  debug('disconnected');

}
