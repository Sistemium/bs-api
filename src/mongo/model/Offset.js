const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  offset: String,
  _id: String,
  cts: Date,
  ts: Date,
});

schema.set('toJSON', {
  virtuals: true,
  transform(doc, ret) { delete ret._id; } // eslint-disable-line
});

export default mongoose.model('Offset', schema);
