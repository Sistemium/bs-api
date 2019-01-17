const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  barcode: String,
  cts: String,
  egaisArticleId: String,
  _id: String,
  site: Number,
  ts: String,
});

export default mongoose.model('EgaisMark', schema);
