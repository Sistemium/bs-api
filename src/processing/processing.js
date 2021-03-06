import log from 'sistemium-telegram/services/log';
import EgaisBox from '../mongo/model/EgaisBox';
import External from './external';

const { debug, error } = log('processing');

const { SQLA_CONNECTION } = process.env;

export const externalDb = new External(SQLA_CONNECTION);

export async function processBox(boxId) {

  const box = await EgaisBox.findOne({ _id: boxId });

  if (!box) {
    error('no box with id: ', boxId);
    throw Error(`no box with id: ${boxId}`);
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
