FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev

COPY . .

RUN npx prisma generate
RUN mkdir -p uploads/profiles uploads

EXPOSE 5000

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN sed -i 's/\r$//' /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "server.js"]
