import log from 'sistemium-telegram/services/log';
import each from 'lodash/each';
import map from 'lodash/map';
import orderBy from 'lodash/orderBy';

import { whilstAsync } from 'sistemium-telegram/services/async';

import EgaisMark from '../mongo/model/EgaisMark';
import ArticleDoc from '../mongo/model/ArticleDoc';

const { debug, error } = log('marksProcessing');

const PROCESSING_LIMIT = parseInt(process.env.PROCESSING_LIMIT || 10000, 0);
const PROCESSING_REPORT_COUNT = parseInt(process.env.PROCESSING_REPORT_COUNT || 10, 0);

export default async function (processBox, writeDocId) {

  debug('start batch size', PROCESSING_LIMIT);

  // await unprocessMarks();

  const query = EgaisMark.find({ isProcessed: false })
    .sort('ts')
    .hint('egaisMarksProcessingTs')
    .limit(PROCESSING_LIMIT);

  const cursor = query.cursor();

  let mark = await cursor.next();

  if (!mark) {
    debug('no marks to process');
    return;
  }

  // const count = await query.countDocuments();
  const countTotal = await EgaisMark.countDocuments({ isProcessed: false });

  debug('total marks to process:', countTotal);

  let sumIgnoreCount = 0;
  let processedCount = 0;
  let lastReportedCount = 0;

  await whilstAsync(() => mark, processor);

  debug('finish', processedCount, sumIgnoreCount);

  async function processor() {

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
      sumIgnoreCount += 1;
      // debug('sumQuantity', sumQuantity);
    } else if (!boxId) {
      error('no box for mark:', mark.id);
    } else {
      await processMark();
      processedCount += 1;
    }

    mark.operationsArray = orderBy(operations, ['timestamp'], ['desc']);

    if (!mark.isProcessed) {
      mark.ts = new Date();
    }

    await mark.save();

    const nextCount = processedCount + sumIgnoreCount;

    if (lastReportedCount + PROCESSING_REPORT_COUNT < nextCount) {
      debug('progress', nextCount);
      lastReportedCount = nextCount;
    }

    mark = await cursor.next();

    async function processMark() {

      const boxProcessed = await processBox(boxId);

      if (!boxProcessed) {
        error('box not processed', boxId);
        return;
      }

      let { articleId } = boxProcessed;

      if (!articleId) {

        const doc = await ArticleDoc.findOne({ egaisBoxIds: boxId })
          .sort('ts');

        if (!doc) {
          error('no ArticleDoc', boxId);
          return;
        }

        articleId = doc.articleId; // eslint-disable-line
        boxProcessed.articleId = articleId;

        await boxProcessed.save();

      }

      if (!articleId) {
        error('no articleId', boxId);
        return;
      }

      await writeDocId({
        articleId,
        egaisMarkId: mark.id,
        site: mark.site,
        egaisBoxId: boxId,
        barcode: mark.barcode,
      });

      mark.isProcessed = true;
      // await EgaisMark.updateOne({ _id: mark.id }, { isProcessed: true });

    }

  }

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
