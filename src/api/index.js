import Router from 'koa-router';

import log from 'sistemium-telegram/services/log';

import merge from '../mongo';

const { debug, error } = log('api');

const router = new Router();

export default router;

router.get('/test/:id?', async ctx => {

  const { params: { id }, header: { authorization } } = ctx;

  debug('GET /test', id, authorization);

  try {

    ctx.body = await new Promise(resolve => resolve({ id: id || 'test' }));

  } catch (err) {
    ctx.response.status = 500;
    error(err.name, err.message);
  }

});

router.post('/mark', async ctx => {

  const { header: { authorization }, request: { body } } = ctx;

  debug('GET /mark', authorization);

  try {

    await merge('EgaisMark', body);

    ctx.body = 'test';

  } catch (err) {
    ctx.response.status = 500;
    error(err.name, err.message);
  }

});

router.post('/operation', async ctx => {

  const { header: { authorization }, request: { body } } = ctx;

  debug('GET /mark', authorization);

  try {

    await merge('EgaisMarkOperation', body);

    ctx.body = 'test';

  } catch (err) {
    ctx.response.status = 500;
    error(err.name, err.message);
  }

});
