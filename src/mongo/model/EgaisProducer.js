import mongoose from 'mongoose';
import { merge } from '../extentions';

const schema = new mongoose.Schema({
  cts: Date,
  _id: String,
  ts: Date,
  clientRegId: String,
  fullName: String,
  inn: String,
  kpp: String,
  addressDescription: String,
  site: Number,
});

schema.statics.merge = merge;

schema.index({ ts: -1 });

schema.set('toJSON', {
  virtuals: true,
  transform(doc, ret) {
    delete ret._id; // eslint-disable-line
  },
});

export default mongoose.model('EgaiProducer', schema);
