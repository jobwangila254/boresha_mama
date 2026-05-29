FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV BROWSER=none WATCHPACK_POLLING=true PORT=3001
EXPOSE 3001

CMD ["npm", "start"]
