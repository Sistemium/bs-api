import Router from 'koa-router';
import log from 'sistemium-telegram/services/log';

import EgaisMark, { mergeOperations } from '../mongo/model/EgaisMark';
import ArticleDoc from '../mongo/model/ArticleDoc';
import EgaisBox from '../mongo/model/EgaisBox';

const { debug, error } = log('api');

const router = new Router();

export default router;

router.post('/mark', async ctx => {

  const { header: { authorization }, request: { body } } = ctx;

  debug('POST /mark', authorization);

  try {

    await EgaisMark.merge(body);

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

    ctx.body = await EgaisMark.findById(id);

  } catch (err) {
    ctx.response.status = 500;
    error(err.name, err.message);
  }

});

router.post('/operation', async ctx => {

  const { header: { authorization }, request: { body } } = ctx;

  debug('POST /operation', authorization);

  try {

    await mergeOperations(body);

    ctx.body = 'Operations inserted';

  } catch (err) {
    ctx.response.status = 500;
    error(err.name, err.message);
  }

});

router.post('/articledoc', async ctx => {

  const { header: { authorization }, request: { body } } = ctx;

  debug('POST /articledoc', authorization);

  try {

    await ArticleDoc.merge(body);

    ctx.body = 'Article Docs inserted';

  } catch (err) {
    ctx.response.status = 500;
    error(err.name, err.message);
  }

});

router.get('/articledoc/:id?', async ctx => {

  const { header: { authorization }, params: { id } } = ctx;

  debug('GET /articledoc', authorization);

  try {

    ctx.body = await ArticleDoc.findById(id);

  } catch (err) {
    ctx.response.status = 500;
    error(err.name, err.message);
  }

});

router.post('/egaisbox', async ctx => {

  const { header: { authorization }, request: { body } } = ctx;

  debug('POST /egaisbox', authorization);

  try {

    await EgaisBox.merge(body);

    ctx.body = 'Egais box inserted';

  } catch (err) {
    ctx.response.status = 500;
    error(err.name, err.message);
  }

});

router.get('/egaisbox/:id?', async ctx => {

  const { header: { authorization }, params: { id } } = ctx;

  debug('GET /egaisbox', authorization);

  try {

    ctx.body = await EgaisBox.findById(id);

  } catch (err) {
    ctx.response.status = 500;
    error(err.name, err.message);
  }

});
