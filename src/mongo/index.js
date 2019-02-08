import mongoose from 'mongoose';

const mongoUrl = process.env.MONGO_URL || 'localhost:27017/EgaisDB';

if (process.env.MONGOOSE_DEBUG) {
  mongoose.set('debug', true);
}

export async function connect() {
  return mongoose.connect(`mongodb://${mongoUrl}`, {
    useNewUrlParser: true,
    useCreateIndex: true,
  });
}

export async function disconnect() {
  return mongoose.disconnect();
}
