FROM node:22-alpine AS builder
WORKDIR /app
COPY client/package.json client/yarn.lock ./client/
RUN cd client && yarn install --frozen-lockfile
COPY client/ ./client/
RUN cd client && yarn build

FROM node:22-alpine AS runner
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production
COPY server/ ./server/
COPY --from=builder /app/client/dist ./client/dist
EXPOSE 3000
CMD ["node", "server/index.js"]
