import log from 'sistemium-telegram/services/log';
import fromSTApi from './fromSTApi';
import { connect } from '../mongo';
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


async function transferAll() {

  await connect();
  await sqlSource.connect();

  debug('connected');

  // await fromSTApi('ArticleDoc');

  // await fromSTApi('EgaisBox');

  await fromSTApi('EgaisMark');

  // await fromSTApi('EgaisMarkOperation');

}
