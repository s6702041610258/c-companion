FROM node:24-alpine@sha256:ebfe2f90462722a7a4de65e91990e97fe0d401c70e0e762c5b53302f905ec1c1 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY index.html vite.config.ts tsconfig.json ./
COPY web ./web
RUN npx tsc && npm run build
FROM node:24-alpine@sha256:ebfe2f90462722a7a4de65e91990e97fe0d401c70e0e762c5b53302f905ec1c1
WORKDIR /app
ENV NODE_ENV=production
ARG RELEASE_ID=1.0.0
ARG SOURCE_REVISION=unknown
ENV RELEASE_ID=$RELEASE_ID
LABEL org.opencontainers.image.revision=$SOURCE_REVISION
COPY --from=build /app/dist ./dist
COPY app ./app
COPY ops ./ops
COPY book/index.json ./book/index.json
RUN mkdir -p /app/data /backups /state && chown node:node /app/data /backups /state
USER node
EXPOSE 8080
CMD ["node","app/server.mjs"]
