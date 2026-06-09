# Smart Grocery Billing and Inventory Management System
## Project Context Document — for use with Claude

> Feed this file at the start of every new Claude session to restore full project context.
> Update it at the end of every session with new decisions and progress.

---

## 1. Project Overview

A full-stack web application for a small Indian grocery store (kirana/supermarket style).
Covers billing, inventory tracking, sales reporting, and AI-assisted analytics.

**Core use cases:**
- Cashier scans/selects products and generates a bill for a customer
- Admin manages products, categories, stock levels, and users
- Dashboard shows daily sales summary and low-stock alerts
- Analytics engine (manual trigger) computes bought-together pairs and restock suggestions

**Intended as a college final-year project** with production-quality code.
Must be demonstrable with realistic Indian market data.

---

## 2. Tech Stack — Final Decisions

| Layer | Technology | Notes |
|---|---|---|
| Backend | Java 17, Spring Boot 3.2.x | REST API |
| ORM | Spring Data JPA + Hibernate | |
| Database | PostgreSQL | Managed by Flyway |
| Migrations | Flyway | File naming: `V{n}__{description}.sql` |
| Security | Spring Security + JWT (jjwt 0.12.x) | Stateless, BCrypt passwords |
| Build | Maven | |
| Frontend | Vite + React (separate project) | Not started yet |
| Deployment | Vercel (frontend), Railway/Render (backend) | Planned |

---

## 3. Scope Decisions (locked)

| Feature | Decision |
|---|---|
| Discount on invoice | ❌ Out of scope for MVP |
| Tax on invoice | ❌ Out of scope for MVP |
| Inventory model | Stock count in `inventory` table + `stock_movements` audit log |
| Analytics trigger | Manual only (admin clicks "Run Analysis") |
| User roles | ADMIN and CASHIER only |
| Invoice number | PostgreSQL sequence starting at 1000, format `INV-1000` |
| Bought-together metrics | Support + Confidence only (no Lift for MVP) |
| Restock logic | Sales-rate based: avg daily sales over last 30 days × lead time |
| Hard deletes | Never — `is_active` flag on products and users |
| Price history | `unit_price` snapshot on every `sales_invoice_items` row |

---

## 4. Database Schema

### Sequence
```sql
CREATE SEQUENCE invoice_number_seq
    START WITH 1000
    INCREMENT BY 1
    NO CYCLE;
-- Usage in app: 'INV-' || nextval('invoice_number_seq')
```

### Tables (in dependency order)

#### `roles`
| Column | Type | Notes |
|---|---|---|
| id | BIGSERIAL PK | |
| name | VARCHAR(50) UNIQUE NOT NULL | Values: `ADMIN`, `CASHIER` |

Seeded with `ADMIN` and `CASHIER` rows in V1 DDL script.

---

#### `users`
| Column | Type | Notes |
|---|---|---|
| id | BIGSERIAL PK | |
| username | VARCHAR(100) UNIQUE NOT NULL | |
| email | VARCHAR(255) UNIQUE NOT NULL | |
| password_hash | VARCHAR(255) NOT NULL | BCrypt |
| role_id | FK → roles | |
| is_active | BOOLEAN DEFAULT TRUE | Soft disable |
| created_at | TIMESTAMP NOT NULL | |

---

#### `categories`
| Column | Type | Notes |
|---|---|---|
| id | BIGSERIAL PK | |
| name | VARCHAR(100) UNIQUE NOT NULL | |
| description | TEXT | Nullable |
| created_at | TIMESTAMP NOT NULL | |

---

#### `products`
| Column | Type | Notes |
|---|---|---|
| id | BIGSERIAL PK | |
| name | VARCHAR(255) NOT NULL | |
| category_id | FK → categories | |
| price | NUMERIC(10,2) NOT NULL | Current selling price. CHECK >= 0 |
| unit | VARCHAR(50) NOT NULL | e.g. `piece`, `kg`, `litre`, `dozen` |
| sku | VARCHAR(100) UNIQUE | Nullable |
| is_active | BOOLEAN DEFAULT TRUE | Soft delete — never hard delete |
| created_at | TIMESTAMP NOT NULL | |
| updated_at | TIMESTAMP NOT NULL | |

---

