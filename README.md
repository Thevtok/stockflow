# StockFlow — Inventory & Sales Management (Mini ERP)

[![Go Version](https://img.shields.io/badge/Go-1.24-00ADD8?style=flat&logo=go)](https://golang.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker)](https://www.docker.com)

StockFlow is a resilient, end-to-end mini ERP module engineered for warehouse supervisors to manage product catalogs, record stock adjustments, and process sales orders with **strict concurrency safety** and **atomic ledger guarantees**.

---

## 🏗️ Architecture & Tech Stack

- **Backend:** Go (Golang 1.24) with Gin Web Framework & GORM.
- **Database:** PostgreSQL 16 with deterministic pessimistic row-locking (`FOR UPDATE`) and atomic decrements.
- **Frontend:** React 18 + TypeScript (Vite), strict typing, centralized API client, cross-stack error mapping.
- **Containerization:** Docker & Docker Compose (Zero-config migration and automated seed data).

---

## 📂 Repository Layout

```text
stockflow/
├── backend/            # Go service (cmd/, internal/...)
├── frontend/           # React + TypeScript (Vite)
├── docker-compose.yml  # PostgreSQL + backend + frontend orchestration
└── README.md           # Engineering documentation & API contract
```

---

*Engineered with precision for high-concurrency warehouse operations.*
