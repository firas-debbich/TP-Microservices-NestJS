# TP Microservices — NestJS

A microservices demo built with NestJS, TypeORM, gRPC, Kafka, and GraphQL.

## Architecture

```
┌─────────────────┐     REST      ┌─────────────────┐
│  query-service  │──────────────▶│ catalog-service │
│  (GraphQL :3003)│               │   (REST :3001)  │
│                 │──────────────▶│  order-service  │
└─────────────────┘     REST      │   (REST :3002)  │
                                  └────────┬────────┘
                                           │ gRPC
                                           ▼
                                  ┌─────────────────┐
                                  │  stock-service  │
                                  │  (gRPC :5000)   │
                                  └─────────────────┘
                                           │ Kafka
                                           ▼
                                  ┌─────────────────┐
                                  │notification-svc │
                                  │ (Kafka consumer)│
                                  └─────────────────┘
```

| Service              | Protocol | Port | Description                                      |
|----------------------|----------|------|--------------------------------------------------|
| catalog-service      | HTTP/REST | 3001 | Product CRUD + Swagger                           |
| order-service        | HTTP/REST | 3002 | Order creation, gRPC stock check, Kafka publish  |
| query-service        | GraphQL   | 3003 | Read-only + createOrder mutation via GraphQL     |
| stock-service        | gRPC      | 5000 | Stock reservation (internal, no HTTP)            |
| notification-service | Kafka     | —    | Consumes `order.created`, simulates email        |
| PostgreSQL           | TCP       | 5435 | Host-exposed port (maps to container 5432)       |
| Kafka                | TCP       | 9092 | Broker                                           |

---

## Quick Start (Docker)

```bash
# Start all infrastructure + services
docker compose up --build

# Stop and remove containers
docker compose down

# Wipe volumes (reset databases)
docker compose down -v
```

Services start in dependency order. Catalog and stock are seeded automatically on first boot.

---

## Local Development (per service)

Each service is an independent NestJS app. Run these from inside the service directory.

```bash
cd catalog-service   # or order-service / stock-service / query-service / notification-service

npm install
npm run start:dev    # watch mode
npm run build        # compile TypeScript
npm run start:prod   # run compiled output
```

### Database migrations

```bash
npm run migration:run      # apply pending migrations
npm run migration:revert   # revert last migration
npm run migration:generate -- src/migrations/MigrationName  # generate from entity diff
```

### Seeding

```bash
npm run seed   # skips if table already has rows
```

---

## Service Reference

### catalog-service — `http://localhost:3001`

REST API for managing products. Swagger UI at `http://localhost:3001/api`.

| Method | Path             | Body / Params               | Description          |
|--------|------------------|-----------------------------|----------------------|
| POST   | `/products`      | `{name, price, stock}`      | Create a product     |
| GET    | `/products`      | —                           | List all products    |
| GET    | `/products/:id`  | `id` (number)               | Get product by ID    |
| PATCH  | `/products/:id`  | `{name?, price?, stock?}`   | Update a product     |
| DELETE | `/products/:id`  | `id` (number)               | Delete a product     |

### order-service — `http://localhost:3002`

REST API for orders. Swagger UI at `http://localhost:3002/api`.

On `POST /orders` the service: (1) calls stock-service via gRPC to check and reserve stock, (2) saves the order to PostgreSQL, (3) publishes an `order.created` event to Kafka.

| Method | Path          | Body                                  | Description        |
|--------|---------------|---------------------------------------|--------------------|
| POST   | `/orders`     | `{productId, quantity, customerEmail}` | Create an order   |
| GET    | `/orders`     | —                                     | List all orders    |
| GET    | `/orders/:id` | `id` (number)                         | Get order by ID    |

### stock-service — gRPC `:5000`

Internal only. Exposes a single RPC:

```protobuf
service StockService {
  rpc CheckAndReserve (StockRequest) returns (StockResponse);
}
```

