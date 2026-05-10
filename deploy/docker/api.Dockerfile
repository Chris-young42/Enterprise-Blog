FROM node:20-bullseye AS builder

WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages

RUN corepack enable
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @enterprise-blog/api prisma:generate
RUN pnpm --filter @enterprise-blog/api build
RUN pnpm deploy --filter @enterprise-blog/api --prod /out

FROM node:20-bullseye AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /out ./
COPY --from=builder /workspace/apps/api/prisma ./prisma
COPY --from=builder /workspace/apps/api/dist ./dist

RUN npm install prisma@5.22.0 --no-save

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
