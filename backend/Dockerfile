# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files, patches, and install
COPY package*.json ./
COPY patches/ ./patches/
RUN npm install

# Copy source code
COPY . .

# Expose the port your app runs on
EXPOSE 3000

# Start the application
CMD ["node", "index.js"]