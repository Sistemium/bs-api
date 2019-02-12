import log from 'sistemium-telegram/services/log';
import each from 'lodash/each';
import map from 'lodash/map';
import orderBy from 'lodash/orderBy';

import { eachSeriesAsync } from 'sistemium-telegram/services/async';

import EgaisMark from '../mongo/model/EgaisMark';
import ArticleDoc from '../mongo/model/ArticleDoc';

const { debug, error } = log('marksProcessing');

const PROCESSING_LIMIT = parseInt(process.env.PROCESSING_LIMIT || 1000, 0);
const PROCESSING_REPORT_COUNT = parseInt(process.env.PROCESSING_REPORT_COUNT || 10, 0);

/* eslint-disable no-param-reassign */

export default async function (processBox, exportMark) {

  debug('start batch size', PROCESSING_LIMIT);

  // await unprocessMarks();

  const marks = await EgaisMark.find({ isProcessed: false })
    .batchSize(PROCESSING_LIMIT)
    .sort('ts')
    .hint('egaisMarksProcessingTs')
    .limit(PROCESSING_LIMIT);

  // const cursor = query.cursor();

  // let mark = await cursor.next();

  if (!marks.length) {
    debug('no marks to process');
    return;
  }

  // const count = await query.countDocuments();
  const countTotal = await EgaisMark.countDocuments({ isProcessed: false });

  debug('total marks to process:', countTotal);

  let sumIgnoreCount = 0;
  let processedCount = 0;
  let lastReportedCount = 0;

  await eachSeriesAsync(marks, processor);

  debug('finish', processedCount, sumIgnoreCount);

  async function processor(mark) {

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

    } else if (!boxId) {

      error(`no box for mark: ${mark.id}`);

      mark.processingError = 'NoBox';
      mark.isProcessed = true;

      processedCount += 1;

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

    if (lastReportedCount + PROCESSING_REPORT_COUNT <= nextCount) {
      debug('progress', nextCount);
      lastReportedCount = nextCount;
    }

    // mark = await cursor.next();

    async function processMark() {

      const boxProcessed = await processBox(boxId);

      if (!boxProcessed) {

        error(`box not processed ${boxId}`);

        mark.processingError = 'NotProcessedBox';
        mark.isProcessed = true;

        return;
      }

      let { articleId } = boxProcessed;

      if (!articleId) {

        const doc = await ArticleDoc.findOne({ egaisBoxIds: boxId })
          .sort('ts');

        if (!doc) {

          error(`no ArticleDoc ${boxId}`);

          mark.processingError = 'NoArticleDoc';
          mark.isProcessed = true;

          return;

        }

        articleId = doc.articleId; // eslint-disable-line
        boxProcessed.articleId = articleId;

        await boxProcessed.save();

      }

      if (!articleId) {

        error(`no articleId ${boxId}`);
        mark.processingError = 'NoArticleId';
        mark.isProcessed = true;

        return;
      }

      await exportMark({
        articleId,
        egaisMarkId: mark.id,
        site: mark.site,
        egaisBoxId: boxId,
        barcode: mark.barcode,
      });

      mark.processingError = undefined;
      mark.isProcessed = true;

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
