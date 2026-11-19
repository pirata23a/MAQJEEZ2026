# AppJeez — imagen única: compila el front y corre el server (app + API).
# Portable: sirve para Koyeb, Render, Fly, Railway, etc.
FROM node:22-slim

WORKDIR /app

# deps del front (incluye dev para poder compilar con vite/tsc)
COPY package*.json ./
RUN npm install --include=dev

# código
COPY . .

# compilar el front a /app/dist
RUN npm run build

# deps del server
RUN npm --prefix server install

ENV NODE_ENV=production
# el host define PORT; el server lo toma de process.env.PORT
EXPOSE 8000
CMD ["npm", "--prefix", "server", "start"]
