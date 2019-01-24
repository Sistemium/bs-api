const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  barcode: String,
  cts: Date,
  egaisArticleId: String,
  _id: String,
  site: Number,
  ts: Date,
  operations: Object,
  isProcessed: Boolean,
});

schema.set('toJSON', {
  virtuals: true,
  transform(doc, ret) { delete ret._id; } // eslint-disable-line
});

export default mongoose.model('EgaisMark', schema);
