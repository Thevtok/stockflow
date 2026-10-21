# Build Stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY go.mod go.sum ./
RUN go mod download

# Copy application source code
COPY . .

# Compile optimized static binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o /app/bin/server ./cmd/api

# Final Minimal Runtime Stage
FROM alpine:3.20

WORKDIR /app

# Copy SSL certificates and timezone directly from builder (Zero apk network calls needed)
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

ENV TZ=Asia/Jakarta

# Copy compiled binary from builder
COPY --from=builder /app/bin/server /app/server
COPY --from=builder /app/.env.example /app/.env.example

EXPOSE 8080

CMD ["/app/server"]