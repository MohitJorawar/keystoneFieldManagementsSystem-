-- Create customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL
);

-- Create sites table
CREATE TABLE sites (
    id UUID PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL
);

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL
);

-- Create parts table
CREATE TABLE parts (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    unit_cost DECIMAL(10, 2) NOT NULL,
    stock_qty INTEGER NOT NULL CHECK (stock_qty >= 0)
);

-- Create work_orders table
CREATE TABLE work_orders (
    id UUID PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    sla_due_at TIMESTAMP NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    site_id UUID NOT NULL REFERENCES sites(id),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL
);

-- Create work_order_status_history table
CREATE TABLE work_order_status_history (
    id UUID PRIMARY KEY,
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    changed_by UUID NOT NULL REFERENCES users(id),
    changed_at TIMESTAMP NOT NULL,
    note TEXT
);

-- Create time_logs table
CREATE TABLE time_logs (
    id UUID PRIMARY KEY,
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    technician_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    minutes INTEGER NOT NULL CHECK (minutes >= 1),
    note VARCHAR(255),
    logged_at TIMESTAMP NOT NULL
);

-- Create part_usages table
CREATE TABLE part_usages (
    id UUID PRIMARY KEY,
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    part_id UUID NOT NULL REFERENCES parts(id) ON DELETE RESTRICT,
    qty_used INTEGER NOT NULL CHECK (qty_used >= 1),
    logged_at TIMESTAMP NOT NULL
);
