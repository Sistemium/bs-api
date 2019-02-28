import debounce from 'lodash/debounce';
import log from 'sistemium-telegram/services/log';

import * as mongo from '../mongo';
import ArticleDoc from '../mongo/model/ArticleDoc';
import EgaisBox from '../mongo/model/EgaisBox';
import EgaisMark from '../mongo/model/EgaisMark';
import Stock from '../mongo/model/Stock';
import marksProcessing from './marksProcessing';
import stockProcessing from './stockProcessing';
import { processBox } from './processing';
import ExternalDB from './external';

const { SQLA_CONNECTION } = process.env;
const { debug, error } = log('watchProcessing');
const WATCH_DEBOUNCE = parseInt(process.env.WATCH_DEBOUNCE || 10000, 0);

process.on('SIGINT', async () => {
  error('SIGINT');
  await mongo.disconnect()
    .catch(error);
  process.exit();
});

mongo.connect()
  .then(() => processing())
  .catch(e => error('mongo connect error', e.message));

function processing() {

  let processStarted = false;

  debug('debounce:', WATCH_DEBOUNCE);

  const triggerProcessing = debounce(doProcessing, WATCH_DEBOUNCE);
  const triggerStockProcessing = debounce(stockProcessing, WATCH_DEBOUNCE);

  ArticleDoc.watch()
    .on('change', triggerProcessing);
  EgaisBox.watch()
    .on('change', triggerProcessing);
  EgaisMark.watch()
    .on('change', triggerProcessing);

  Stock.watch()
    .on('change', triggerStockProcessing);

  return doProcessing()
    .then(stockProcessing);

  async function doProcessing() {

    if (processStarted) {
      debug('exit already started');
      return;
    }

    processStarted = true;

    const externalDb = new ExternalDB(SQLA_CONNECTION);

    try {


      await externalDb.connect();
      debug('external db connected');

      await marksProcessing(
        box => processBox(box, externalDb),
        args => externalDb.exportMark(args),
      );
      debug('finish');

      await externalDb.disconnect();
      debug('external db disconnected');

    } catch (e) {
      error(e);
      await externalDb.disconnect()
        .catch(error);
    }

    processStarted = false;

  }

}
