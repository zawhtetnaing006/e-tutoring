FROM nginx:1.25-alpine

WORKDIR /var/www

COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

ARG APP_DIR=backend
COPY ${APP_DIR}/public /var/www/public

