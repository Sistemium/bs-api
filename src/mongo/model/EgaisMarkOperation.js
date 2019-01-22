const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  cts: Date,
  documentId: String,
  egaisBoxId: String,
  egaisMarkId: String,
  _id: String,
  quantity: Number,
  site: Number,
  timestamp: String,
  ts: Date,
  type: String,

});

schema.set('toJSON', {
  virtuals: true,
  transform(doc, ret) { delete ret._id; } // eslint-disable-line
});

export default mongoose.model('EgaisMarkOperation', schema);
