const mongoose = require('mongoose');

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
  transform(doc, ret) { delete ret._id; } // eslint-disable-line
});

schema.index({ ts: -1 });
schema.index({ isProcessed: 1 });

export default mongoose.model('EgaisMark', schema);
