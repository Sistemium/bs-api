import map from 'lodash/map';
import log from 'sistemium-telegram/services/log';
import { eachSeriesAsync } from 'sistemium-telegram/services/async';

import EgaisBox from '../mongo/model/EgaisBox';
import EgaisMark from '../mongo/model/EgaisMark';

const { debug } = log('processAll');

const palettes = [
];


export default async function () {

  await eachSeriesAsync(palettes, async paletteId => {

    const boxes = await EgaisBox.find({ parentId: paletteId });

    const cond = { 'operationsArray.egaisBoxId': { $in: map(boxes, '_id') } };

    const res = await EgaisMark.updateMany(cond, { $set: { isProcessed: false } });

    debug(res);

  });


}
