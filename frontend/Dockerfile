FROM node:22-alpine
WORKDIR /app
# L'image node:22-alpine inclut déjà un utilisateur non-root "node" (uid 1000) — pas besoin d'en créer un.
# WORKDIR crée /app appartenant à root ; on le chowns explicitement avant de basculer vers "node", sinon
# ce dernier n'a pas le droit d'écriture sur /app lui-même (donc pas le droit d'y créer node_modules).
RUN chown node:node /app
USER node
COPY --chown=node:node package*.json ./
RUN npm install
COPY --chown=node:node . .
EXPOSE 5173
CMD ["npm", "run", "dev"]
