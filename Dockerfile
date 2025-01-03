# Use Node.js base image
FROM node:22.8.0-alpine

WORKDIR /app

COPY package*.json ./
COPY yarn.lock ./

RUN yarn install

COPY src ./src
COPY blobs ./blobs
COPY tsconfig.json tsconfig.build.json nest-cli.json ./

RUN yarn build

EXPOSE 3000

# Start the application
CMD ["sh", "-c", "npx mikro-orm schema:update --run && npm start prod"]