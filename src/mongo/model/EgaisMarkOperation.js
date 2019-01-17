const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  cts: String,
  documentId: String,
  egaisBoxId: String,
  egaisMarkId: String,
  _id: String,
  quantity: Number,
  site: Number,
  timestamp: String,
  ts: String,
  type: String,

});

export default mongoose.model('EgaisMarkOperation', schema);
