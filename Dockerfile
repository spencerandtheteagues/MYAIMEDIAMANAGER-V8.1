# ---- Dependencies Stage ----
# Install all dependencies, including dev dependencies, required for the build
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

# ---- Builder Stage ----
# Use the full node_modules to build the application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- Production Stage ----
# Create the final, lean production image
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copy package files and install ONLY production dependencies
COPY package*.json ./
RUN npm install --production=true

# Copy the built application artifacts from the builder stage
COPY --from=builder /app/dist ./dist
COPY drizzle.config.ts ./

# Expose the port and define the start command
EXPOSE 3000
CMD [ "npm", "start" ]
