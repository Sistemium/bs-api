import values from 'lodash/values';
import EgaisMark from '../mongo/model/EgaisMark';
import ArticleDoc from '../mongo/model/ArticleDoc';

export default startProcessing;

async function startProcessing() {

  // mongoose.set('debug', true);

  const cursor = EgaisMark.find({ isProcessed: { $ne: true } }).cursor();

  try {

    let mark = await cursor.next();

    while (mark) {

      const { operations } = mark;

      const operationValues = values(operations);

      let sumQuantity = 0;

      let boxId;

      let lastimestamp = '';

      operationValues.forEach(operation => {

        sumQuantity += operation.quantity;

        if (operation.quantity === 1 && operation.ts > lastimestamp) {

          lastimestamp = operation.ts;

          boxId = operation.egaisBoxId;

        }

      });

      if (sumQuantity !== 1) {

        await EgaisMark.updateOne({ _id: mark.id }, { isProcessed: true }); // eslint-disable-line

      } else {

        const doc = await ArticleDoc.findOne({ egaisBoxIds: boxId }).sort('-ts'); // eslint-disable-line

        if (doc) {

          await EgaisMark.updateOne({ _id: mark.id }, { isProcessed: true }); // eslint-disable-line

        }

      }

      mark = await cursor.next(); // eslint-disable-line

    }

  } catch (e) {
    console.error(e);
  }

}
