import log from 'sistemium-telegram/services/log';
import mongoose from 'mongoose';
import groupBy from 'lodash/groupBy';
import map from 'lodash/map';
import keyBy from 'lodash/keyBy';
import orderBy from 'lodash/orderBy';

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
});

schema.set('toJSON', {
  virtuals: true,
  transform(doc, ret) {
    delete ret._id; // eslint-disable-line
  },
});

schema.index({ ts: -1 });
schema.index({ isProcessed: 1 });

schema.statics.merge = merge;

const model = mongoose.model('EgaisMark', schema);

export default model;

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
