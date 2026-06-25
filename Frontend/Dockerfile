# frontend/Dockerfile
# Stage 1: Build the React app
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Build the app.
# Note: VITE_API_URL defaults to http://localhost:3000 in code,
# but we can override it here if needed for production.
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy the build output to replace the default nginx contents.
COPY --from=build /app/dist /usr/share/nginx/html
# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx and keep it running
CMD ["nginx", "-g", "daemon off;"]