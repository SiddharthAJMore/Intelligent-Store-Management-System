# Intelligent Store Management System

A full-stack retail management system for small and medium grocery stores, built to combine billing, inventory tracking, and basic analytics in one place.

## Overview

This project provides a practical point-of-sale and store management solution with:

- Fast invoice generation
- Real-time inventory updates
- Stock movement tracking
- Sales and purchase data visibility
- Basic analytics for store operations

The system is designed to help grocery stores manage daily operations more efficiently while keeping data consistent across billing and inventory.

## Tech Stack

- **Backend:** Java 17, Spring Boot
- **Frontend:** React, Vite
- **Database:** PostgreSQL

## Project Structure

- `backend/` — Spring Boot application for APIs, business logic, security, and database access
- `frontend/` — React application for the user interface
- SQL scripts — used for database schema creation and data provisioning

## Features

- User authentication with role-based access
- POS billing workflow
- Inventory management
- Stock movement audit trail
- Product and category management
- Sales tracking and reporting
- Data-driven store insights

## Default Users

Use these credentials for local development:

| Username | Password | Role |
| --- | --- | --- |
| `admin` | `Test@1234` | ADMIN |
| `siddharth_m` | `Test@1234` | CASHIER |
| `devraj_s` | `Test@1234` | CASHIER |

## Local Setup

### Prerequisites

- Java 17+
- Maven 3.8+
- Node.js 18+
- npm 9+
- PostgreSQL 15+

### Database Setup

1. Create a PostgreSQL database.
2. Run the SQL DDL/DML scripts provided in the repository to create the schema and seed the data.
3. Update database credentials in `backend/src/main/resources/application.yml`.

### Backend Setup

```bash
cd backend
mvn clean install -DskipTests
mvn spring-boot:run
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend typically runs at:

```text
http://localhost:5173
```

## Notes

- Backend and frontend are deployed/run separately.
- Secrets are currently managed through `application.yml`.
- Deployment and screenshots can be added later.

## License

MIT
