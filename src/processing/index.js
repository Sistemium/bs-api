import log from 'sistemium-telegram/services/log';

import EgaisBox from '../mongo/model/EgaisBox';
import { connect, disconnect } from '../mongo';

import marksProcessing from './marksProcessing';
import External from './external';

const { debug, error } = log('processing');

const externalDb = new External(process.env.SQLA_CONNECTION);

debug('start');

marksProcessing(processBox, externalDb.exportMark)
  .then(() => {
    debug('finish');
    return disconnect();
  })
  .catch(e => error(e));

connect()
  .then(() => {
    debug('connected');
  });

externalDb.connect()
  .then(() => {
    debug('external db connected');
    return externalDb.disconnect();
  })
  .catch(error);

async function processBox(boxId) {

  const box = await EgaisBox.findOne({ _id: boxId });

  if (!box) {

    debug('no box with id: ', boxId);

    return;

  }

  if (box.parentId) {

    await processBox(box.parentId);

  }

  debug('processBox', box.barcode);

}