#### `inventory`
| Column | Type | Notes |
|---|---|---|
| id | BIGSERIAL PK | |
| product_id | FK → products UNIQUE | One row per product |
| quantity | INTEGER DEFAULT 0 | Current stock. CHECK >= 0. Source of truth |
| low_stock_threshold | INTEGER DEFAULT 10 | Alert fires when quantity ≤ this |
| last_updated | TIMESTAMP NOT NULL | |

> Do NOT derive current stock from `stock_movements` at query time — always read `inventory.quantity`.

---

#### `stock_movements`
| Column | Type | Notes |
|---|---|---|
| id | BIGSERIAL PK | |
| product_id | FK → products | |
| movement_type | VARCHAR(20) NOT NULL | `STOCK_IN`, `SALE_OUT`, `ADJUSTMENT` |
| quantity_change | INTEGER NOT NULL | Positive = in, Negative = out |
| reference_id | BIGINT | invoice id when SALE_OUT, else NULL |
| notes | TEXT | Nullable |
| created_at | TIMESTAMP NOT NULL | |

---

#### `sales_invoices`
| Column | Type | Notes |
|---|---|---|
| id | BIGSERIAL PK | |
| invoice_number | VARCHAR(50) UNIQUE NOT NULL | `INV-1000`, `INV-1001`, … |
| cashier_id | FK → users | |
| total_amount | NUMERIC(10,2) NOT NULL | Sum of all line item subtotals. CHECK >= 0 |
| created_at | TIMESTAMP NOT NULL | |

No tax or discount columns — both out of scope for MVP.

---

#### `sales_invoice_items`
| Column | Type | Notes |
|---|---|---|
| id | BIGSERIAL PK | |
| invoice_id | FK → sales_invoices | |
| product_id | FK → products | |
| quantity | INTEGER NOT NULL | CHECK > 0 |
| unit_price | NUMERIC(10,2) NOT NULL | **Price snapshot at time of sale** |
| subtotal | NUMERIC(10,2) NOT NULL | quantity × unit_price. Stored, not computed |

> `unit_price` is critical. Never reference `products.price` for historical invoices.

---

#### `association_rules` *(analytics output)*
| Column | Type | Notes |
|---|---|---|
| id | BIGSERIAL PK | |
| product_a_id | FK → products | |
| product_b_id | FK → products | |
| support | NUMERIC(8,4) NOT NULL | Fraction of transactions containing both |
| confidence | NUMERIC(8,4) NOT NULL | P(B given A) |
| co_occurrence_count | INTEGER NOT NULL | Raw pair count |
| computed_at | TIMESTAMP NOT NULL | |

Constraint: `product_a_id <> product_b_id`.
This table is **truncated and repopulated** on every analytics run.

---

#### `restock_suggestions` *(analytics output)*
| Column | Type | Notes |
|---|---|---|
| id | BIGSERIAL PK | |
| product_id | FK → products | |
| current_stock | INTEGER NOT NULL | Snapshot at time of analytics run |
| avg_daily_sales | NUMERIC(8,2) NOT NULL | Avg units/day over last 30 days |
| days_until_stockout | NUMERIC(6,1) | NULL when avg_daily_sales = 0 |
| suggested_restock_qty | INTEGER | 30-day cover target |
| computed_at | TIMESTAMP NOT NULL | |

This table is **truncated and repopulated** on every analytics run.

---

### Indexes
```sql
-- Users
idx_users_role_id

-- Products
idx_products_category, idx_products_is_active

-- Stock movements
idx_stock_movements_product, idx_stock_movements_type, idx_stock_movements_created_at

-- Sales invoices
idx_sales_invoices_cashier, idx_sales_invoices_created_at

-- Sales invoice items
idx_invoice_items_invoice, idx_invoice_items_product

-- Association rules
idx_assoc_rules_product_a, idx_assoc_rules_product_b

-- Restock suggestions
idx_restock_product
```

---

## 5. Migration Files

| File | Location | Status |
|---|---|---|
| `V1__init_schema.sql` | `db/V1__init_schema.sql` | ✅ Done |
| `V2__seed_data.sql` | `db/V2__seed_data.sql` | ✅ Done (generated) |
| `generate_seed.py` | `db/generate_seed.py` | ✅ Done |

**Flyway classpath location:** `src/main/resources/db/migration/`
Copy both SQL files there before running the app.

---

## 6. Seed Data

Generated by `generate_seed.py` (Python 3, no external deps except bcrypt).

