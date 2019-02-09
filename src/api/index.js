import Router from 'koa-router';
import log from 'sistemium-telegram/services/log';

import EgaisMark, { mergeOperations } from '../mongo/model/EgaisMark';
import ArticleDoc from '../mongo/model/ArticleDoc';
import EgaisBox from '../mongo/model/EgaisBox';

const { debug, error } = log('api');

const router = new Router();

export default router;

router.post('/EgaisMark', postHandler(EgaisMark));
router.get('/EgaisMark/:id?', getHandler(EgaisMark));

router.post('/EgaisMarkOperation', postHandler({ merge: mergeOperations }));

router.post('/ArticleDoc', postHandler(ArticleDoc));
router.get('/ArticleDoc/:id?', getHandler(ArticleDoc));

router.post('/EgaisBox', postHandler(EgaisBox));
router.get('/EgaisBox/:id?', getHandler(EgaisBox));


/*
  Private
 */

function postHandler(model) {
  return async ctx => {

    const { request: { body }, path } = ctx;

    ctx.assert(Array.isArray(body), 400, 'Body must be an array');

    debug('POST', path, body.length);

    try {

      ctx.body = await model.merge(body);

    } catch (err) {
      ctx.throw(500);
      error(err.name, err.message);
    }

  };
}


function getHandler(model) {
  return async ctx => {

    const { params: { id }, path } = ctx;

    debug('GET', path, id);

    try {

      ctx.body = await model.findById(id);

    } catch (err) {
      ctx.throw(500);
      error(err.name, err.message);
    }

  };
}
