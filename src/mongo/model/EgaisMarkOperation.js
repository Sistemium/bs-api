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

export default mongoose.model('EgaisMarkOperation', schema);
