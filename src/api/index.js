import Router from 'koa-router';
import log from 'sistemium-telegram/services/log';

import EgaisMark, { mergeOperations, mergeCancels } from '../mongo/model/EgaisMark';
import ArticleDoc from '../mongo/model/ArticleDoc';
import EgaisBox from '../mongo/model/EgaisBox';
import EgaisArticle from '../mongo/model/EgaisArticle';
import EgaisProducer from '../mongo/model/EgaisProducer';

const { debug, error } = log('api');

const router = new Router();

export default router;

router.post('/EgaisMark', postHandler(EgaisMark));
router.get('/EgaisMark/:id?', getHandler(EgaisMark));

router.post('/EgaisMarkOperation', postHandler({ merge: mergeOperations }));
router.post('/EgaisMarkCancel', postHandler({ merge: mergeCancels }));

router.post('/ArticleDoc', postHandler(ArticleDoc));
router.get('/ArticleDoc/:id?', getHandler(ArticleDoc));

router.post('/EgaisBox', postHandler(EgaisBox));
router.get('/EgaisBox/:id?', getHandler(EgaisBox));

router.post('/EgaisArticle', postHandler(EgaisArticle));
router.get('/EgaisArticle/:id?', getHandler(EgaisArticle));

router.post('/EgaisProducer', postHandler(EgaisProducer));
router.get('/EgaisProducer/:id?', getHandler(EgaisProducer));


/*
  Private
 */

function postHandler(model) {
  return async ctx => {

    const { request: { body }, path, state: { site } } = ctx;

    ctx.assert(Array.isArray(body), 400, 'Body must be an array');
    ctx.assert(site, 400, 'Undefined site');

    debug('POST', path, body.length);

    try {

      ctx.body = await model.merge(body, { site });

    } catch ({ message, writeErrors }) {
      if (writeErrors && writeErrors.length) {
        error('writeErrors[0]:', JSON.stringify(writeErrors[0]));
      }
      ctx.throw(500);
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
