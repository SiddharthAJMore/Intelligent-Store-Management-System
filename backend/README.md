# Grocery Backend

Spring Boot backend for the Smart Grocery Billing and Inventory Management System.

## Implemented in this scaffold

- Spring Boot 3.2 + Java 17 + Maven setup
- PostgreSQL + Flyway migration wiring
- JWT-based stateless security setup
- Auth login endpoint (`POST /api/auth/login`)
- Core entities and repository interfaces for all modules
- `V1` schema migration based on the project document
- Minimal `V2` seed data migration

## Run locally

1. Ensure PostgreSQL is running.
2. Create database `grocery_db`.
3. Configure credentials with env vars (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`) if needed.
4. Run backend:

```cmd
cd backend
mvn spring-boot:run
```

## Default seed users

- `admin` (ADMIN)
- `ravi_k` (CASHIER)

The password hashes in this scaffold seed are placeholders. For login testing, replace them with valid BCrypt hashes or replace `V2__seed_data.sql` with your generated seed file.

## Notes

- `V2__seed_data.sql` currently contains a minimal seed set for bootstrapping.
- If you already have the generated large seed script (812 invoices), replace `V2__seed_data.sql` with that file.
