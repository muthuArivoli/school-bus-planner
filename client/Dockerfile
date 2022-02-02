FROM node:16-alpine

RUN mkdir /app
WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH

COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json

RUN npm ci --maxsockets 5 --verbose
RUN npm install react-scripts@latest -g --verbose --maxsockets 5
RUN npm run build

FROM nginx:alpine
COPY --from=build /usr/src/app/build /usr/share/nginx/html
COPY gninx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daeon off;"]