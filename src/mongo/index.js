import omit from 'lodash/omit';
import mongoose from 'mongoose';

export async function connect() {
  return mongoose.connect(`mongodb://${process.env.MONGO_URL}`, {
    useNewUrlParser: true,
    useCreateIndex: true,
  });
}

export async function disconnect() {
  return mongoose.disconnect();
}

export async function merge(modelName, items) {

  // mongoose.set('debug', true);

  const model = require('./model/' + modelName).default; // eslint-disable-line

  const ops = [];

  const cts = new Date();

  items.forEach(item => {

    ops.push(
      {
        updateOne: {
          filter: { _id: item.id },
          update: {
            $set: omit(item, ['id', 'ts', 'cts']),
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

export async function mergeOperations(items) {

  // mongoose.set('debug', true);

  const model = require('./model/EgaisMark').default; // eslint-disable-line

  const ops = [];

  const cts = new Date();

  items.forEach(item => {

    const key = `operations.${item.documentId}`;

    ops.push(
      {
        updateOne: {
          filter: { _id: item.egaisMarkId },
          update: {
            $set: {
              [key]: item,
              isProcessed: false,
            },
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

export async function find(modelName, id) {

  // mongoose.set('debug', true);

  const file = `./model/${modelName}`;
  // eslint-disable-next-line
  const model = require(file).default;

  const filter = id ? { _id: id } : {};

  return model.find(filter);

}