### Stats
- **Invoices:** 812 over 90 days (Oct 1 – Dec 29, 2024)
- **Line items:** 3,197
- **Products:** 50 across 10 categories
- **Users:** 3 (1 admin, 2 cashiers)
- **Stock movements:** 50 STOCK_IN + 3,197 SALE_OUT

**Seed password for all users: `Test@1234`** (BCrypt hash embedded in V2 script)

### Users
| username | email | role |
|---|---|---|
| admin | admin@grocerystore.in | ADMIN |
| ravi_k | ravi.kumar@grocerystore.in | CASHIER |
| priya_s | priya.sharma@grocerystore.in | CASHIER |

### Categories (10)
1. Staples
2. Spices & Masala
3. Oils & Ghee
4. Dairy
5. Snacks
6. Beverages
7. Biscuits & Bakery
8. Instant & Packaged Foods
9. Personal Care
10. Household & Cleaning

### Products (50) — Indian brands, INR pricing

| SKU | Product | Category | Price |
|---|---|---|---|
| STL-001 | Tata Salt 1kg | Staples | ₹22 |
| STL-002 | Aashirvaad Atta 5kg | Staples | ₹255 |
| STL-003 | India Gate Basmati Rice 5kg | Staples | ₹375 |
| STL-004 | Toor Dal 1kg | Staples | ₹115 |
| STL-005 | Chana Dal 1kg | Staples | ₹95 |
| STL-006 | Moong Dal 1kg | Staples | ₹125 |
| STL-007 | Rajma 1kg | Staples | ₹130 |
| SPC-001 | MDH Chole Masala 100g | Spices | ₹58 |
| SPC-002 | Everest Garam Masala 100g | Spices | ₹68 |
| SPC-003 | Tata Turmeric Powder 200g | Spices | ₹48 |
| SPC-004 | Everest Red Chilli 200g | Spices | ₹65 |
| SPC-005 | MDH Rajma Masala 100g | Spices | ₹52 |
| SPC-006 | Catch Cumin Seeds 100g | Spices | ₹42 |
| OIL-001 | Fortune Sunflower Oil 1L | Oils & Ghee | ₹135 |
| OIL-002 | Amul Ghee 500ml | Oils & Ghee | ₹290 |
| OIL-003 | Fortune Mustard Oil 1L | Oils & Ghee | ₹140 |
| OIL-004 | Saffola Gold Oil 1L | Oils & Ghee | ₹175 |
| DRY-001 | Amul Butter 500g | Dairy | ₹265 |
| DRY-002 | Amul Milk 1L | Dairy | ₹62 |
| DRY-003 | Mother Dairy Curd 400g | Dairy | ₹52 |
| DRY-004 | Amul Cheese Slices 200g | Dairy | ₹120 |
| DRY-005 | Nandini Paneer 200g | Dairy | ₹95 |
| SNK-001 | Haldirams Bhujia 200g | Snacks | ₹75 |
| SNK-002 | Haldirams Aloo Bhujia 150g | Snacks | ₹48 |
| SNK-003 | Bingo Mad Angles 75g | Snacks | ₹20 |
| SNK-004 | Lays Classic Salted 73g | Snacks | ₹20 |
| SNK-005 | Kurkure Masala Munch 90g | Snacks | ₹20 |
| BEV-001 | Tata Tea Gold 500g | Beverages | ₹240 |
| BEV-002 | Red Label Tea 500g | Beverages | ₹230 |
| BEV-003 | Nescafe Classic 50g | Beverages | ₹140 |
| BEV-004 | Bru Coffee 50g | Beverages | ₹110 |
| BEV-005 | Tropicana Orange 1L | Beverages | ₹120 |
| BEV-006 | Amul Kool Milk 200ml | Beverages | ₹28 |
| BSC-001 | Parle-G 800g | Biscuits | ₹38 |
| BSC-002 | Britannia Marie Gold 400g | Biscuits | ₹42 |
| BSC-003 | Britannia Good Day 250g | Biscuits | ₹38 |
| BSC-004 | Oreo Original 300g | Biscuits | ₹55 |
| BSC-005 | Sunfeast Dark Fantasy 300g | Biscuits | ₹90 |
| INS-001 | Maggi 2-Minute Noodles 4pk | Instant Foods | ₹58 |
| INS-002 | Yippee Magic Masala 4pk | Instant Foods | ₹52 |
| INS-003 | MTR Dal Makhani 300g | Instant Foods | ₹90 |
| INS-004 | Knorr Tomato Soup 53g | Instant Foods | ₹38 |
| PRC-001 | Colgate MaxFresh 150g | Personal Care | ₹60 |
| PRC-002 | Dove Soap 100g | Personal Care | ₹48 |
| PRC-003 | Head Shoulders Shampoo 180ml | Personal Care | ₹175 |
| PRC-004 | Dettol Handwash 250ml | Personal Care | ₹80 |
| HLD-001 | Surf Excel Detergent 1kg | Household | ₹120 |
| HLD-002 | Vim Dishwash Bar 300g | Household | ₹32 |
| HLD-003 | Harpic Toilet Cleaner 500ml | Household | ₹95 |
| HLD-004 | Lizol Floor Cleaner 500ml | Household | ₹90 |

