import mongoose from 'mongoose';

import { merge } from '../extentions';

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

  const ops = [];

  const cts = new Date();

  items.forEach(item => {

    const key = `operations.${item.documentId}`;

    ops.push(
      {
        updateOne: {
          filter: { _id: item.egaisMarkId },
          update: {
            $set: {
              [key]: item,
              isProcessed: false,
            },
            $setOnInsert: {
              cts,
            },
            $currentDate: { ts: true },
          },
          upsert: true,
        },
      },
    );
  });

  return model.bulkWrite(ops, { ordered: false });

}
