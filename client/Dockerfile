FROM node:16-alpine AS build

RUN mkdir /app
WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH

COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json

RUN npm ci --maxsockets 5 --verbose
RUN npm install react-scripts@latest -g --verbose --maxsockets 5

COPY . /app
RUN npm run build --verbose 

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]