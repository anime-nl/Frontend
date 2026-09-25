FROM node:22-bookworm

RUN mkdir -p /app/node_modules && chown -R node:node /app

USER node
WORKDIR /app
