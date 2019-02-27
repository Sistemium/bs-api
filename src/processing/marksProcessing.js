import log from 'sistemium-telegram/services/log';
import each from 'lodash/each';
import map from 'lodash/map';
import filter from 'lodash/filter';
import orderBy from 'lodash/orderBy';

import { eachSeriesAsync } from 'sistemium-telegram/services/async';

import EgaisMark, * as em from '../mongo/model/EgaisMark';
import ArticleDoc from '../mongo/model/ArticleDoc';
import EgaisBox from '../mongo/model/EgaisBox';

import { processPalette } from './processing';

const { debug, error } = log('marksProcessing');

const PROCESSING_LIMIT = parseInt(process.env.PROCESSING_LIMIT || 50, 0);
const PROCESSING_REPORT_COUNT = parseInt(process.env.PROCESSING_REPORT_COUNT || 10, 0);

const PROCESSING_LIMIT_PALETTE = parseInt(process.env.PROCESSING_LIMIT_PALETTE || 50, 0);

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
  let erroredCount = 0;
  let lastReportedCount = 0;

  await eachSeriesAsync(marks, processor);

  debug('finish', `processed:${processedCount} ignored:${sumIgnoreCount} errored:${erroredCount}`);

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

      error('no box for markId', mark.id);

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

    if (mark.processingError) {
      erroredCount += 1;
    } else {
      mark.errorDescription = undefined;
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

        error('not processed boxId:', boxId);

        mark.processingError = 'NotProcessedBox';
        mark.isProcessed = true;

        return;
      }

      let { articleId } = boxProcessed;

      if (!articleId) {

        const doc = await ArticleDoc.findOne({ egaisBoxIds: boxId })
          .sort('ts');

        if (!doc) {

          error('no ArticleDoc for boxId:', boxId);

          mark.processingError = em.ERROR_NO_ARTICLE_DOC;
          mark.isProcessed = true;

          return;

        }

        articleId = doc.articleId; // eslint-disable-line
        boxProcessed.articleId = articleId;

        await boxProcessed.save();

      }

      if (!articleId) {

        error('no articleId for boxId:', boxId);
        mark.processingError = 'NoArticleId';
        mark.isProcessed = true;

        return;
      }

      try {
        await exportMark({
          articleId,
          egaisMarkId: mark.id,
          site: mark.site,
          egaisBoxId: boxId,
          barcode: mark.barcode,
        });
        mark.processingError = undefined;
      } catch (e) {
        error('exportMark', e.code, e.text);
        mark.processingError = em.ERROR_EXPORTING;
        mark.errorDescription = e;
      }

      mark.isProcessed = true;

    }

  }

}


export async function processPalettes(externalDb) {

  const pipeline = [
    {
      $match: {
        isProcessed: null,
        barcode: { $ne: null },
        // cts: { $gt: Date.parse('2019-02-20T09:36:48.736Z') },
      },
    },
    { $sort: { ts: -1 } },
    {
      $lookup: {
        from: 'egaisboxes',
        localField: '_id',
        foreignField: 'parentId',
        as: 'boxes',
      },
    },
    {
      $addFields: {
        boxesCount: { $size: '$boxes' },
      },
    },
    {
      $match: {
        boxesCount: { $gt: 0 },
      },
    },
    { $limit: PROCESSING_LIMIT_PALETTE },
  ];

  const palettes = await EgaisBox.aggregate(pipeline);

  if (!palettes.length) {
    debug('no palettes to process');
    return;
  }

  debug('palettes to process:', palettes.length);

  // const count = await query.countDocuments();
  const countTotal = await EgaisBox.countDocuments({ isProcessed: null });

  debug('total palettes to process:', countTotal);

  // let erroredCount = 0;
  // let lastReportedCount = 0;

  await eachSeriesAsync(palettes, palettesProcessor);

  async function palettesProcessor(paletteInfo) {

    const { _id: id, boxes, ts } = paletteInfo;

    if (!id) {
      throw Error('No palette id');
    }

    debug('palettesProcessor', ts);

    const palette = await processPalette(id, externalDb);

    if (!palette) {
      error('not processed', id);
      return;
    }

    const ids = filter(map(boxes, ({ _id, isProcessed }) => isProcessed && _id));

    if (!ids.length) {
      debug('no processed boxes');
      return;
    }

    await externalDb.exportPaletteBoxes(id, ids);

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

  const query = { _id: { $in: idsToUpdate } };

  await EgaisMark.updateMany(query, { $set: { isProcessed: false } });

}
