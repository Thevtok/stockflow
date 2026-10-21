# Stage 1: Build React static assets
FROM node:20-alpine AS builder

WORKDIR /app

ENV NODE_ENV=development

COPY package*.json ./
RUN npm install --include=dev

COPY . .
RUN npm run build

# Stage 2: Minimal Nginx web server
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]