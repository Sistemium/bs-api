import log from 'sistemium-telegram/services/log';
import EgaisBox from '../mongo/model/EgaisBox';
import External from './external';

const { debug, error } = log('processing');

const { SQLA_CONNECTION } = process.env;

export const externalDb = new External(SQLA_CONNECTION);

export async function processBox(boxId) {

  const box = await EgaisBox.findById(boxId);

  if (!box) {
    error('no box with id: ', boxId);
    return null;
  }

  if (!box.barcode) {
    error('no barcode: ', boxId);
    return null;
  }

  const { parentId: paletteId, isProcessed } = box;

  if (isProcessed) {
    return box;
  }

  if (paletteId && paletteId !== '00000000-0000-0000-0000-000000000000') {
    await processPalette(boxId);
  }

  await externalDb.exportBox(box);

  box.isProcessed = true;

  await box.save();

  debug('processBox', box.barcode);

  return box;

}


async function processPalette(boxId) {

  const palette = await EgaisBox.findById(boxId);

  if (!palette) {
    error('processPalette', 'no id: ', boxId);
    return;
  }

  if (palette.isProcessed) {
    return;
  }

  await externalDb.exportPalette(palette);

  palette.isProcessed = true;

  await palette.save();

  debug('processPalette', palette.barcode);

}
