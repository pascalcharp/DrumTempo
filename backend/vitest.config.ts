import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    // Le premier lancement télécharge le binaire MongoDB en mémoire, ce qui peut dépasser
    // le délai par défaut de Vitest (10s) pour les hooks beforeAll/afterAll.
    hookTimeout: 60000,
    // AuthConfig exige JWT_SECRET dès le chargement du module. En production, env.ts
    // (dotenv.config()) le fournit depuis backend/.env ; les tests ne passent pas par ce
    // fichier et ne doivent pas en dépendre (la CI n'aura pas de .env local avec un vrai secret).
    env: {
      JWT_SECRET: 'test-secret-do-not-use-in-production',
    },
  },
});
