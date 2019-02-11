import mongoose from 'mongoose';
import { merge } from '../extentions';

const schema = new mongoose.Schema({
  cts: Date,
  _id: String,
  ts: {
    type: Date,
    index: true,
  },
  barcode: String,
  parentId: String,
  site: Number,
  isProcessed: Boolean,
  articleId: String,
});

schema.set('toJSON', {
  virtuals: true,
  transform(doc, ret) { delete ret._id; } // eslint-disable-line
});

schema.index({ ts: -1 });

schema.statics.merge = merge;

export default mongoose.model('EgaisBox', schema);
