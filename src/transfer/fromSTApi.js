import log from 'sistemium-telegram/services/log';
import { whilstAsync } from 'sistemium-telegram/services/async';

import Offset from '../mongo/model/Offset';
import sqlSource, { columns } from './sqlSource';

// eslint-disable-next-line
const { debug, error } = log('transfer');

const PAGE_SIZE = parseInt(process.env.PAGE_SIZE || '1000', 0);

const OFFSET_HEADER = 'x-offset';

async function get(model) {

  const { modelName: name } = model;

  const lastOffset = await Offset.findById(name);
  const namedOffset = lastOffset || new Offset({ _id: name, offset: 1 });
  const { offset } = namedOffset;

  const { data, headers, status } = await getFromSQL(name, offset);

  if (!(data && data.length)) {
    debug(name, 'empty response:', status, offset);
    return 0;
  }

  const nextOffset = headers[OFFSET_HEADER];

  debug(name, data.length, nextOffset);

  await model.merge(data);

  namedOffset.offset = nextOffset;

  await namedOffset.save();

  debug(name, 'merged');

  return data.length;

}

export default async function (model) {

  let length = PAGE_SIZE;

  await whilstAsync(
    () => PAGE_SIZE === length,
    async () => {
      length = await get(model);
    },
  );

}

async function getFromSQL(name, offset) {

  const startAt = parseInt(offset, 0);

  const data = await sqlSource.getData(name, PAGE_SIZE, startAt, columns[name]);

  return {
    data,
    headers: { [OFFSET_HEADER]: data.length + startAt },
    status: 'OK',
  };

}
