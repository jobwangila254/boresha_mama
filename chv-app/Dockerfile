FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV VITE_PORT=3003 BROWSER=none
EXPOSE 3003

CMD ["npx", "vite", "--host"]
