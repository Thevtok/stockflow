# StockFlow — Inventory & Sales Management (Mini ERP)

[![Go Version](https://img.shields.io/badge/Go-1.24-00ADD8?style=flat&logo=go)](https://golang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql)](https://www.postgresql.org)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![Docker Compose](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker)](https://www.docker.com)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-stockflow.kardiahis.id-emerald?style=flat&logo=nginx)](https://stockflow.kardiahis.id)

> 🚀 **Live Demo Available:** [https://stockflow.kardiahis.id](https://stockflow.kardiahis.id)  
> Fully deployed on a Linux Cloud VPS with automated SSL and single-command Docker Compose.
StockFlow is an industrial-grade mini ERP inventory and sales ordering module engineered for warehouse supervisors. It provides an end-to-end vertical slice: **PostgreSQL 16 Database → Go API Service (Gin + GORM) → React TypeScript UI (Vite + Tailwind)**, designed with strict concurrency safety, deadlock prevention, atomic transaction rollbacks, and cross-stack error handling.

---

## 📋 Table of Contents

1. [Architectural Decisions & Concurrency Model](#-architectural-decisions--concurrency-model)
2. [Repository Layout](#-repository-layout)
3. [Quick Start with Docker Compose (Recommended)](#-quick-start-with-docker-compose-recommended)
4. [Manual Local Development Setup](#-manual-local-development-setup)
5. [Running Test Suites](#-running-test-suites)
6. [cURL API Contract & Examples](#-curl-api-contract--examples)
7. [Production Deployment & Live Demo](#-production-deployment--live-demo)
8. [What I Would Improve Next](#-what-i-would-improve-next)
9. [Honest Hours Spent](#-honest-hours-spent)

---

## 🏛️ Architectural Decisions & Concurrency Model

### 1. Data Safety Under High Concurrency (Zero Negative Stock)
A common pitfall in inventory management is the `SELECT-then-UPDATE` anti-pattern:
```go
// ❌ UNSAFE: Vulnerable to race conditions under concurrent orders
db.Where("sku = ?", sku).First(&prod)
if prod.Stock < reqQty { return err }
prod.Stock -= reqQty
db.Save(&prod)
```
If two concurrent checkout requests read `stock = 5` simultaneously for quantity 4, both will proceed, and stock drops to `-3`.

**Our Solution (Pessimistic Row-Level Locking + Atomic Decrement):**
1. **Pessimistic Row-Level Lock:** Each product in an order is locked within a PostgreSQL transaction using `SELECT ... FOR UPDATE`:
   ```go
   tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("sku = ?", item.SKU).First(&product)
   ```
2. **Deadlock Prevention (Deterministic Sorting):** Before acquiring locks, order items are sorted lexicographically by SKU (`sort.Slice(items, ...)`). Regardless of payload order, all transactions lock rows in identical order, eliminating cyclic deadlock graphs.
3. **Atomic Expression:** Stock decrement executes using `gorm.Expr("stock - ?", item.Qty)` with a database-level `CHECK (stock >= 0)` constraint as an ironclad safety net.

### 2. All-or-Nothing Atomic Guarantee
When an order contains multiple line items:
- If **any** item has insufficient stock, the transaction immediately calls `tx.Rollback()` and returns HTTP `409 Conflict`:
  ```json
  {"error": {"code": "INSUFFICIENT_STOCK", "sku": "QZ-AZUL-011", "available": 3}}
  ```
- **Zero state is mutated:** No items are deducted, no order records are created, and no audit movements are written.

### 3. Server-Computed Totals & Integrity
- The client **never supplies unit prices or totals**.
- Prices are strictly queried from the authoritative `products` table, calculated server-side, and recorded permanently into `sales_order_items`.

### 4. Idempotency-Key Support (Bonus Feature)
- `POST /api/orders` checks the optional `Idempotency-Key` HTTP header.
- If a client network timeout triggers an automatic retry with the same key, StockFlow returns the already-created order without double-charging inventory.

### 5. Derived `last_movement_at`
- To maintain single-source-of-truth integrity without risk of desync, `last_movement_at` is derived directly from the immutable `stock_movements` ledger via an indexed subquery:
  ```sql
  SELECT products.*, (SELECT MAX(created_at) FROM stock_movements sm WHERE sm.product_id = products.id) AS last_movement_at
  FROM products ...
  ```

---

## 📂 Repository Layout

```text
stockflow/
├── backend/
│   ├── cmd/api/main.go            # Application entrypoint & graceful shutdown
│   ├── internal/
│   │   ├── config/                # Environment variables & DSN parser
│   │   ├── database/              # GORM PostgreSQL connection pool setup
│   │   ├── domain/                # Core entities, DTOs, and typed AppErrors
│   │   ├── handler/               # HTTP REST handlers, envelopes & responses
│   │   ├── middleware/            # CORS & panic recovery middlewares
│   │   └── repository/            # GORM database queries, locking & transactions
│   ├── Dockerfile                 # Multi-stage minimal Alpine Go image (18MB)
│   ├── go.mod & go.sum            # Pinned Go module dependencies
│   └── tests/                     # Unit & concurrency test suites
├── database/
│   └── init/
│       ├── 01_schema.sql          # PostgreSQL DDL with strict CHECK constraints
│       └── 02_seed.sql            # 15 realistic quartz catalog items & history
├── frontend/
│   ├── src/
│   │   ├── api/client.ts          # Centralized API client & typed error parsing
│   │   ├── components/            # Modular UI: SummaryCards, Table, Modals
│   │   ├── hooks/                 # useDebounce hook
│   │   ├── types/                 # Shared TypeScript domain & API interfaces
│   │   └── utils/                 # Currency formatters & relative date helpers
│   ├── Dockerfile                 # Multi-stage Node builder + Nginx Alpine
│   ├── nginx.conf                 # Internal reverse proxy for /api routes
│   └── vitest.config.ts           # Vitest unit test runner
├── docker-compose.yml             # Full-stack multi-container orchestration
└── README.md                      # Comprehensive engineering documentation
```

---

## 🚀 Quick Start with Docker Compose (Recommended)

StockFlow runs with a single command. It spins up PostgreSQL 16 (auto-applying migrations and seeds), the Go backend, and the React frontend.

To prevent collisions with existing services on busy developer hosts, isolated high ports are configured:
- **Frontend Web UI:** `http://localhost:9520`
- **Backend REST API:** `http://localhost:9521`
- **PostgreSQL Database:** `localhost:9522`

```bash
# Clone and enter the repository
git clone https://github.com/Thevtok/stockflow.git
cd stockflow

# Launch the entire vertical stack
docker compose up --build
```

Within seconds:
- Open your browser at **`http://localhost:9520`** to view the live dashboard.
- The database is pre-seeded with 15 realistic engineered quartz products (Calacatta, Statuario, Marquina, etc.), initial stock levels, and historical orders.

---

## 💻 Manual Local Development Setup

If you prefer running services natively:

### 1. Database (PostgreSQL)
Ensure PostgreSQL is running, then load schema and seeds:
```bash
psql -U postgres -d stockflow -f database/init/01_schema.sql
psql -U postgres -d stockflow -f database/init/02_seed.sql
```

### 2. Backend (Go 1.24+)
```bash
cd backend
cp .env.example .env
go run ./cmd/api
# Running on http://localhost:8080
```

### 3. Frontend (React + TypeScript)
```bash
cd frontend
npm install
npm run dev
# Vite dev server running on http://localhost:3000 (proxies /api to :8080)
```

---

## 🧪 Running Test Suites

### Backend Tests (Validation & Domain Logic)
```bash
cd backend
go test -v ./...
```
*Tests verify (a) insufficient stock rejected with zero rows modified, (b) duplicate SKU rejection, and (c) positive quantity constraints.*

### Backend Concurrency Race Detector
```bash
cd backend
go test -race -v ./...
```

### Frontend Tests (Vitest)
```bash
cd frontend
npm test
```
*Verifies pure logic, Indonesian Rupiah formatting, relative timestamps, and order validation invariants.*

---

## 📡 cURL API Contract & Examples

### 1. List Products (Search & Filter)
```bash
curl -X GET "http://localhost:9521/api/products?search=calacatta&filter=active&page=1&limit=10"
```
**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "sku": "QZ-CALA-001",
      "name": "Calacatta Gold Premium Quartz Slab (3200x1600x20mm)",
      "price": 3850000,
      "stock": 25,
      "is_active": true,
      "created_at": "2026-09-21T13:00:00Z",
      "last_movement_at": "2026-09-21T14:00:00Z"
    }
  ],
  "page": 1,
  "limit": 10,
  "total": 1
}
```

### 2. Adjust Stock (Intake / Deduction)
```bash
curl -X POST "http://localhost:9521/api/products/1/stock" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "out",
    "qty": 2,
    "note": "Sample slab dispatched to customer showroom"
  }'
```

**If stock is insufficient (409 Conflict):**
```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "available": 1
  }
}
```

### 3. Create Sales Order (Atomic Transaction)
```bash
curl -X POST "http://localhost:9521/api/orders" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: req-uuid-992182" \
  -d '{
    "customer": "Raffles Hotel Renovation Project",
    "items": [
      { "sku": "QZ-CALA-001", "qty": 2 },
      { "sku": "ACC-ADHE-012", "qty": 4 }
    ]
  }'
```
**Response (201 Created):**
```json
{
  "id": 3,
  "customer": "Raffles Hotel Renovation Project",
  "status": "CREATED",
  "total": 9100000,
  "created_at": "2026-10-21T14:15:00Z",
  "items": [
    {
      "id": 1,
      "order_id": 3,
      "sku": "QZ-CALA-001",
      "qty": 2,
      "unit_price": 3850000
    },
    {
      "id": 2,
      "order_id": 3,
      "sku": "ACC-ADHE-012",
      "qty": 4,
      "unit_price": 350000
    }
  ]
}
```

### 4. Cancel Order (Stock Restored)
```bash
curl -X POST "http://localhost:9521/api/orders/3/cancel"
```
**Response (200 OK):**
```json
{
  "id": 3,
  "status": "CANCELLED",
  "cancelled_at": "2026-10-21T14:20:00Z"
}
```

### 5. Daily Sales Summary (Bonus Endpoint)
```bash
curl -X GET "http://localhost:9521/api/reports/daily-sales?date=2026-10-21"
```

---

## 🌐 Production Deployment & Live Demo

StockFlow is containerized and deployed on a Linux Cloud VPS behind an Nginx reverse proxy with automated SSL certificates:
- **Live Demo URL:** `https://stockflow.kardiahis.id` (or evaluation domain)
- **Nginx Reverse Proxy Config Snippet:**
  ```nginx
  server {
      server_name stockflow.kardiahis.id;
      location / {
          proxy_pass http://127.0.0.1:9520;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
      }
  }
  ```

---

## 🔮 What I Would Improve Next

Given more time in a production roadmap, I would implement:
1. **Real-time Inventory Sync (WebSockets / SSE):** Push stock decrements to all open warehouse supervisor screens in real time so supervisors see stock badges update without polling.
2. **Multi-Location Warehouse Bin Tracking:** Track inventory across multiple physical locations (e.g., Woodlands Warehouse vs Jurong Yard) with aisle/rack/bin coordinates.
3. **Distributed Locking (Redis Redlock):** If scaling horizontally across multiple database replicas, migrate from row-level locks to distributed locks to offload database transaction managers.
4. **Role-Based Access Control (RBAC):** Differentiate permissions between Warehouse Floor Operators (adjust stock only) and Accounting / Sales Managers (create orders and view reports).

---

## ⏱️ Honest Hours Spent

- **Architecture, Data Modeling & SQL DDL:** 1.0 hour
- **Go Backend API, GORM Transactions & Concurrency Guard:** 2.5 hours
- **React Frontend, Tailwind Dark ERP Design & Cross-Stack Error States:** 2.5 hours
- **Docker Compose Orchestration, Unit Tests & Documentation:** 1.0 hour
- **Total Focused Effort:** **~7.0 hours** (Within the 6–8 hour practical test guideline).
