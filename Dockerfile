# Stage 1: Build Environment
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies (including devDependencies for TypeScript)
COPY package*.json ./
RUN npm ci

# Copy source code and build the TypeScript project
COPY . .
RUN npm run build

# Stage 2: Production Runtime
FROM node:20-alpine

WORKDIR /app

# Set Node environment to production
ENV NODE_ENV=production

# Copy only package files and install production dependencies to keep the image small
COPY package*.json ./
RUN npm ci --only=production

# Copy compiled JavaScript from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the API Gateway port
EXPOSE 3000

# Start the compiled application
CMD ["node", "dist/app.js"]