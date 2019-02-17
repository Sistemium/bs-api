import log from 'sistemium-telegram/services/log';
import mongoose from 'mongoose';
import groupBy from 'lodash/groupBy';
import map from 'lodash/map';
import keyBy from 'lodash/keyBy';
import orderBy from 'lodash/orderBy';
import mapVales from 'lodash/mapValues';

import { merge } from '../extentions';

// eslint-disable-next-line
const { debug } = log('EgaisMark');

const schema = new mongoose.Schema({
  barcode: String,
  cts: Date,
  egaisArticleId: String,
  _id: String,
  site: Number,
  ts: {
    type: Date,
    index: true,
  },
  operations: Object,
  operationsArray: Array,
  isProcessed: Boolean,
  processingError: String,
  EgaisMarkCancel: Object,
});

schema.set('toJSON', {
  virtuals: true,
  transform(doc, ret) {
    delete ret._id; // eslint-disable-line
  },
});

schema.index({ ts: -1 });
schema.index({ isProcessed: 1 });
schema.index({ processingError: 1 }, { sparse: true, name: 'egaisMarksProcessingError' });

schema.statics.merge = merge;

const model = mongoose.model('EgaisMark', schema);

export default model;

export const ERROR_NO_ARTICLE_DOC = 'NoArticleDoc';

export async function mergeCancels(items) {

  const cts = new Date();

  const byMark = groupBy(items, 'egaisMarkId');

  const ops = map(byMark, (cancels, egaisMarkId) => {

    const keys = keyBy(cancels, ({ documentId }) => `cancels.${documentId}`);

    const opKeys = keyBy(cancels, ({ documentId }) => `operations.${documentId}`);

    const $unset = mapVales(opKeys, () => 1);

    return {
      updateOne: {
        filter: { _id: egaisMarkId },
        update: {
          $set: {
            ...keys,
            isProcessed: false,
          },
          $unset,
          $setOnInsert: {
            cts,
          },
          $currentDate: { ts: true },
        },
        upsert: true,
      },
    };

  });

  debug('mergeCancels', ops.length);

  const sortedOps = orderBy(ops, ['updateOne.filter._id'], ['asc']);

  return model.bulkWrite(sortedOps, { ordered: false });
}

export async function mergeOperations(items) {

  const cts = new Date();

  const byMark = groupBy(items, 'egaisMarkId');

  const ops = map(byMark, (operations, egaisMarkId) => {

    const keys = keyBy(operations, ({ documentId }) => `operations.${documentId}`);

    return {
      updateOne: {
        filter: { _id: egaisMarkId },
        update: {
          $set: Object.assign(keys, { isProcessed: false }),
          $setOnInsert: {
            cts,
          },
          $currentDate: { ts: true },
        },
        upsert: true,
      },
    };

  });

  debug('mergeOperations', ops.length);

  const sortedOps = orderBy(ops, ['updateOne.filter._id'], ['asc']);

  return model.bulkWrite(sortedOps, { ordered: false });

}
