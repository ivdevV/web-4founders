FROM node:20-alpine
WORKDIR /app
COPY server/package.json server/package-lock.json* server/
RUN cd server && npm ci --omit=dev
COPY public/ public/
COPY guia/ guia/
COPY server/ server/
ENV PORT=3000
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1
CMD ["node", "server/index.js"]
