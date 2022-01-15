FROM node:16-alpine

RUN mkdir /app
WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH

COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json

RUN npm ci --maxsockets 15
RUN npm install react-scripts@latest -g --verbose --maxsockets 5


CMD ["npm", "start"]