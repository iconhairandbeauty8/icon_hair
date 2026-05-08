-- Add applicable_dates column to promotions table
-- Stores an array of specific calendar dates (YYYY-MM-DD strings) when the promotion is valid.
-- Empty array = no date restriction (promotion valid any day within its active period).

ALTER TABLE promotions
  ADD COLUMN IF NOT EXISTS applicable_dates JSONB DEFAULT '[]';
