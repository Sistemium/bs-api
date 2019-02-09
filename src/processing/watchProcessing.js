import debounce from 'lodash/debounce';
import log from 'sistemium-telegram/services/log';

import * as mongo from '../mongo';
import ArticleDoc from '../mongo/model/ArticleDoc';
import EgaisBox from '../mongo/model/EgaisBox';
import EgaisMark from '../mongo/model/EgaisMark';
import marksProcessing from './marksProcessing';
import { externalDb, processBox } from './processing';

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

  const triggerProcessing = debounce(doProcessing, WATCH_DEBOUNCE);

  ArticleDoc.watch()
    .on('change', triggerProcessing);
  EgaisBox.watch()
    .on('change', triggerProcessing);
  EgaisMark.watch()
    .on('change', triggerProcessing);

  triggerProcessing();

  async function doProcessing() {

    if (processStarted) {
      debug('exit already started');
      return;
    }

    processStarted = true;

    try {

      await externalDb.connect();
      debug('external db connected');

      await marksProcessing(processBox, args => externalDb.exportMark(args));
      debug('finish');

      await externalDb.disconnect();
      debug('external db disconnected');

    } catch (e) {
      error(e);
    }

    processStarted = false;

  }

}
