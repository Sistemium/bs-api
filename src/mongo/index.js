const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/EgaisDB', { useNewUrlParser: true });

export default merge;

async function merge(modelName, items) {

  mongoose.set('debug', true);

  const model = require('./model/' + modelName).default; // eslint-disable-line

  const ops = [];

  items.forEach(item => {
    ops.push(
      {
        updateOne: {
          filter: { _id: item.id },
          update: {
            $set: {
              barcode: item.barcode,
              cts: item.cts,
              egaisArticleId: item.egaisArticleId,
              site: item.site,
              ts: item.ts,
            },
          },
          upsert: true,
        },
      },
    );
  });

  return model.bulkWrite(ops, { ordered: false });

}
