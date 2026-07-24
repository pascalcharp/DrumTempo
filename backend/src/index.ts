import './env';
import { Config } from './config/Config';
import { connectDatabase } from './db/database';
import { app } from './app';

connectDatabase()
  .then(() => {
    app.listen(Config.PORT, () => {
      console.log(`Backend running on port ${Config.PORT}`);
    });
  })
  .catch((err) => {
    console.error('Échec de connexion à la base de données:', err);
    process.exit(1);
  });
