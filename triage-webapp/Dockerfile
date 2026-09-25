FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm i
COPY . .
RUN npm run build

# Unprivileged: the platform enforces runAsNonRoot on every pod, and stock
# nginx:alpine's default user is root, which kubelet refuses to start —
# the pod never leaves Progressing. This image runs as UID 101 by default
# and already owns /etc/nginx/conf.d and /var/cache/nginx for it.
FROM nginxinc/nginx-unprivileged:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# --chown matches the base image's own UID:GID (ARG UID=101/GID=101) — a
# plain COPY here would land the file root-owned and undo the base image's
# non-root write access, so the entrypoint's `sed -i` below would 13-fail.
COPY --chown=101:101 nginx/default.conf /etc/nginx/conf.d/default.conf
# --chown matches the base image's active UID:GID for the same reason as
# default.conf above: a plain COPY lands the file root-owned (BuildKit always
# defaults new copies to root regardless of the active USER), and the
# following RUN executes as uid 101 — chmod on a root-owned file it doesn't
# own then fails the build with "Operation not permitted".
COPY --chown=101:101 nginx/15-aep-api-proxy.sh /docker-entrypoint.d/15-aep-api-proxy.sh
RUN chmod +x /docker-entrypoint.d/15-aep-api-proxy.sh
EXPOSE 9090
CMD ["nginx", "-g", "daemon off;"]
