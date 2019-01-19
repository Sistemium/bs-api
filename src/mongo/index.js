const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/EgaisDB', { useNewUrlParser: true });

export { merge, find };

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
            $set: item,
          },
          upsert: true,
        },
      },
    );
  });

  return model.bulkWrite(ops, { ordered: false });

}

async function find(modelName, id) {

  mongoose.set('debug', true);

  const model = require('./model/' + modelName).default; // eslint-disable-line

  const filter = id ? { _id: id } : {};

  return model.find(filter);

}
