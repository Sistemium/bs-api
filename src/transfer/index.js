import log from 'sistemium-telegram/services/log';

import EgaisBox from '../mongo/model/EgaisBox';
import ArticleDoc from '../mongo/model/ArticleDoc';
import EgaisMark, { mergeOperations } from '../mongo/model/EgaisMark';

import fromSTApi from './fromSTApi';
import * as mongo from '../mongo';
import sqlSource from './sqlSource';

const { debug, error } = log('transfer');

transferAll()
  .then(() => {
    debug('done');
  })
  .catch(e => {
    error('error', e.message);
  });

process.on('SIGINT', async () => {
  error('SIGINT');
  await finish();
  process.exit();
});

async function transferAll() {

  debug('connected');

  try {

    await mongo.connect();
    await sqlSource.connect();

    await fromSTApi(EgaisMark);
    await fromSTApi(EgaisBox);
    await fromSTApi(ArticleDoc);
    await fromSTApi({
      modelName: 'EgaisMarkOperation',
      merge: mergeOperations,
    });
  } catch (e) {
    error(e.message);
  }

  await finish();

}


async function finish() {
  await mongo.disconnect()
    .catch(error);
  await sqlSource.disconnect()
    .catch(error);
}
