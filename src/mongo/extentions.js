import omit from 'lodash/omit';
import setDefaults from 'lodash/defaults';

/* eslint-disable import/prefer-default-export */

/**
 * Merge collection data
 * @param {Array} items
 * @param {Object} [defaults]
 * @returns {Promise}
 */
export async function merge(items, defaults) {

  const ops = [];

  const cts = new Date();

  items.forEach(item => {

    if (this.importData) {
      this.importData.call(item);
    }

    ops.push({
      updateOne: {
        filter: { _id: item.id },
        update: {
          $set: setDefaults(omit(item, ['id', 'ts', 'cts']), defaults),
          $currentDate: { ts: true },
          $setOnInsert: { cts },
        },
        upsert: true,
      },
    });

  });

  return this.bulkWrite(ops, { ordered: false });

}
