# TP Microservices — NestJS

A microservices demo built with NestJS, TypeORM, gRPC, Kafka, and GraphQL.

## Why four different protocols?

Each communication style solves a different problem. Using the same protocol everywhere would mean either accepting unnecessary latency, tight coupling, or a poor developer experience depending on which one you picked.

**REST** is used by `catalog-service` and `order-service` because these are resource-oriented services exposed to the outside world. HTTP is universally understood, trivially consumable by browsers and CLI tools, and maps naturally to CRUD operations on entities (`POST /orders`, `GET /products/:id`). Swagger documentation comes for free.

**gRPC** is used between `order-service` and `stock-service` because this call is synchronous, internal, and latency-sensitive — an order cannot be confirmed without knowing whether stock is available. gRPC uses Protocol Buffers (binary, compact) and enforces a strict typed contract via `.proto`, which prevents interface drift between services without the overhead of HTTP+JSON parsing. A REST call here would add unnecessary serialization cost and looser contracts on a hot path.

**Kafka** is used between `order-service` and `notification-service` because sending a confirmation email is not part of placing an order — it is a side effect. Making `order-service` wait for the email to be sent would couple an unrelated concern to the critical path and make the order endpoint as slow as the slowest consumer. Kafka decouples them: the order is confirmed the moment it is saved and the event is published; the notification-service processes it independently, can fall behind and catch up, and can be restarted without affecting order creation.

**GraphQL** is used by `query-service` because it acts as an aggregation layer over multiple REST services. Instead of forcing clients to call `catalog-service` and `order-service` separately and deal with over-fetching, GraphQL lets clients declare exactly the fields they need in a single request. The schema is introspective and self-documenting, and the mutation (`createOrder`) proxies to `order-service` so clients have a single entry point for both reads and writes.

| Protocol | Interaction style | Why it fits here |
|----------|-------------------|------------------|
| REST     | Synchronous, request/response | External-facing CRUD, tooling ecosystem, HTTP semantics |
| gRPC     | Synchronous, request/response | Internal, typed contract, binary efficiency on a critical path |
| Kafka    | Asynchronous, event-driven    | Fire-and-forget side effect, decouples services, consumer resilience |
| GraphQL  | Synchronous, client-driven    | Aggregates multiple sources, avoids over-fetching, single API surface |

---

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

![Order Service Swagger](screenShot/image%20copy%207.png)

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

![GET /products — list all](screenShot/image%20copy.png)

---

### 2. Create a product

```bash
curl -X POST http://localhost:3001/products \
  -H "Content-Type: application/json" \
  -d '{"name": "Mechanical Keyboard", "price": 150, "stock": 5}'
```

Expected: `201` with the created product object including `id`.

![POST /products — 201 Created](screenShot/image.png)

---

### 3. Update a product

```bash
curl -X PATCH http://localhost:3001/products/1 \
  -H "Content-Type: application/json" \
  -d '{"price": 99}'
```

Expected: `200` with the updated product.

![PATCH /products/1 — price updated](screenShot/image%20copy%202.png)

---

### 4. Place a valid order (happy path)

```bash
curl -X POST http://localhost:3002/orders \
  -H "Content-Type: application/json" \
  -d '{"productId": 1, "quantity": 2, "customerEmail": "alice@test.com"}'
```

Expected: `201` with `status: "CONFIRMED"`. Check `notification-service` logs — you should see the Kafka event and simulated email printed.

![POST /orders — 201 CONFIRMED](screenShot/image%20copy%203.png)

---

### 5. List all orders

```bash
curl http://localhost:3002/orders
```

Expected: `200` with the full list of confirmed orders.

![GET /orders — list all](screenShot/image%20copy%206.png)

---

### 6. Place an order with insufficient stock

```bash
curl -X POST http://localhost:3002/orders \
  -H "Content-Type: application/json" \
  -d '{"productId": 1, "quantity": 9999, "customerEmail": "fail@test.com"}'
```

Expected: `409 Conflict` — gRPC check fails before the order is saved. Response includes `remainingStock`.

![POST /orders — 409 Conflict](screenShot/image%20copy%204.png)

---

### 7. Validation error — invalid order fields

```bash
curl -X POST http://localhost:3002/orders \
  -H "Content-Type: application/json" \
  -d '{"productId": 1, "quantity": -5, "customerEmail": "notanemail"}'
```

Expected: `400 Bad Request` listing all failing constraints (`quantity must be a positive number`, `customerEmail must be an email`).

![POST /orders — 400 Bad Request](screenShot/image%20copy%205.png)

---

### 8. GraphQL — query products and orders

Open the playground at `http://localhost:3003/graphql` or run:

```graphql
query {
  products { id name price stock }
  orders { id customerEmail status quantity }
}
```

Both resource types are returned in a single round-trip — no second HTTP call needed.

![GraphQL — products + orders combined query](screenShot/image%20copy%2010.png)

---

### 9. GraphQL — query a single product by ID

```graphql
query {
  productById(id: "1") { price name stock }
}
```

Only the requested fields are returned — no over-fetching.

![GraphQL — productById](screenShot/image%20copy%209.png)

---

### 10. GraphQL — createOrder mutation

```graphql
mutation {
  createOrder(input: { productId: 1, quantity: 1, customerEmail: "graphql@test.com" }) {
    id status customerEmail
  }
}
```

Expected: order object with `status: "CONFIRMED"`. Internally the mutation proxies to `order-service` via HTTP, which in turn calls `stock-service` via gRPC and publishes to Kafka.

![GraphQL mutation — createOrder CONFIRMED](screenShot/image%20copy%208.png)

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
