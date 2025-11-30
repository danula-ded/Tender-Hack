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
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build
EXPOSE 4173
CMD ["npm", "run", "preview"]
