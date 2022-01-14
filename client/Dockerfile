FROM node:16-alpine

RUN mkdir /app
WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH

COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json

RUN npm ci
RUN npm install react-scripts@latest -g --silent

CMD ["npm", "start"]