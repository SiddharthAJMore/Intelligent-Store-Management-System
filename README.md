# Intelligent Store Management System

[![Java](https://img.shields.io/badge/Java-17-blue.svg)](https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-Vite-61dafb.svg)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A production-minded full-stack retail management system for grocery stores and small retail businesses. The application combines billing, inventory management, stock movement tracking, and sales visibility in a single platform to support faster operations and better decision-making.

## Overview

Small and medium grocery stores often rely on disconnected tools for billing, inventory, and reporting. This project addresses that gap by providing a unified system where transactional data and inventory data stay synchronized in real time.

It is designed to help store owners and cashiers:

- process sales efficiently
- keep inventory updated automatically
- track stock movement history
- manage products and categories
- monitor operational activity through reporting

## Key Features

### Core Operations

- Role-based authentication for `ADMIN` and `CASHIER`
- Fast POS billing workflow
- Real-time inventory updates after each sale
- Product and category management
- Stock movement audit trail
- Sales tracking and reporting

### Business Value

- Reduces manual billing effort
- Improves stock visibility
- Helps prevent stockouts and overstocking
- Maintains consistency between billing and inventory data
- Supports better day-to-day retail decisions

## Tech Stack

- **Backend:** Java 17, Spring Boot
- **Frontend:** React, Vite
- **Database:** PostgreSQL

## Repository Structure

- `backend/` — Spring Boot backend for REST APIs, business logic, security, and persistence
- `frontend/` — React frontend for the user interface
- SQL scripts — used for schema creation and data provisioning

## Prerequisites

Before running the project, make sure the following are installed:

- Java 17+
- Maven 3.8+
- Node.js 18+
- npm 9+
- PostgreSQL 15+
- Git

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/SiddharthAJMore/Intelligent-Store-Management-System.git
cd Intelligent-Store-Management-System
```

### 2. Database setup

1. Start PostgreSQL locally.
2. Create a database for the project.
3. Run the provided SQL DDL/DML scripts to create tables and seed data.
4. Update database credentials in `backend/src/main/resources/application.yml`.

Example:

```sql
CREATE DATABASE grocery_db;
```

### 3. Run the backend

```bash
cd backend
mvn clean install -DskipTests
mvn spring-boot:run
```

The backend service will start using the configuration defined in `application.yml`.

### 4. Run the frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Then open:

```text
http://localhost:5173
```

## Default Users

Use these credentials for local testing:

| Username | Password | Role |
| --- | --- | --- |
| `admin` | `Test@1234` | ADMIN |
| `siddharth_m` | `Test@1234` | CASHIER |
| `devraj_s` | `Test@1234` | CASHIER |

## Configuration Notes

- Backend and frontend are run separately.
- Secrets are currently managed in `application.yml`.
- Database provisioning is handled through SQL scripts.
- Deployment details and screenshots can be added later when available.

## Suggested Future Enhancements

- Environment-based secret management
- Docker support
- Centralized logging
- Automated tests and CI/CD pipeline
- Screenshots and demo video
- Production deployment guide

## License

This project is licensed under the MIT License.
