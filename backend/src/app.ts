import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { Config } from './config/Config';
import { SwaggerConfig } from './config/SwaggerConfig';
import { HttpConfig } from './config/HttpConfig';
import exerciseRoutes from './routes/exerciseRoutes';
import authRoutes from './routes/authRoutes';
import { swaggerSpec } from './docs/swaggerSpec';
import { requireAuth } from './middleware/requireAuth';

// Empêche l'injection d'opérateurs Mongo ($ne, $gt, ...) via des champs de requête censés être des
// valeurs simples (ex: { email: { $ne: null } } dans req.body) — Mongoose neutralise automatiquement
// toute clé préfixée par "$" dans les filtres de requête plutôt que de la transmettre telle quelle à MongoDB.
// Déclaré ici (pas dans db/database.ts) car c'est une configuration globale de Mongoose qui doit
// s'appliquer dès que l'app se charge, indépendamment de la façon dont la connexion est établie
// ensuite (connectDatabase() en production, MongoMemoryServer dans les tests).
mongoose.set('sanitizeFilter', true);

export const app = express();
app.use(helmet());
app.use(cors({ origin: Config.CORS_ORIGINS }));
app.use(express.json({ limit: HttpConfig.JSON_BODY_LIMIT }));

const apiLimiter = rateLimit({
  windowMs: HttpConfig.RATE_LIMIT_WINDOW_MS,
  max: HttpConfig.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: HttpConfig.MSG_TOO_MANY_REQUESTS },
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(SwaggerConfig.DOCS_PATH, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/exercises', requireAuth, exerciseRoutes);
