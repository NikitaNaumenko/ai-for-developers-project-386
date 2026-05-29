FROM golang:1.26.3-alpine AS build

WORKDIR /src
COPY go.mod go.sum* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /out/calendar-api ./cmd/api

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/calendar-api /calendar-api
USER nonroot:nonroot
ENTRYPOINT ["/calendar-api"]
