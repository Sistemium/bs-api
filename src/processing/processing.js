import log from 'sistemium-telegram/services/log';
import EgaisBox from '../mongo/model/EgaisBox';

const { debug, error } = log('processing');

/* eslint-disable import/prefer-default-export */

/**
 *
 * @param boxId
 * @param externalDb {ExternalDB}
 * @returns {Promise}
 */

export async function processBox(boxId, externalDb) {

  const box = await EgaisBox.findById(boxId);

  if (!box) {
    error('no box with id: ', boxId);
    return null;
  }

  if (!box.barcode) {
    // error('no barcode: ', boxId);
    return null;
  }

  const { parentId: paletteId, isProcessed } = box;

  if (isProcessed) {
    return box;
  }

  if (paletteId && paletteId !== '00000000-0000-0000-0000-000000000000') {
    await processPalette(boxId, externalDb);
  }

  await externalDb.exportBox(box);

  box.isProcessed = true;

  await box.save();

  debug('processBox', box.barcode);

  return box;

}

/**
 *
 * @param boxId
 * @param externalDb {ExternalDB}
 * @returns {Promise}
 */

async function processPalette(boxId, externalDb) {

  const palette = await EgaisBox.findById(boxId);

  if (!palette) {
    error('processPalette', 'no id: ', boxId);
    return null;
  }

  if (palette.isProcessed) {
    return null;
  }

  await externalDb.exportPalette(palette);

  palette.isProcessed = true;

  await palette.save();

  debug('processPalette', palette.barcode);

  return palette;

}
