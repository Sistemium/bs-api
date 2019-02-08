import omit from 'lodash/omit';

export async function merge(items) {

  const ops = [];

  const cts = new Date();

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

  return this.bulkWrite(ops, { ordered: false });

}

export async function findById(id) {

  const filter = id ? { _id: id } : {};

  return this.find(filter);

}
