import Koa from 'koa';
import bodyParser from 'koa-body';
import log from 'sistemium-telegram/services/log';
import morgan from 'koa-morgan';
import * as mongo from './mongo';

import api from './api';
import auth from './api/auth';

const { debug, error } = log('index');
const { REST_PORT } = process.env;

const app = new Koa();

api.prefix('/api');

debug('starting on port', REST_PORT);

mongo.connect()
  .then(mongoose => {
    const { connection: { db: { databaseName } } } = mongoose;
    debug('mongo connected:', databaseName);
  })
  .catch(e => error('mongo connect error', e.message));

app
  .use(morgan(':status :method :url :res[content-length] - :response-time ms'))
  .use(auth)
  .use(bodyParser({ jsonLimit: '100mb' }))
  .use(api.routes())
  .use(api.allowedMethods())
  .listen(REST_PORT);
