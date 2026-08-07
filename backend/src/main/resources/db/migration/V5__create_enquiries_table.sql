-- Create enquiries table
CREATE TABLE enquiries (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    service VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'NEW',
    created_at TIMESTAMP NOT NULL
);
