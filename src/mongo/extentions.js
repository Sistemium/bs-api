import omit from 'lodash/omit';

/**
 * Merge collection data
 * @param {Array} items
 * @param {Object} [defaults]
 * @returns {Promise}
 */
export async function merge(items, defaults) {

  const ops = [];

  const $setOnInsert = { cts: new Date() };

  if (defaults) {
    Object.assign($setOnInsert, defaults);
  }

  items.forEach(item => {

    if (this.importData) {
      this.importData.call(item);
    }

    ops.push(
      {
        updateOne: {
          filter: { _id: item.id },
          update: {
            $set: omit(item, ['id', 'ts', 'cts']),
            $currentDate: { ts: true },
            $setOnInsert,
          },
          upsert: true,
        },
      },
    );
  });

  return this.bulkWrite(ops, { ordered: false });

}

export async function findById(id) {

  const filter = id ? { _id: id } : {};

  return this.find(filter);

}
