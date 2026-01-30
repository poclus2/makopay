# Base image
FROM node:18-slim As development

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

FROM node:18-slim as production

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --only=production

COPY . .

RUN npx prisma generate

COPY --from=development /usr/src/app/dist ./dist

CMD ["node", "dist/src/main"]
