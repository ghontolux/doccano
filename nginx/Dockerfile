FROM node:${NODE_VERSION}-alpine AS frontend-builder
CMD ["nginx", "-g", "daemon off;"]
ARG NODE_VERSION="16.5-alpine3.14"

COPY frontend/ /app/
WORKDIR /app

RUN apk add -U --no-cache git python3 make g++ \
  && yarn install \
  && yarn build \
  && apk del --no-cache git make g++

FROM nginx:1.21.1-alpine AS runtime

RUN addgroup -g 61000 doccano \
  && adduser -G doccano -S doccano -u 61000

COPY --chown=doccano:doccano --from=frontend-builder /app/dist /var/www/html

## add permissions
RUN chown -R doccano:doccano /var/cache/nginx \
  && chmod -R g+w /var/cache/nginx \
  && chmod -R 777 /etc/nginx/conf.d \
  && chown -R doccano:doccano /media

USER nginx

ADD nginx/default.conf /etc/nginx/conf.d/default.template
CMD sh -c "envsubst \"`env | awk -F = '{printf \" \\\\$%s\", $1}'`\" < /etc/nginx/conf.d/default.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"

COPY nginx/nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080

USER doccano:doccano
