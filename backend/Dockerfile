FROM node:20-alpine

WORKDIR /app

# Install build dependencies for better-sqlite3 native compilation
RUN apk add --no-cache python3 make g++ gcc

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Ensure data directory exists
RUN mkdir -p data

EXPOSE 5001

CMD ["node", "src/server.js"]
