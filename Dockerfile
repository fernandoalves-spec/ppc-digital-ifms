# ─── Estágio 1: Build ────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm@10.4.1

# Copiar arquivos de dependências
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/

# Instalar dependências
RUN pnpm install --frozen-lockfile

# Copiar código fonte
COPY . .

# Build do frontend (Vite) + backend (esbuild)
RUN pnpm build

# ─── Estágio 2: Produção ──────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm@10.4.1

# Copiar apenas o necessário para produção
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/

# Instalar apenas dependências de produção
RUN pnpm install --frozen-lockfile --prod

# Copiar build gerado
COPY --from=builder /app/dist ./dist

# Expor porta (Railway usa a variável PORT)
EXPOSE 3000

# Iniciar servidor
CMD ["node", "dist/index.js"]
