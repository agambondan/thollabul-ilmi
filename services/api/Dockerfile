# syntax=docker/dockerfile:1
FROM golang:1.26-alpine AS builder
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -trimpath -o ./build/main main.go

FROM gcr.io/distroless/base:nonroot
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo
COPY --from=builder /app/build/main /app/main
COPY data/locations.json /app/data/locations.json
ENV TZ=Asia/Jakarta
EXPOSE 9900
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=15s \
  CMD ["/app/main", "-environment", "container", "-healthcheck"]
CMD ["/app/main", "-environment", "container"]