### Top sellers by units (useful for analytics context)
| Product | Units sold | Remaining stock |
|---|---|---|
| Parle-G 800g | 388 | 28 |
| Tata Salt 1kg | 304 | 45 |
| Toor Dal 1kg | 266 | 38 |
| India Gate Basmati Rice 5kg | 265 | 22 |
| Fortune Sunflower Oil 1L | 261 | 35 |
| Amul Milk 1L | 245 | 25 |
| Bingo Mad Angles 75g | 202 | 30 |
| Tata Tea Gold 500g | 192 | 30 |

### Indian basket patterns encoded in seed data
These patterns create statistically strong bought-together pairs:

| Pattern | Core products | Common additions |
|---|---|---|
| Chai basket | Tata Tea + Parle-G | Amul Milk, Marie Gold |
| Dal-chawal | Toor Dal + Basmati Rice | Salt, Oil, Turmeric |
| Weekly staples | Atta + Rice + Dal + Salt + Oil | Spices, Tea, Surf Excel |
| Snack run | Bingo Mad Angles | Lays, Kurkure, Amul Kool Milk |
| Cooking essentials | Fortune Oil + Tata Salt | Garam Masala, Turmeric, Chilli |
| Breakfast basket | Amul Milk + Parle-G | Tea, Butter, Marie Gold |
| Noodles basket | Maggi 4pk | Yippee, Knorr Soup, Kool Milk |
| Cleaning basket | Surf Excel + Vim | Harpic, Lizol, Dettol |
| Dairy run | Amul Milk + Mother Dairy Curd | Butter, Paneer, Cheese |

### Seed data generation
- `random.seed(42)` — fully reproducible
- Weekends weighted 2× vs weekdays
- Evening hours (17:00–21:00) weighted 45% of daily traffic
- Payday bump last 3 days of each month
- To regenerate: `python3 generate_seed.py` in `db/` directory

---

## 7. Backend Module Design

**Base package:** `com.grocerystore`
**Base URL:** `/api`

### Module 1 — Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Returns JWT token |

Request: `{ "username": "...", "password": "..." }`
Response: `{ "userId": 1, "username": "...", "role": "ADMIN", "token": "...", "expiresIn": 86400000 }`

---

### Module 2 — User Management
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/users` | ADMIN | List all users |
| POST | `/api/users` | ADMIN | Create user |
| PUT | `/api/users/{id}` | ADMIN | Update user |
| PATCH | `/api/users/{id}/status` | ADMIN | Activate / deactivate |

---

### Module 3 — Category Management
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/categories` | ANY | List all categories |
| POST | `/api/categories` | ADMIN | Create category |
| PUT | `/api/categories/{id}` | ADMIN | Update category |
| DELETE | `/api/categories/{id}` | ADMIN | Delete (only if no products linked) |

---

### Module 4 — Product Management
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/products` | ANY | List products (filter: category, active) |
| GET | `/api/products/{id}` | ANY | Single product |
| POST | `/api/products` | ADMIN | Create product |
| PUT | `/api/products/{id}` | ADMIN | Update product |
| PATCH | `/api/products/{id}/status` | ADMIN | Soft delete / restore |

---

### Module 5 — Inventory Management
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/inventory` | ADMIN | All products with current stock |
| GET | `/api/inventory/{productId}` | ADMIN | Single product stock |
| POST | `/api/inventory/stock-in` | ADMIN | Add stock (creates STOCK_IN movement) |
| GET | `/api/inventory/low-stock` | ADMIN | Products at or below threshold |
| GET | `/api/inventory/movements/{productId}` | ADMIN | Movement history for a product |

