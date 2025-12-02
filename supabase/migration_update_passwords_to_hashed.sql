-- Migration: Update existing plain text passwords to bcrypt hashes
-- Run this in your Supabase SQL Editor to fix the passwords

-- Update Gohan's password (Gohan3322@ -> bcrypt hash)
UPDATE users 
SET password_hash = '$2a$10$4gplxZuYp03nKbS1iwJO6eiI0KHWwQnUL106X/an1ZrNU6WXGuFGK'
WHERE username = 'Gohan';

-- Update Aliamiri's password (Ali1234@ -> bcrypt hash)
UPDATE users 
SET password_hash = '$2a$10$hXKRtGz2CnZ.9s746cVoq.ci3L7L2EB64aMDMMPtU0vp5giUGC7X2'
WHERE username = 'Aliamiri';

-- Update Jenny's password (Jenny123 -> bcrypt hash)
UPDATE users 
SET password_hash = '$2a$10$gDrQ5YPtJ6do.m3V/NSgguhGVSEs7gErFnMdEmFSnpSbOQqcHI0I6'
WHERE username = 'Jenny';

-- Verify the update (passwords should now be long bcrypt hash strings)
SELECT username, 
       LENGTH(password_hash) as hash_length,
       SUBSTRING(password_hash, 1, 7) as hash_prefix
FROM users
ORDER BY username;

-- Expected output:
-- username  | hash_length | hash_prefix
-- ----------|-------------|------------
-- Aliamiri  | 60          | $2a$10$
-- Gohan     | 60          | $2a$10$
-- Jenny     | 60          | $2a$10$

