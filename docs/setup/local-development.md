# Local Development

## Full Stack

```bash
make docker-up
```

The compose file builds:

- API service from `services/api`
- Web app from `apps/web`

Default local ports:

- Backend API: `http://localhost:29900`
- Frontend: `http://localhost:23000`
- Postgres: `localhost:54320`
- Redis: `localhost:63790`

The web app proxies same-origin requests under `/api/v1/*` to the backend via
`API_INTERNAL_URL` (Docker default: `http://tholabul-ilmi-api:9900`; local
fallback: `http://localhost:29900`). Keep `NEXT_PUBLIC_API_URL` empty for phone
or LAN testing so the browser calls the web origin instead of a hard-coded
laptop IP.

## API Service

```bash
make run-local
```

## Web App

```bash
make web-dev
```