### notification-service

Kafka consumer only (no HTTP port). Listens on topic `order.created` and logs a simulated email to stdout.

### query-service — `http://localhost:3003/graphql`

GraphQL API (Apollo). Playground available at `http://localhost:3003/graphql`.

**Queries**
```graphql
query { products { id name price stock } }
query { productById(id: "1") { id name price stock } }
query { orders { id productId quantity customerEmail status } }
query { orderById(id: "1") { id productId quantity customerEmail status } }
```

**Mutations**
```graphql
mutation {
  createOrder(input: { productId: 1, quantity: 2, customerEmail: "user@example.com" }) {
    id status
  }
}
```

---

## Test Cases

### 1. List seeded products

```bash
curl http://localhost:3001/products
```

Expected: array of 4 products — Laptop Pro, Mechanical Keyboard, USB-C Hub, Monitor 4K.

---

### 2. Create a product

```bash
curl -X POST http://localhost:3001/products \
  -H "Content-Type: application/json" \
  -d '{"name": "Wireless Mouse", "price": 35, "stock": 100}'
```

Expected: `201` with the created product object including `id`.

---

### 3. Update a product

```bash
curl -X PATCH http://localhost:3001/products/1 \
  -H "Content-Type: application/json" \
  -d '{"price": 999}'
```

Expected: `200` with the updated product.

---

### 4. Place a valid order (happy path)

```bash
curl -X POST http://localhost:3002/orders \
  -H "Content-Type: application/json" \
  -d '{"productId": 1, "quantity": 2, "customerEmail": "client@test.com"}'
```

Expected: `201` with the order. Check `notification-service` logs — you should see the Kafka event and simulated email printed.

---

### 5. Place an order with insufficient stock

```bash
# Laptop Pro has stock of 10; request 999
curl -X POST http://localhost:3002/orders \
  -H "Content-Type: application/json" \
  -d '{"productId": 1, "quantity": 999, "customerEmail": "client@test.com"}'
```

Expected: `409 Conflict` — gRPC check fails before the order is saved.

---

### 6. Query products via GraphQL

```bash
curl -X POST http://localhost:3003/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ products { id name price stock } }"}'
```

---

### 7. Create an order via GraphQL mutation

```bash
curl -X POST http://localhost:3003/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { createOrder(input: { productId: 2, quantity: 1, customerEmail: \"test@example.com\" }) { id status } }"
  }'
```

Expected: order object with `status: "CONFIRMED"`.

---

### 8. Validation error — missing field

```bash
curl -X POST http://localhost:3001/products \
  -H "Content-Type: application/json" \
  -d '{"name": "Incomplete"}'
```

Expected: `400 Bad Request` with validation error details for `price` and `stock`.

---

## Seed Data

| ID | Product            | Price  | Initial Stock |
|----|--------------------|--------|---------------|
| 1  | Laptop Pro         | 1200   | 10            |
| 2  | Mechanical Keyboard| 150    | 25            |
| 3  | USB-C Hub          | 45     | 50            |
| 4  | Monitor 4K         | 750    | 8             |

---

## Environment Variables

Each service reads from its own `.env` file (used for local dev; Docker Compose overrides these).

| Variable            | Service(s)                    | Example                                    |
|---------------------|-------------------------------|--------------------------------------------|
| `PORT`              | catalog, order, query         | `3001`                                     |
| `DATABASE_URL`      | catalog, stock, order         | `postgresql://postgres:postgres@localhost:5435/catalog_db` |
| `GRPC_PORT`         | stock                         | `5000`                                     |
| `KAFKA_BROKERS`     | order, notification           | `localhost:9092`                           |
| `STOCK_SERVICE_URL` | order                         | `localhost:5000`                           |
| `CATALOG_SERVICE_URL`| query                        | `http://localhost:3001`                    |
| `ORDER_SERVICE_URL` | query                         | `http://localhost:3002`                    |
