FROM php:8.4-fpm-bookworm AS base

WORKDIR /var/www

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    git \
    unzip \
    libicu-dev \
    libzip-dev \
  && docker-php-ext-install -j"$(nproc)" \
    bcmath \
    intl \
    opcache \
    pdo_mysql \
    zip \
  && pecl install redis \
  && docker-php-ext-enable redis \
  && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY docker/php/php.ini /usr/local/etc/php/conf.d/99-app.ini

COPY docker/php/entrypoint.sh /usr/local/bin/app-entrypoint
RUN chmod +x /usr/local/bin/app-entrypoint

FROM base AS dev

RUN groupadd -g 1000 app \
  && useradd -m -u 1000 -g 1000 app

COPY docker/php/www.dev.conf /usr/local/etc/php-fpm.d/www.conf

ENTRYPOINT ["app-entrypoint"]
CMD ["php-fpm"]

FROM base AS prod

ARG APP_DIR=backend

COPY ${APP_DIR}/composer.json ${APP_DIR}/composer.lock /var/www/
RUN composer install --no-dev --prefer-dist --no-interaction --no-progress --no-scripts --optimize-autoloader \
  && composer clear-cache

COPY ${APP_DIR}/ /var/www/

RUN rm -f /var/www/bootstrap/cache/*.php \
  && composer --no-scripts dump-autoload --no-dev --optimize --no-interaction \
  && php artisan package:discover --ansi

RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

ENTRYPOINT ["app-entrypoint"]
CMD ["php-fpm"]
