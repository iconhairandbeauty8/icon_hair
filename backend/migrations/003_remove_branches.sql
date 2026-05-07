-- Migration 003: Remove branch-related columns and tables
-- Run this once against the production database

-- Drop FK indexes first
DROP INDEX IF EXISTS idx_employees_branch;
DROP INDEX IF EXISTS idx_bookings_branch;
DROP INDEX IF EXISTS idx_inventory_branch;

-- Drop branch_id from employees (was NOT NULL)
ALTER TABLE employees DROP COLUMN IF EXISTS branch_id;

-- Drop branch_id from bookings (was NOT NULL)
ALTER TABLE bookings DROP COLUMN IF EXISTS branch_id;

-- Drop branch_id from inventory_items (was NOT NULL)
ALTER TABLE inventory_items DROP COLUMN IF EXISTS branch_id;

-- Drop nullable branch_id from other tables
ALTER TABLE promotions DROP COLUMN IF EXISTS branch_id;
ALTER TABLE reviews DROP COLUMN IF EXISTS branch_id;

-- Drop the junction and main tables
DROP TABLE IF EXISTS branch_services CASCADE;
DROP TABLE IF EXISTS branches CASCADE;