---

### Module 6 — Sales / Billing *(most critical)*
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/sales/invoices` | CASHIER, ADMIN | Create invoice (transactional) |
| GET | `/api/sales/invoices` | ADMIN | Invoice history with date filters |
| GET | `/api/sales/invoices/{id}` | ADMIN | Invoice detail with line items |

**`POST /api/sales/invoices` must run in a single `@Transactional` block:**
```
begin
  → validate each product is_active
  → validate stock sufficient per product
  → call nextval('invoice_number_seq') → compose invoice_number
  → INSERT sales_invoices
  → INSERT sales_invoice_items (with unit_price snapshot)
  → UPDATE inventory.quantity per product
  → INSERT stock_movements (SALE_OUT per product)
commit
```
Any failure rolls back everything.

---

### Module 7 — Reports / Dashboard
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/reports/sales-summary` | ADMIN | Daily/weekly/monthly totals. `?period=daily\|weekly\|monthly` |
| GET | `/api/reports/top-products` | ADMIN | Top sellers. `?limit=10&days=30` |
| GET | `/api/reports/low-stock` | ADMIN | Products below threshold |

Read-only queries on existing data — no computation needed.

---

### Module 8 — Analytics *(Phase 2)*
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/analytics/run` | ADMIN | Trigger batch computation |
| GET | `/api/analytics/association-rules` | ADMIN | Bought-together results |
| GET | `/api/analytics/restock-suggestions` | ADMIN | Restock recommendations |

`POST /api/analytics/run` truncates both output tables then repopulates them.

---

## 8. Spring Boot Project Structure

```
backend/
├── pom.xml
└── src/
    └── main/
        ├── java/com/grocerystore/
        │   ├── GroceryApplication.java
        │   ├── config/
        │   │   └── SecurityConfig.java
        │   ├── common/
        │   │   ├── exception/
        │   │   │   ├── GlobalExceptionHandler.java
        │   │   │   ├── ResourceNotFoundException.java
        │   │   │   └── InsufficientStockException.java
        │   │   └── response/
        │   │       └── ApiResponse.java
        │   ├── security/
        │   │   ├── JwtTokenProvider.java
        │   │   ├── JwtAuthenticationFilter.java
        │   │   └── CustomUserDetailsService.java
        │   └── module/
        │       ├── auth/
        │       │   ├── AuthController.java
        │       │   ├── AuthService.java
        │       │   └── dto/
        │       │       ├── LoginRequest.java
        │       │       └── LoginResponse.java
        │       ├── user/
        │       │   ├── entity/Role.java
        │       │   ├── entity/User.java
        │       │   ├── repository/RoleRepository.java
        │       │   └── repository/UserRepository.java
        │       ├── category/
        │       │   ├── entity/Category.java
        │       │   └── repository/CategoryRepository.java
        │       ├── product/
        │       │   ├── entity/Product.java
        │       │   └── repository/ProductRepository.java
        │       ├── inventory/
        │       │   ├── entity/Inventory.java
        │       │   ├── entity/StockMovement.java
        │       │   ├── entity/MovementType.java
        │       │   ├── repository/InventoryRepository.java
        │       │   └── repository/StockMovementRepository.java
        │       ├── sales/
        │       │   ├── entity/SalesInvoice.java
        │       │   ├── entity/SalesInvoiceItem.java
        │       │   ├── repository/SalesInvoiceRepository.java
        │       │   └── repository/SalesInvoiceItemRepository.java
        │       └── analytics/
        │           ├── entity/AssociationRule.java
        │           ├── entity/RestockSuggestion.java
        │           ├── repository/AssociationRuleRepository.java
        │           └── repository/RestockSuggestionRepository.java
        └── resources/
            ├── application.yml
            └── db/migration/
                ├── V1__init_schema.sql
                └── V2__seed_data.sql
```

---

## 9. Key Configuration

### application.yml (template)
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/grocery_db
    username: postgres
    password: your_db_password
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        format_sql: true
  flyway:
    enabled: true
    locations: classpath:db/migration

app:
  jwt:
    secret: +Q3SmJ1Mcpr0QKbFFw9u1Xo6L5IOdfRE2xWbp569EBgTXdMy074yRXdhLGdPZJtz
    expiration: 86400000   # 24 hours in ms
```

