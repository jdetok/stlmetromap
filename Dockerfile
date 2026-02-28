FROM golang:1.26

WORKDIR /app

COPY go.mod go.sum .env ./

RUN go mod download

COPY ./src ./src
COPY ./pkg ./pkg

RUN CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -o bin/app ./src

ENTRYPOINT [ "/app/bin/app" ]

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD [ "curl", "-f", "http://localhost:3333/health" ]