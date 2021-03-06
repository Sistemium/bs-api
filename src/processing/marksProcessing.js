import log from 'sistemium-telegram/services/log';
import each from 'lodash/each';
import map from 'lodash/map';
import { whilstAsync } from 'sistemium-telegram/services/async';

import EgaisMark from '../mongo/model/EgaisMark';
import ArticleDoc from '../mongo/model/ArticleDoc';

// const mongoose = require('mongoose');

const { debug, error } = log('marksProcessing');

export default async function (processBox, writeDocId) {

  // mongoose.set('debug', true);
  debug('start');

  // await unprocessMarks();

  const query = EgaisMark.find({ isProcessed: { $ne: true } }).sort('-ts');
  const cursor = query.cursor();

  let mark = await cursor.next();

  if (!mark) {
    debug('no marks to process');
    return;
  }

  const count = await query.countDocuments();

  debug('marks to process:', count);

  await whilstAsync(() => mark, async () => {

    const { operations } = mark;

    let sumQuantity = 0;
    let boxId = null;
    let lastTimestamp = '';

    each(operations, operation => {

      sumQuantity += operation.quantity;

      if (operation.quantity === 1 && operation.ts > lastTimestamp) {

        lastTimestamp = operation.ts;
        boxId = operation.egaisBoxId;

      }

    });

    if (sumQuantity !== 1) {

      // debug('ignore', mark.id);
      await EgaisMark.updateOne({ _id: mark.id }, { isProcessed: true });

    } else if (!boxId) {
      error('no box id');
    } else {

      await processBox(boxId);

      const doc = await ArticleDoc.findOne({ egaisBoxIds: boxId })
        .sort('-ts');

      if (doc) {

        await writeDocId({
          articleId: doc.articleId,
          egaisMarkId: mark.id,
          site: mark.site,
          egaisBoxId: boxId,
          barcode: mark.barcode,
        });

        await EgaisMark.updateOne({ _id: mark.id }, { isProcessed: true });

      }

    }

    mark = await cursor.next();

  });

}

// eslint-disable-next-line
async function unprocessMarks() {

  const marks = await EgaisMark.aggregate([
    {
      $match: { isProcessed: true },
    },
    { $addFields: { operations: { $objectToArray: '$operations' } } },
    { $addFields: { operations: '$operations.v' } },
    {
      $addFields: {
        sum: { $sum: '$operations.quantity' },
      },
    },

    { $match: { sum: { $eq: 1 } } },

    { $limit: 100000 },
    { $unwind: '$operations' },
    { $match: { 'operations.quantity': 1 } },
    { $sort: { 'operations.ts': -1 } },
    {
      $group: {
        _id: '$_id',
        egaisBoxId: { $first: '$operations.egaisBoxId' },
      },
    },
    {
      $lookup: {
        from: 'articledocs',
        localField: 'egaisBoxId',
        foreignField: 'egaisBoxIds',
        as: 'articledocs',
      },
    },
    {
      $addFields: {
        articledocsCount: {
          $size: '$articledocs',
        },
      },
    },
    {
      $match: {
        articledocsCount: {
          $gt: 0,
        },
      },
    },
  ]);

  const idsToUpdate = map(marks, '_id');

  debug('marks', idsToUpdate);

  const filter = { _id: { $in: idsToUpdate } };

  await EgaisMark.updateMany(filter, { $set: { isProcessed: false } });

}
