# Use Node.js LTS image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Install PM2 globally
RUN npm install -g pm2

# Copy all server files
COPY . .

# Expose the API port
EXPOSE 5000

# Start the server with PM2 in production mode
CMD ["pm2-runtime", "start", "index.js"]