> **Change the JWT secret in production.** Generate a new one with:
> `python3 -c "import secrets,base64; print(base64.b64encode(secrets.token_bytes(48)).decode())"`

### Key Maven dependencies
```xml
spring-boot-starter-web
spring-boot-starter-data-jpa
spring-boot-starter-security
spring-boot-starter-validation
postgresql (runtime)
flyway-core
flyway-database-postgresql
io.jsonwebtoken:jjwt-api:0.12.5
io.jsonwebtoken:jjwt-impl:0.12.5 (runtime)
io.jsonwebtoken:jjwt-jackson:0.12.5 (runtime)
lombok (optional)
```

---

## 10. Important Design Rules (don't break these)

1. **Never hard-delete products or users.** Use `is_active = false`.
2. **Always snapshot `unit_price` in `sales_invoice_items`.** Never reference `products.price` for historical data.
3. **`inventory.quantity` is the source of truth for stock.** Never compute current stock by summing movements.
4. **`POST /api/sales/invoices` must be a single `@Transactional` operation.** All-or-nothing.
5. **`association_rules` and `restock_suggestions` are truncated on every analytics run.** They are output tables, not transaction tables.
6. **`invoice_number` is generated via `nextval('invoice_number_seq')` in the app layer**, not by the database default.
7. **SALE_OUT stock movements store the invoice id in `reference_id`.** This links movements back to invoices for audit.

---

## 11. Current Status

| Item | Status |
|---|---|
| Scope & decisions | ✅ Complete |
| Database schema design | ✅ Complete |
| DDL script (`V1__init_schema.sql`) | ✅ Complete |
| Seed data generator (`generate_seed.py`) | ✅ Complete |
| Seed SQL (`V2__seed_data.sql`) | ✅ Complete (812 invoices) |
| API design (all 8 modules) | ✅ Complete |
| Spring Boot project setup | ✅ Complete (scaffold) |
| Auth module (JWT login) | ✅ Complete (basic) |
| Entity classes (all 10) | ✅ Complete |
| Repository interfaces | ✅ Complete |
| User management module | ✅ Complete (v1) |
| Category module | ✅ Complete (v1) |
| Product module | ✅ Complete (v1) |
| Inventory module | ✅ Complete (v1) |
| Sales / billing module | ✅ Complete (v1) |
| Reports module | ✅ Complete (v1) |
| Analytics module | ✅ Complete (v1) |
| Frontend (React + Vite) | 🔲 Pending |

---

## 12. Session Log

### Session 1
- Defined full project scope and resolved all open questions
- Finalized 10-table database schema with detailed column types and constraints
- Wrote `V1__init_schema.sql` (Flyway-compatible, includes sequence, indexes, comments)
- Wrote `generate_seed.py` — Indian market products, basket patterns, time-weighted invoice generation
- Generated `V2__seed_data.sql` — 812 invoices, 3197 line items, 50 products
- Designed all 8 backend API modules with endpoint list
- **Next session starts at: Spring Boot project setup → pom.xml → entities → auth module**

### Session 2
- Created backend scaffold under `backend/` with Maven, Spring Boot 3.2.x, Java 17
- Added `application.yml` for PostgreSQL + Flyway + JWT config
- Added Flyway migration placeholders in `src/main/resources/db/migration/`
- Implemented base security setup (`SecurityConfig`, JWT provider/filter, user details service)
- Implemented `POST /api/auth/login` (controller + service + DTOs)
- Added common response and global exception classes
- Added JPA entities and repositories for user, category, product, inventory, sales, and analytics modules
- Added minimal test scaffold and backend `README.md`

### Session 3
- Verified updated `V1__init_schema.sql` and full `V2__seed_data.sql` (812 invoices, 3197 line items)
- Implemented backend modules in order from the plan: User → Category → Product → Inventory → Sales → Reports → Analytics
- Added logout support with token blacklist (`POST /api/auth/logout`)
- Added pagination + sorting support to list/history endpoints
- Implemented transactional billing flow with invoice sequence (`INV-<nextval>`), stock deduction, and `SALE_OUT` movement logging
- Added reporting endpoints (`sales-summary`, `top-products`, `low-stock`) and analytics run/read endpoints
- **Next session starts at: user/category/product/inventory/sales/report/analytics service + controller implementation**
