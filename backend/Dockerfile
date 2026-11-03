FROM node:20-alpine

WORKDIR /app

# Install openssl for Prisma engine support
RUN apk add --no-cache openssl libc6-compat

# Install app dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# Copy full source
COPY . .

# Generate Prisma Client & compile TypeScript
RUN npx prisma generate
RUN npm run build

# Make startup entrypoint executable
RUN chmod +x docker-entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/src/server.js"]
