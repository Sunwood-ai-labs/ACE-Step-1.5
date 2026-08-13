# Build the React Router + Vite single-page workstation.
FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund

FROM dependencies AS build
WORKDIR /app
COPY index.html tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts ./
COPY public ./public
COPY src ./src
RUN npm run build

FROM build AS test
RUN npm test

FROM nginx:1.27-alpine AS runtime
COPY nginx/default.conf /etc/nginx/conf.d/default.conf.template
COPY nginx/40-forge-api-upstream.sh /docker-entrypoint.d/40-forge-api-upstream.sh
RUN chmod +x /docker-entrypoint.d/40-forge-api-upstream.sh
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://localhost:8080/healthz || exit 1
