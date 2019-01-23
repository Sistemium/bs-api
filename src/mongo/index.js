import omit from 'lodash/omit';
import get from 'lodash/get';
import lowerFirst from 'lodash/lowerFirst';
import mongoose from 'mongoose';

mongoose.connect('mongodb://localhost:27017/EgaisDB', { useNewUrlParser: true });

export { merge, find };

async function merge(modelName, items, path) {

  // mongoose.set('debug', true);

  const model = require('./model/' + modelName).default; // eslint-disable-line

  const ops = [];

  const cts = new Date();
  const idPath = path ? `${lowerFirst(modelName)}Id` : 'id';

  items.forEach(item => {

    const key = `${path}.${item.id}`;

    const set = path ? {
      $set: {
        [key]: omit(item, ['ts', 'cts']),
      },
    }
      : {
        $set: omit(item, ['id', 'ts', 'cts']),
      };

    ops.push(
      {
        updateOne: {
          filter: { _id: get(item, idPath) },
          update: {
            ...set,
            $setOnInsert: {
              cts,
            },
            $currentDate: { ts: true },
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
