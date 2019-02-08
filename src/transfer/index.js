import log from 'sistemium-telegram/services/log';
import fromSTApi from './fromSTApi';
import * as mongo from '../mongo';
import sqlSource from './sqlSource';

// eslint-disable-next-line
const { debug, error } = log('transfer');

transferAll()
  .then(() => {
    debug('done');
  })
  .catch(e => {
    error('error', e.message);
  });

process.on('SIGINT', async () => {
  await mongo.disconnect();
  await sqlSource.disconnect();
  process.exit();
});

async function transferAll() {

  await mongo.connect();
  await sqlSource.connect();

  debug('connected');

  // await fromSTApi('ArticleDoc');

  // await fromSTApi('EgaisBox');

  try {
    // await fromSTApi('EgaisMark');
  } catch (e) {
    error(e.message);
    await mongo.disconnect();
    await sqlSource.disconnect();
  }

  // await fromSTApi('EgaisMarkOperation');

}
