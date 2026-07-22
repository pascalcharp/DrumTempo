import mongoose from 'mongoose';
import { Config } from '../config/Config';

// Empêche l'injection d'opérateurs Mongo ($ne, $gt, ...) via des champs de requête censés être des
// valeurs simples (ex: { email: { $ne: null } } dans req.body) — Mongoose neutralise automatiquement
// toute clé préfixée par "$" dans les filtres de requête plutôt que de la transmettre telle quelle à MongoDB.
mongoose.set('sanitizeFilter', true);

export async function connectDatabase(): Promise<void> {
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB error:', err);
  });

  mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB');
  });

  await mongoose.connect(Config.MONGO_URI);
}
