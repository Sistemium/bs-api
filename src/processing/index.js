import log from 'sistemium-telegram/services/log';

import EgaisBox from '../mongo/model/EgaisBox';
import * as mongo from '../mongo';

import marksProcessing from './marksProcessing';
import External from './external';

const { debug, error } = log('processing');

const externalDb = new External(process.env.SQLA_CONNECTION);

debug('start');

processAll()
  .then(() => debug('done'))
  .catch(err => error(err.message));


async function processAll() {

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


async function processBox(boxId) {

  const box = await EgaisBox.findOne({ _id: boxId });

  if (!box) {
    error('no box with id: ', boxId);
    // TODO: maybe throw
    return;
  }

  const { parentId: paletteId, isProcessed } = box;

  if (isProcessed) {
    return;
  }

  if (paletteId && paletteId !== '00000000-0000-0000-0000-000000000000') {
    await processPalette(boxId);
  }

  await externalDb.exportBox(box);

  await EgaisBox.updateOne({ _id: boxId }, { isProcessed: true });

  debug('processBox', box.barcode);

}

async function processPalette(boxId) {

  const box = await EgaisBox.findOne({ _id: boxId });

  if (!box) {
    error('processPalette', 'no id: ', boxId);
    return;
  }

  if (box.isProcessed) {
    return;
  }

  await externalDb.exportPalette(box);

  await EgaisBox.updateOne({ _id: boxId }, { isProcessed: true });

  debug('processPalette', box.barcode);

}
