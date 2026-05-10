FROM node:20-bullseye AS builder

WORKDIR /workspace

ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages

RUN corepack enable
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @enterprise-blog/web build

FROM nginx:1.27-alpine AS runner

COPY deploy/nginx/web.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /workspace/apps/web/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
