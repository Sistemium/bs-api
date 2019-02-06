const mongoose = require('mongoose');

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
});

schema.set('toJSON', {
  virtuals: true,
  transform(doc, ret) { delete ret._id; } // eslint-disable-line
});

schema.index({ ts: -1 });

export default mongoose.model('EgaisBox', schema);
