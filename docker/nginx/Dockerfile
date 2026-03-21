FROM node:20-alpine AS frontend-build

WORKDIR /app

ARG FRONTEND_DIR=frontend
ARG VITE_API_BASE_URL=/api
ARG VITE_REVERB_APP_KEY=
ARG VITE_REVERB_HOST=
ARG VITE_REVERB_PORT=
ARG VITE_REVERB_SCHEME=

COPY ${FRONTEND_DIR}/package.json ${FRONTEND_DIR}/package-lock.json ./
RUN npm ci

COPY ${FRONTEND_DIR}/ ./
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_REVERB_APP_KEY=${VITE_REVERB_APP_KEY}
ENV VITE_REVERB_HOST=${VITE_REVERB_HOST}
ENV VITE_REVERB_PORT=${VITE_REVERB_PORT}
ENV VITE_REVERB_SCHEME=${VITE_REVERB_SCHEME}
RUN npm run build

FROM nginx:1.25-alpine

WORKDIR /var/www

ARG NGINX_CONF=default.conf
COPY docker/nginx/${NGINX_CONF} /etc/nginx/conf.d/default.conf

ARG APP_DIR=backend
COPY ${APP_DIR}/public /var/www/public
COPY --from=frontend-build /app/dist/ /var/www/public/
