-- Fix spades_hands table to allow NULL values for books when bids are first saved
-- This migration modifies the team1_books and team2_books columns to allow NULL values

-- First, drop the NOT NULL constraints if they exist
ALTER TABLE spades_hands 
ALTER COLUMN team1_books DROP NOT NULL,
ALTER COLUMN team2_books DROP NOT NULL;

-- Add comments to document the change
COMMENT ON COLUMN spades_hands.team1_books IS 'Books won by team 1 (NULL when bid is first saved, before books are recorded)';
COMMENT ON COLUMN spades_hands.team2_books IS 'Books won by team 2 (NULL when bid is first saved, before books are recorded)';
