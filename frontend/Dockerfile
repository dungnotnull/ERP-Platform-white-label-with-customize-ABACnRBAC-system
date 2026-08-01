# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY .npmrc ./
COPY package*.json ./
RUN npm install
RUN rm -f .npmrc
COPY . .
RUN npm run build

# Stage 2: Serve
FROM node:20-alpine AS runner
WORKDIR /app
RUN npm install -g serve@14
COPY --from=builder /app/dist ./dist
EXPOSE 3002
# -s = SPA mode: mọi path (kể cả /permissions/) fallback về index.html
CMD ["serve", "-s", "dist", "-l", "3002"]
