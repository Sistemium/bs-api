import log from 'sistemium-telegram/services/log';
import fromSTApi from './fromSTApi';
import { connect } from '../mongo';

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

  debug('connected');

  await fromSTApi('ArticleDoc');

  await fromSTApi('EgaisBox');

  await fromSTApi('EgaisMark');

  await fromSTApi('EgaisMarkOperation');

}
