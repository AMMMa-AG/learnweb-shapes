#
# $Id: Dockerfile 44486 2018-03-14 13:05:26Z svnmir $
#

#
# build stage
#
FROM node:10 AS build

#
# cache node modules
#
ADD package.json /tmp/package.json
RUN cd /tmp && npm install --no-audit
RUN mkdir -p /app && cp -a /tmp/node_modules /app/

WORKDIR /app
ADD . /app

RUN npm run build


#
# execution stage
#
FROM nginx:latest
RUN mkdir -p /usr/share/nginx/html/lib
RUN mkdir -p /usr/share/nginx/html/test
COPY --from=build /app/lib  /usr/share/nginx/html/lib/
COPY --from=build /app/test /usr/share/nginx/html/test/
