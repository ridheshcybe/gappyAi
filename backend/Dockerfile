# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files and install
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY . .

# Expose the port your app runs on
EXPOSE 3000

# Start the application
CMD ["node", "index.js"]