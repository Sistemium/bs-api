const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  barcode: String,
  cts: Date,
  egaisArticleId: String,
  _id: String,
  site: Number,
  ts: Date,
});
});

export default mongoose.model('EgaisMark', schema);
