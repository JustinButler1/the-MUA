-- Fix replication identity for spades_hands table to enable DELETE events in realtime
-- This migration sets the replication identity to FULL so that DELETE events are properly captured

-- Set replication identity to FULL for spades_hands table
-- This ensures that all column data is available for DELETE events in realtime subscriptions
ALTER TABLE spades_hands REPLICA IDENTITY FULL;

-- Add comment to document the change
COMMENT ON TABLE spades_hands IS 'Individual hand records within a game - replication identity set to FULL for DELETE events';
