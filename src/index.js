import Koa from 'koa';
import bodyParser from 'koa-body';
import log from 'sistemium-telegram/services/log';
import morgan from 'koa-morgan';
import * as mongo from './mongo';

import api from './api';

const { debug, error } = log('index');
const { REST_PORT } = process.env;

const app = new Koa();

api.prefix('/api');

debug('starting on port', REST_PORT);

mongo.connect()
  .then(() => debug('mongo connected'))
  .catch(e => error('mongo connect error', e.message));

app
  .use(morgan(':method :url :status :res[content-length] - :response-time ms'))
  .use(bodyParser({ jsonLimit: '100mb' }))
  .use(api.routes())
  .use(api.allowedMethods())
  .listen(REST_PORT);

debug('started');
