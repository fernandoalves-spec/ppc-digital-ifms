FROM node:20-alpine

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm@10.4.1

# Copiar arquivos de dependências
COPY package.json pnpm-lock.yaml ./

# Instalar TODAS as dependências (incluindo devDependencies para o build)
RUN pnpm install --frozen-lockfile

# Copiar código fonte
COPY . .

# Build do frontend (Vite) + backend (esbuild)
RUN pnpm build

# Remover devDependencies após o build para reduzir tamanho da imagem
RUN pnpm prune --prod

# Expor porta padrão (Railway sobrescreve com a variável PORT)
EXPOSE 3000

# Script de inicialização: cria tabelas se não existirem, depois inicia o servidor
CMD ["sh", "-c", "node scripts/init-db.mjs && node dist/index.js"]
