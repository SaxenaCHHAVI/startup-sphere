FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Disable telemetry and build
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Expose Next.js port
EXPOSE 3000

# Start production server
CMD ["npm", "run", "start"]
