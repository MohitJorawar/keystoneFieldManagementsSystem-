-- Seed Customers
INSERT INTO customers (id, name, contact_email) VALUES
('e3d7a8e8-d635-4dbb-8b9a-4c2847a9efea', 'Acme Corp', 'billing@acme.com'),
('57657bf7-bb37-4d92-bf39-4458d9fe100c', 'Globex Corp', 'accounts@globex.com');

-- Seed Sites
INSERT INTO sites (id, customer_id, name, address) VALUES
('b334586d-3129-450f-90e9-ff6d9337ff4d', 'e3d7a8e8-d635-4dbb-8b9a-4c2847a9efea', 'Acme Headquarters', '123 Industrial Way, Tech City, TC 10001'),
('7ef97c72-9b2f-488f-a78b-d784a0d9b4b0', 'e3d7a8e8-d635-4dbb-8b9a-4c2847a9efea', 'Acme Distribution Center', '456 Logistics Blvd, Supply Valley, SV 20002'),
('dfc54ad3-a3d8-4f81-a67b-23eb463690d7', '57657bf7-bb37-4d92-bf39-4458d9fe100c', 'Globex Tower', '789 Syndicate Ave, Metropolis, MP 30003');

-- Seed Users
-- Password for all users is: password
-- BCrypt hash: $2a$10$0a5XrbgQMdC9TssjlmhHU.T14mcAkQ7/lgXTCX0Uxg8y/.kihYiY6
INSERT INTO users (id, name, email, password_hash, role, customer_id) VALUES
('a8b0d4d8-c11f-49ef-94f4-90a6f8b1c4e7', 'Alice Manager', 'manager@meridian.com', '$2a$10$0a5XrbgQMdC9TssjlmhHU.T14mcAkQ7/lgXTCX0Uxg8y/.kihYiY6', 'MANAGER', NULL),
('d87b1c1c-223d-4c3e-86ef-59f518e38d72', 'Bob Dispatcher', 'dispatcher@meridian.com', '$2a$10$0a5XrbgQMdC9TssjlmhHU.T14mcAkQ7/lgXTCX0Uxg8y/.kihYiY6', 'DISPATCHER', NULL),
('75f14e6b-ecb0-4db6-8e50-48248c8bcf62', 'Charlie Tech', 'tech1@meridian.com', '$2a$10$0a5XrbgQMdC9TssjlmhHU.T14mcAkQ7/lgXTCX0Uxg8y/.kihYiY6', 'TECHNICIAN', NULL),
('ffb7d41f-8181-4a3d-b4f0-ec7b4db1b3d6', 'David Tech', 'tech2@meridian.com', '$2a$10$0a5XrbgQMdC9TssjlmhHU.T14mcAkQ7/lgXTCX0Uxg8y/.kihYiY6', 'TECHNICIAN', NULL),
('3443a53e-324c-41f2-b883-9b98ec34259b', 'Ethan Customer Acme', 'client@acme.com', '$2a$10$0a5XrbgQMdC9TssjlmhHU.T14mcAkQ7/lgXTCX0Uxg8y/.kihYiY6', 'CUSTOMER', 'e3d7a8e8-d635-4dbb-8b9a-4c2847a9efea'),
('446d32bf-ff6b-4e0d-b472-35805562725e', 'Fiona Customer Globex', 'client@globex.com', '$2a$10$0a5XrbgQMdC9TssjlmhHU.T14mcAkQ7/lgXTCX0Uxg8y/.kihYiY6', 'CUSTOMER', '57657bf7-bb37-4d92-bf39-4458d9fe100c');

-- Seed Parts / Inventory
INSERT INTO parts (id, name, sku, unit_cost, stock_qty) VALUES
('2fbf8a11-b0db-44a6-8be2-7bb5140bbbfd', 'Air Filter MERV 13', 'FIL-MERV13', 25.50, 100),
('4d4de4e5-4ef5-4927-aa72-3ab8b9195b00', 'Copper Pipe 1/2in 10ft', 'PIP-COP-12', 15.75, 50),
('9d863f82-dfbd-4d51-a968-3e9a4f4d2f00', 'Brass Ball Valve 3/4in', 'VAL-BRA-34', 42.00, 20);
