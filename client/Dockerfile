# Use Node.js LTS image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install --save-dev @babel/plugin-proposal-private-property-in-object

RUN npm install

# Copy all frontend files
COPY . .

# Build the React app
RUN npm run build

# Use an official Nginx image as the base image
FROM nginx:alpine

# Copy the build output to replace the default Nginx contents
COPY --from=0 /app/build /usr/share/nginx/html

# Copy the Nginx configuration file
COPY default.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx when the container launches
CMD ["nginx", "-g", "daemon off;"]
