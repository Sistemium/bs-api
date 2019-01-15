import Koa from 'koa';
import bodyParser from 'koa-body';
import log from 'sistemium-telegram/services/log';

import api from './api';

const { debug } = log('index');
const { REST_PORT } = process.env;

const app = new Koa();

api.prefix('/api');

debug('starting on port', REST_PORT);

app
  .use(bodyParser())
  .use(api.routes())
  .use(api.allowedMethods())
  .listen(REST_PORT);

debug('started');
