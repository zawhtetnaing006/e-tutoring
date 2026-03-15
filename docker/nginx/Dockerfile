FROM node:20-alpine AS frontend-build

WORKDIR /app

ARG FRONTEND_DIR=frontend
ARG VITE_API_BASE_URL=/api

COPY ${FRONTEND_DIR}/package.json ${FRONTEND_DIR}/package-lock.json ./
RUN npm ci

COPY ${FRONTEND_DIR}/ ./
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

FROM nginx:1.25-alpine

WORKDIR /var/www

COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

ARG APP_DIR=backend
COPY ${APP_DIR}/public /var/www/public
COPY --from=frontend-build /app/dist/ /var/www/public/
