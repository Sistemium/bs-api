import debounce from 'lodash/debounce';
import log from 'sistemium-telegram/services/log';

import * as mongo from '../mongo';
import ArticleDoc from '../mongo/model/ArticleDoc';
import EgaisBox from '../mongo/model/EgaisBox';
import EgaisMark from '../mongo/model/EgaisMark';
import marksProcessing from './marksProcessing';
import { externalDb, processBox } from './processing';

const { debug, error } = log('watchProcessing');

mongo.connect()
  .then(() => processing())
  .catch(e => error('mongo connect error', e.message));

function processing() {

  let processStarted = false;

  const triggerProcessing = debounce(async () => {

    if (processStarted) {
      return;
    }

    processStarted = true;

    try {
      await externalDb.connect();
      debug('external db connected');

      debug('mongo connected');

      await marksProcessing(processBox, args => externalDb.exportMark(args));
      debug('finish');

      await externalDb.disconnect();

      debug('disconnected');
    } catch (e) {
      error(e);
    }

    processStarted = false;

  }, 30000);

  ArticleDoc.watch()
    .on('change', triggerProcessing);
  EgaisBox.watch()
    .on('change', triggerProcessing);
  EgaisMark.watch()
    .on('change', triggerProcessing);

}
