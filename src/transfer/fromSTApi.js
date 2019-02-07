import axios from 'axios';
import log from 'sistemium-telegram/services/log';
import find from 'lodash/find';
import { whilstAsync } from 'sistemium-telegram/services/async';
import * as mongo from '../mongo';
import sqlSource, { columns } from './sqlSource';

// eslint-disable-next-line
const { debug, error } = log('transfer');

const PAGE_SIZE = 1000;
const API_URL = 'https://api.sistemium.com/v4/bs/1c';
const { STAPI_AUTH } = process.env;
const OFFSET_HEADER = 'x-offset';

async function get(name) {

  const o = mongo.find('Offset');

  const offsets = await o;

  const namedOffset = find(offsets, { id: name });

  const offset = namedOffset ? namedOffset.offset : '1';

  const { data, headers, status } = await getFromSQL(name, offset);

  if (!data) {
    debug(name, 'Status:', status, offset);
    return 0;
  }

  const nextOffset = headers[OFFSET_HEADER];

  debug(name, data.length, nextOffset);

  if (name === 'EgaisMarkOperation') {

    await mongo.mergeOperations(data);

  } else {

    await mongo.merge(name, data);

  }

  await mongo.merge('Offset', [{
    id: name,
    offset: nextOffset,
  }]);

  debug(name, 'merged');

  return data.length;

}

export default async function (name) {

  let length = PAGE_SIZE;

  await whilstAsync(
    () => PAGE_SIZE === length,
    async () => {
      length = await get(name);
    },
  );

}

// eslint-disable-next-line
function getFromREST(name, offset) {
  return axios.get(`${API_URL}/${name}`, {
    headers: {
      authorization: STAPI_AUTH,
      'x-page-size': PAGE_SIZE,
      [OFFSET_HEADER]: offset,
    },
  });
}

async function getFromSQL(name, offset) {

  const startAt = parseInt(offset, 0);
  // const pageSize = parseInt(PAGE_SIZE, 0);

  const data = await sqlSource.getData(name, PAGE_SIZE, startAt, columns[name]);

  return {
    data,
    headers: { [OFFSET_HEADER]: PAGE_SIZE + startAt + 1 },
    status: 'OK',
  };

}
