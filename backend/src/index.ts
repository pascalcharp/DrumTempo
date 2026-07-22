import './env';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { Config } from './config/Config';
import { SwaggerConfig } from './config/SwaggerConfig';
import { connectDatabase } from './db/database';
import exerciseRoutes from './routes/exerciseRoutes';
import authRoutes from './routes/authRoutes';
import { swaggerSpec } from './docs/swaggerSpec';
import { requireAuth } from './middleware/requireAuth';

const app = express();
app.use(cors({ origin: Config.CORS_ORIGINS }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(SwaggerConfig.DOCS_PATH, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/auth', authRoutes);
app.use('/api/exercises', requireAuth, exerciseRoutes);

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
