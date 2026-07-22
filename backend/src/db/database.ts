import mongoose from 'mongoose';
import { Config } from '../config/Config';

export async function connectDatabase(): Promise<void> {
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB error:', err);
  });

  mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB');
  });

  await mongoose.connect(Config.MONGO_URI);
}
