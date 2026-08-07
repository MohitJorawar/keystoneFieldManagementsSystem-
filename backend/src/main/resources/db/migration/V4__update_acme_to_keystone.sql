-- Migration to replace existing seed references from Acme to Keystone
UPDATE customers SET name = 'Keystone Corp', contact_email = 'billing@keystone.com' WHERE contact_email = 'billing@acme.com' OR name = 'Acme Corp';
UPDATE sites SET name = 'Keystone Headquarters' WHERE name = 'Acme Headquarters';
UPDATE sites SET name = 'Keystone Distribution Center' WHERE name = 'Acme Distribution Center';
UPDATE users SET name = 'Ethan Customer Keystone', email = 'client@keystone.com' WHERE email = 'client@acme.com';
