import { Schema, model } from 'mongoose';
import omit from 'lodash/omit';

const schema = new Schema({
  cts: Date,
  ts: Date,
  timestamp: Date,
  articleId: String,
  volume: Number,
  volumeDoc: Number,
  price: Number,
  priceAgent: Number,
  discountMax: Number,
  discountMaxDoc: Number,
  site: Number,
  newMark: Number,
});

// schema.set('toJSON', {
//   virtuals: true,
//   transform(doc, ret) {
//     delete ret._id; // eslint-disable-line
//   },
// });

schema.statics.merge = merge;

schema.index({ site: 1, articleId: 1 });

export default model('Stock', schema);

async function merge(items, defaults) {

  const cts = new Date();

  const ops = items.map(item => {

    const { articleId, site = defaults.site } = item;
    const $set = omit(item, ['_id', 'id', 'ts', 'cts']);

    $set.timestamp = cts;

    return {
      updateOne: {
        filter: { articleId, site },
        update: {
          $set,
          $currentDate: { ts: true },
          $setOnInsert: { cts },
        },
        upsert: true,
      },
    };

  });

  return this.bulkWrite(ops, { ordered: false });

}
