import mongoose from 'mongoose';
import { merge } from '../extentions';

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
  site: Number,
});

schema.set('toJSON', {
  virtuals: true,
  transform(doc, ret) {
    delete ret._id; // eslint-disable-line
  },
});

schema.statics.merge = merge;
schema.statics.importData = importData;

schema.index({ ts: -1 });
schema.index({ egaisBoxIds: 1 });

export default mongoose.model('ArticleDoc', schema);

function importData() {

  const { barcodes, egaisBoxIds } = this;

  if (barcodes && !Array.isArray(barcodes)) {
    this.barcodes = JSON.parse(barcodes);
  }

  if (egaisBoxIds && !Array.isArray(egaisBoxIds)) {
    this.egaisBoxIds = JSON.parse(egaisBoxIds);
  }

}
