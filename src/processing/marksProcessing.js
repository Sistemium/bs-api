import log from 'sistemium-telegram/services/log';
import each from 'lodash/each';
import { whilstAsync } from 'sistemium-telegram/services/async';

import EgaisMark from '../mongo/model/EgaisMark';
import ArticleDoc from '../mongo/model/ArticleDoc';

// const mongoose = require('mongoose');

const { debug, error } = log('marksProcessing');

export default async function (processBox, writeDocId) {

  // mongoose.set('debug', true);
  debug('start');

  const cursor = EgaisMark.find({ isProcessed: { $ne: true } })
    .cursor();

  let mark = await cursor.next();

  debug('cursor', !!mark);

  return whilstAsync(() => mark, async () => {

    const { operations } = mark;

    let sumQuantity = 0;
    let boxId = null;
    let lastTimestamp = '';

    each(operations, operation => {

      sumQuantity += operation.quantity;

      if (operation.quantity === 1 && operation.ts > lastTimestamp) {

        lastTimestamp = operation.ts;
        boxId = operation.egaisBoxId;

      }

    });

    if (sumQuantity !== 1) {

      await EgaisMark.updateOne({ _id: mark.id }, { isProcessed: true });

    } else if (!boxId) {
      error('no box id');
    } else {

      debug('test');

      await processBox(boxId);

      const doc = await ArticleDoc.findOne({ egaisBoxIds: boxId })
        .sort('-ts');

      if (doc) {

        await writeDocId(doc.id);

        await EgaisMark.updateOne({ _id: mark.id }, { isProcessed: true });

      }

    }

    mark = await cursor.next();

  });

}
