# Build Stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Copy all source code including pre-vendored dependencies
COPY . .

# Compile optimized static binary using vendored modules (Zero network required)
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -mod=vendor -ldflags="-w -s" -o /app/bin/server ./cmd/api

# Final Minimal Runtime Stage
FROM alpine:3.20

WORKDIR /app

# Copy SSL certificates directly from builder
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

ENV TZ=Asia/Jakarta

# Copy compiled binary from builder
COPY --from=builder /app/bin/server /app/server
COPY --from=builder /app/.env.example /app/.env.example

EXPOSE 8080

CMD ["/app/server"]