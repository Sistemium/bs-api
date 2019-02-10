import log from 'sistemium-telegram/services/log';
import each from 'lodash/each';
import map from 'lodash/map';
import orderBy from 'lodash/orderBy';

import { whilstAsync } from 'sistemium-telegram/services/async';

import EgaisMark from '../mongo/model/EgaisMark';
import ArticleDoc from '../mongo/model/ArticleDoc';

const { debug, error } = log('marksProcessing');

export default async function (processBox, writeDocId) {

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

    each(operations, ({ timestamp, quantity, egaisBoxId }) => {

      sumQuantity += quantity;

      if (quantity === 1 && timestamp > lastTimestamp) {

        lastTimestamp = timestamp;
        boxId = egaisBoxId;

      }

    });

    if (sumQuantity !== 1) {
      mark.isProcessed = true;
    } else if (!boxId) {
      error('no box for mark:', mark.id);
    } else {
      await processMark();
    }

    mark.operationsArray = orderBy(operations, ['timestamp'], ['desc']);

    await mark.save();

    mark = await cursor.next();

    async function processMark() {

      const boxProcessed = await processBox(boxId);

      if (!boxProcessed) {
        return;
      }

      const doc = await ArticleDoc.findOne({ egaisBoxIds: boxId })
        .sort('-ts');

      if (!doc) {
        return;
      }

      await writeDocId({
        articleId: doc.articleId,
        egaisMarkId: mark.id,
        site: mark.site,
        egaisBoxId: boxId,
        barcode: mark.barcode,
      });

      mark.isProcessed = true;
      // await EgaisMark.updateOne({ _id: mark.id }, { isProcessed: true });

    }

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
