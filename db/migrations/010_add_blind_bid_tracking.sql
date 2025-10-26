-- Add blind bid tracking columns to spades_hands table
-- This migration adds columns to track whether each team made a blind bid

ALTER TABLE spades_hands 
ADD COLUMN team1_blind_bid BOOLEAN DEFAULT FALSE,
ADD COLUMN team2_blind_bid BOOLEAN DEFAULT FALSE;

-- Add comments to document the new columns
COMMENT ON COLUMN spades_hands.team1_blind_bid IS 'Whether team 1 made a blind bid (must get exactly the bid amount)';
COMMENT ON COLUMN spades_hands.team2_blind_bid IS 'Whether team 2 made a blind bid (must get exactly the bid amount)';

-- Update existing records to have false for blind bids (since we don't have historical data)
UPDATE spades_hands 
SET team1_blind_bid = FALSE, team2_blind_bid = FALSE 
WHERE team1_blind_bid IS NULL OR team2_blind_bid IS NULL;
