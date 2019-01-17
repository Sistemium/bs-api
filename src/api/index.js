import Router from 'koa-router';

import log from 'sistemium-telegram/services/log';

import merge from '../mongo';

const { debug, error } = log('api');

const router = new Router();

export default router;

router.post('/mark', async ctx => {

  const { header: { authorization }, request: { body } } = ctx;

  debug('GET /mark', authorization);

  try {

    await merge('EgaisMark', body);

    ctx.body = 'Marks inserted';

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

    ctx.body = 'inserted operation';

  } catch (err) {
    ctx.response.status = 500;
    error(err.name, err.message);
  }

});

router.post('/test', async ctx => {

  const { header: { authorization }, request: { body } } = ctx;

  debug('GET /mark', authorization);

  try {

    ctx.body = body;

  } catch (err) {
    ctx.response.status = 500;
    error(err.name, err.message);
  }

});
