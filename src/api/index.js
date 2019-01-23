import Router from 'koa-router';

import log from 'sistemium-telegram/services/log';

import { find, merge } from '../mongo';

const { debug, error } = log('api');

const router = new Router();

export default router;

router.post('/mark', async ctx => {

  const { header: { authorization }, request: { body } } = ctx;

  debug('POST /mark', authorization);

  try {

    await merge('EgaisMark', body);

    ctx.body = 'Marks inserted';

  } catch (err) {
    ctx.response.status = 500;
    error(err.name, err.message);
  }

});

router.get('/mark/:id?', async ctx => {

  const { header: { authorization }, params: { id } } = ctx;

  debug('GET /mark', authorization);

  try {

    ctx.body = await find('EgaisMark', id);

  } catch (err) {
    ctx.response.status = 500;
    error(err.name, err.message);
  }

});

router.post('/operation', async ctx => {

  const { header: { authorization }, request: { body } } = ctx;

  debug('POST /operation', authorization);

  try {

    // await merge('EgaisMarkOperation', body);

    await merge('EgaisMark', body, 'operations', 'documentId');

    ctx.body = 'Operations inserted';

  } catch (err) {
    ctx.response.status = 500;
    error(err.name, err.message);
  }

});

router.get('/operation/:id?', async ctx => {

  const { header: { authorization }, params: { id } } = ctx;

  debug('GET /operation', authorization);

  try {

    ctx.body = await find('EgaisMarkOperation', id);

  } catch (err) {
    ctx.response.status = 500;
    error(err.name, err.message);
  }

});
