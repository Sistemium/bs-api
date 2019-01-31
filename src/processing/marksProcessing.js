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

  await unprocessMarks();

  const query = EgaisMark.find({ isProcessed: { $ne: true } });
  const cursor = query.cursor();

  let mark = await cursor.next();

  if (!mark) {
    debug('no marks to process');
    return;
  }

  const count = await query.countDocuments();

  debug('marks to process', count);

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

      debug('ignore', mark.id);
      await EgaisMark.updateOne({ _id: mark.id }, { isProcessed: true });

    } else if (!boxId) {
      error('no box id');
    } else {

      debug('test');

      await processBox(boxId);

      const doc = await ArticleDoc.findOne({ egaisBoxIds: boxId })
        .sort('-ts');

      if (doc) {

        await writeDocId({
          articleId: doc.articleId,
          egaisMarkId: mark.id,
          egaisBoxId: boxId,
          barcode: mark.barcode,
        });

        await EgaisMark.updateOne({ _id: mark.id }, { isProcessed: true });

      }

    }

    mark = await cursor.next();

  });

}


async function unprocessMarks() {

  const marks = await EgaisMark.aggregate([
    {
      $match: { isProcessed: true },
    },
    {
      $limit: 50000,
    },
    {
      $project: { o: { $objectToArray: '$operations' } },
    },
    {
      $project: {
        operationsCount: {
          $cond: {
            if: { $isArray: '$o' },
            then: { $size: '$o' },
            else: 0,
          },
        },
        operations: '$o.v',
      },
    },
    {
      $match: { operationsCount: { $gt: 1 } },
    },
    {
      $limit: 5,
    },
    { $project: { _id: 1 } },
  ]);

  const idsToUpdate = map(marks, '_id');

  debug('marks', idsToUpdate);

  const filter = { _id: { $in: idsToUpdate } };

  await EgaisMark.updateMany(filter, { $set: { isProcessed: false } });

}
