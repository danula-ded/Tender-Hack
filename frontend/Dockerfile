# ---------- BASE ----------
FROM node:18 AS base
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# ---------- DEV ----------
FROM base AS dev
EXPOSE 5173
CMD ["npm", "run", "dev"]

# ---------- PROD ----------
FROM base AS prod
RUN npm run build
EXPOSE 4173
CMD ["npm", "run", "preview"]
