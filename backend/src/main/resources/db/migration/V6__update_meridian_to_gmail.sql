-- Update existing user emails from @meridian.com to @gmail.com
UPDATE users SET email = 'manager@gmail.com' WHERE email = 'manager@meridian.com';
UPDATE users SET email = 'dispatcher@gmail.com' WHERE email = 'dispatcher@meridian.com';
UPDATE users SET email = 'tech1@gmail.com' WHERE email = 'tech1@meridian.com';
UPDATE users SET email = 'tech2@gmail.com' WHERE email = 'tech2@meridian.com';
