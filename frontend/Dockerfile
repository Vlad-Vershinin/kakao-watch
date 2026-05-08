FROM node:20 AS build
WORKDIR /app

COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile || (echo "pnpm install failed" && exit 1)

COPY . .
RUN pnpm run build || (echo "Build failed" && exit 1)

FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html

COPY --from=build /app/dist .

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]