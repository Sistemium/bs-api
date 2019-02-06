const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  cts: Date,
  _id: String,
  ts: Date,
  articleId: String,
  egaisArticleId: String,
  egaisDocumentId: String,
  dateProduction: String,
  quantity: Number,
  barcodes: Array,
  egaisBoxIds: Array,
});

schema.set('toJSON', {
  virtuals: true,
  transform(doc, ret) { delete ret._id; } // eslint-disable-line
});

schema.index({ ts: -1 });
schema.index({ egaisBoxIds: 1 });

export default mongoose.model('ArticleDoc', schema);
