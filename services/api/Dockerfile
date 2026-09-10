# syntax=docker/dockerfile:1
FROM golang:1.26-alpine AS builder
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -trimpath -o ./build/main main.go
# Seeded so the named volume mounted here in production gets nonroot (65532)
# ownership on first creation — Docker copies a fresh volume mount point's
# initial content/perms from the image, and the distroless nonroot user can't
# otherwise write into a root-owned volume.
RUN mkdir -p /app/data/wa && chown -R 65532:65532 /app/data/wa

FROM gcr.io/distroless/base:nonroot
# The seeders resolve their data with relative paths, so the runtime needs the
# same working directory the files are copied into — without this they look in
# / and silently skip.
WORKDIR /app
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo
COPY --from=builder /app/build/main /app/main
COPY data/locations.json /app/data/locations.json
COPY data/hadith_section_translations_id.json /app/data/hadith_section_translations_id.json
# The *FromFile seeders read from data/static at runtime. Without this the whole
# file-based content pipeline silently no-ops in the container ("tidak ditemukan
# — skip") and only the Go-hardcoded seeders ever run.
COPY data/static /app/data/static
COPY --from=builder --chown=65532:65532 /app/data/wa /app/data/wa
ENV TZ=Asia/Jakarta
EXPOSE 9900
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=15s \
  CMD ["/app/main", "-environment", "container", "-healthcheck"]
CMD ["/app/main", "-environment", "container"]
