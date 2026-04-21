FROM node:24 AS build

COPY ./ /usr/verio

WORKDIR /usr/verio

RUN npm install --ws

WORKDIR /usr/verio/backend

RUN npm run build

WORKDIR /usr/verio/frontend

RUN npm run build

FROM nginx:1.29 AS run-dependencies

RUN apt-get update && apt-get install -y curl ca-certificates gnupg

RUN curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
RUN apt-get install -y nodejs

RUN rm /etc/nginx/conf.d/default.conf
COPY ./docker/nginx.conf /etc/nginx/conf.d/default.conf

COPY ./docker/start.sh /usr/verio/start.sh
RUN chmod +x /usr/verio/start.sh

FROM run-dependencies AS run

COPY --from=build /usr/verio/frontend/build /usr/share/nginx/html
COPY --from=build /usr/verio /usr/verio

WORKDIR /usr/verio/backend

CMD ["/usr/verio/start.sh"]