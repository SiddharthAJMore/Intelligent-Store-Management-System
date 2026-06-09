-- =============================================================================
-- Smart Grocery Billing and Inventory Management System
-- Schema Version: V1
-- Database: PostgreSQL
-- =============================================================================


-- =============================================================================
-- SEQUENCES
-- =============================================================================

-- Invoice number sequence. Starts at 1000.
-- Usage: 'INV-' || nextval('invoice_number_seq')
CREATE SEQUENCE invoice_number_seq
    START WITH 1000
    INCREMENT BY 1
    NO CYCLE;


-- =============================================================================
-- TABLE: roles
-- Static lookup table. Only two values expected: ADMIN, CASHIER.
-- =============================================================================

CREATE TABLE roles (
    id   BIGSERIAL    PRIMARY KEY,
    name VARCHAR(50)  NOT NULL UNIQUE
);

COMMENT ON TABLE  roles      IS 'User role definitions. Expected values: ADMIN, CASHIER.';
COMMENT ON COLUMN roles.name IS 'Role name used for authorization checks.';


-- =============================================================================
-- TABLE: users
-- Both admin and cashier accounts live here.
-- =============================================================================

CREATE TABLE users (
    id            BIGSERIAL     PRIMARY KEY,
    username      VARCHAR(100)  NOT NULL UNIQUE,
    email         VARCHAR(255)  NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    role_id       BIGINT        NOT NULL REFERENCES roles(id),
    is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  users               IS 'All system users: admins and cashiers.';
COMMENT ON COLUMN users.password_hash IS 'BCrypt hashed password. Never store plaintext.';
COMMENT ON COLUMN users.is_active     IS 'Soft disable. Inactive users cannot log in.';


-- =============================================================================
-- TABLE: categories
-- Product categories. e.g. Dairy, Snacks, Beverages.
-- =============================================================================

CREATE TABLE categories (
    id          BIGSERIAL    PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE categories IS 'Product categories used for grouping and filtering.';


-- =============================================================================
-- TABLE: products
-- Master product catalogue.
-- is_active is used for soft delete — never hard delete products
-- that appear on historical invoices.
-- =============================================================================

CREATE TABLE products (
    id          BIGSERIAL      PRIMARY KEY,
    name        VARCHAR(255)   NOT NULL,
    category_id BIGINT         NOT NULL REFERENCES categories(id),
    price       NUMERIC(10,2)  NOT NULL CHECK (price >= 0),
    unit        VARCHAR(50)    NOT NULL,
    sku         VARCHAR(100)   UNIQUE,
    is_active   BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP      NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  products           IS 'Master product catalogue. Soft delete only via is_active.';
COMMENT ON COLUMN products.price     IS 'Current selling price. Historical invoice items store their own unit_price snapshot.';
COMMENT ON COLUMN products.unit      IS 'Unit of measurement. e.g. kg, piece, litre, dozen.';
COMMENT ON COLUMN products.sku       IS 'Optional product code / barcode. Nullable.';
COMMENT ON COLUMN products.is_active IS 'Soft delete flag. Products on past invoices must never be hard deleted.';


-- =============================================================================
-- TABLE: inventory
-- One row per product. Tracks current stock quantity.
-- This is the source of truth for stock levels.
-- stock_movements is the audit trail — do not derive stock from movements.
-- =============================================================================

CREATE TABLE inventory (
    id                  BIGSERIAL  PRIMARY KEY,
    product_id          BIGINT     NOT NULL UNIQUE REFERENCES products(id),
    quantity            INTEGER    NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    low_stock_threshold INTEGER    NOT NULL DEFAULT 10 CHECK (low_stock_threshold >= 0),
    last_updated        TIMESTAMP  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  inventory                       IS 'Current stock levels. One row per product.';
COMMENT ON COLUMN inventory.quantity              IS 'Current available stock. Updated on every sale and stock-in.';
COMMENT ON COLUMN inventory.low_stock_threshold   IS 'Dashboard alert fires when quantity falls at or below this value.';


-- =============================================================================
-- TABLE: stock_movements
-- Immutable audit log of every stock change.
-- movement_type values:
--   STOCK_IN    — admin manually adds stock
--   SALE_OUT    — deducted by a completed invoice
--   ADJUSTMENT  — manual correction by admin
-- =============================================================================

CREATE TABLE stock_movements (
    id              BIGSERIAL     PRIMARY KEY,
    product_id      BIGINT        NOT NULL REFERENCES products(id),
    movement_type   VARCHAR(20)   NOT NULL CHECK (movement_type IN ('STOCK_IN', 'SALE_OUT', 'ADJUSTMENT')),
    quantity_change INTEGER       NOT NULL,
    reference_id    BIGINT,
    notes           TEXT,
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  stock_movements                 IS 'Immutable audit log of all stock changes.';
COMMENT ON COLUMN stock_movements.quantity_change IS 'Positive = stock added. Negative = stock removed.';
COMMENT ON COLUMN stock_movements.reference_id    IS 'invoice id when movement_type is SALE_OUT. NULL otherwise.';


-- =============================================================================
-- TABLE: sales_invoices
-- One row per completed sale/bill.
-- invoice_number is generated from the invoice_number_seq sequence.
-- Format: INV-1000, INV-1001, ...
-- =============================================================================

CREATE TABLE sales_invoices (
    id              BIGSERIAL      PRIMARY KEY,
    invoice_number  VARCHAR(50)    NOT NULL UNIQUE,
    cashier_id      BIGINT         NOT NULL REFERENCES users(id),
    total_amount    NUMERIC(10,2)  NOT NULL CHECK (total_amount >= 0),
    created_at      TIMESTAMP      NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  sales_invoices                IS 'One record per completed billing transaction.';
COMMENT ON COLUMN sales_invoices.invoice_number IS 'Human-readable invoice ID. Generated as INV-<nextval(invoice_number_seq)>.';
COMMENT ON COLUMN sales_invoices.cashier_id     IS 'The user (cashier or admin) who created this invoice.';
COMMENT ON COLUMN sales_invoices.total_amount   IS 'Sum of all sales_invoice_items.subtotal for this invoice.';


-- =============================================================================
-- TABLE: sales_invoice_items
-- One row per product line in a bill.
-- unit_price is a snapshot — it captures the price at time of sale.
-- This ensures old invoices remain accurate even after price changes.
-- =============================================================================

CREATE TABLE sales_invoice_items (
    id          BIGSERIAL      PRIMARY KEY,
    invoice_id  BIGINT         NOT NULL REFERENCES sales_invoices(id),
    product_id  BIGINT         NOT NULL REFERENCES products(id),
    quantity    INTEGER        NOT NULL CHECK (quantity > 0),
    unit_price  NUMERIC(10,2)  NOT NULL CHECK (unit_price >= 0),
    subtotal    NUMERIC(10,2)  NOT NULL CHECK (subtotal >= 0)
);

COMMENT ON TABLE  sales_invoice_items            IS 'Line items belonging to a sales invoice.';
COMMENT ON COLUMN sales_invoice_items.unit_price IS 'Price snapshot at time of sale. Not a live FK to products.price.';
COMMENT ON COLUMN sales_invoice_items.subtotal   IS 'quantity * unit_price. Stored to avoid recomputation.';


-- =============================================================================
-- TABLE: association_rules
-- Output table for bought-together batch analysis.
-- Populated by the analytics engine on demand.
-- Each row represents a (product_a, product_b) pair with metrics.
-- =============================================================================

CREATE TABLE association_rules (
    id                  BIGSERIAL      PRIMARY KEY,
    product_a_id        BIGINT         NOT NULL REFERENCES products(id),
    product_b_id        BIGINT         NOT NULL REFERENCES products(id),
    support             NUMERIC(8,4)   NOT NULL,
    confidence          NUMERIC(8,4)   NOT NULL,
    co_occurrence_count INTEGER        NOT NULL,
    computed_at         TIMESTAMP      NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_different_products CHECK (product_a_id <> product_b_id)
);

COMMENT ON TABLE  association_rules                     IS 'Pre-computed market basket analysis results. Truncated and repopulated on each analytics run.';
COMMENT ON COLUMN association_rules.support             IS 'Fraction of all transactions containing both product_a and product_b.';
COMMENT ON COLUMN association_rules.confidence          IS 'P(product_b | product_a): fraction of product_a transactions that also contain product_b.';
COMMENT ON COLUMN association_rules.co_occurrence_count IS 'Raw count of invoices containing both products.';
COMMENT ON COLUMN association_rules.computed_at         IS 'Timestamp of the analytics run that produced this row.';


-- =============================================================================
-- TABLE: restock_suggestions
-- Output table for restock batch analysis.
-- Populated by the analytics engine on demand.
-- Truncated and repopulated on each analytics run.
-- =============================================================================

CREATE TABLE restock_suggestions (
    id                    BIGSERIAL     PRIMARY KEY,
    product_id            BIGINT        NOT NULL REFERENCES products(id),
    current_stock         INTEGER       NOT NULL,
    avg_daily_sales       NUMERIC(8,2)  NOT NULL,
    days_until_stockout   NUMERIC(6,1),
    suggested_restock_qty INTEGER,
    computed_at           TIMESTAMP     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  restock_suggestions                      IS 'Pre-computed restock suggestions. Truncated and repopulated on each analytics run.';
COMMENT ON COLUMN restock_suggestions.current_stock        IS 'Stock quantity snapshot at time of analytics run.';
COMMENT ON COLUMN restock_suggestions.avg_daily_sales      IS 'Average units sold per day over the last 30 days.';
COMMENT ON COLUMN restock_suggestions.days_until_stockout  IS 'Estimated days before stock reaches zero at current sales rate. NULL if avg_daily_sales = 0.';
COMMENT ON COLUMN restock_suggestions.suggested_restock_qty IS 'Recommended quantity to order. Based on 30-day cover target.';


-- =============================================================================
-- INDEXES
-- =============================================================================

-- Users
CREATE INDEX idx_users_role_id       ON users(role_id);

-- Products
CREATE INDEX idx_products_category   ON products(category_id);
CREATE INDEX idx_products_is_active  ON products(is_active);

-- Inventory
-- product_id already has a UNIQUE index from the constraint

-- Stock movements
CREATE INDEX idx_stock_movements_product    ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_type       ON stock_movements(movement_type);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at);

-- Sales invoices
CREATE INDEX idx_sales_invoices_cashier     ON sales_invoices(cashier_id);
CREATE INDEX idx_sales_invoices_created_at  ON sales_invoices(created_at);

-- Sales invoice items
CREATE INDEX idx_invoice_items_invoice      ON sales_invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product      ON sales_invoice_items(product_id);

-- Association rules
CREATE INDEX idx_assoc_rules_product_a      ON association_rules(product_a_id);
CREATE INDEX idx_assoc_rules_product_b      ON association_rules(product_b_id);

-- Restock suggestions
CREATE INDEX idx_restock_product            ON restock_suggestions(product_id);


-- =============================================================================
-- SEED: roles
-- These two rows are required for the application to function.
-- =============================================================================

INSERT INTO roles (name) VALUES ('ADMIN');
INSERT INTO roles (name) VALUES ('CASHIER');


-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
