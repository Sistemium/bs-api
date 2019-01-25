const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  cts: Date,
  _id: String,
  ts: Date,
  barcode: String,
  parentId: String,
  site: Number,
});

schema.set('toJSON', {
  virtuals: true,
  transform(doc, ret) { delete ret._id; } // eslint-disable-line
});

export default mongoose.model('EgaisBox', schema);
