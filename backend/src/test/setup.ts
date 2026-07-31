import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll } from 'vitest';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // mongoose.connect() ne garantit pas que les index (ex: unicité name+owner sur Exercise)
  // soient déjà construits sur le serveur Mongo en mémoire, fraîchement créé à chaque run.
  // Sans cette attente, un test peut s'exécuter avant que l'index unique existe et laisser
  // passer un duplicata — flaky, plus visible en CI (base toujours neuve) qu'en local.
  await Promise.all(mongoose.modelNames().map((name) => mongoose.model(name).init()));
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
