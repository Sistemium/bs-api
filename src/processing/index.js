import log from 'sistemium-telegram/services/log';
import { connect } from '../mongo';

import marksProcessing from './marksProcessing';

const { debug, error } = log('processing');

debug('start');

marksProcessing()
  .then(() => debug('finish'))
  .catch(e => error(e));

connect()
  .then(() => {
    debug('connected');
  });
