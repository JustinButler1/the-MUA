-- Add unique constraint to team names to enforce uniqueness
-- This migration ensures no duplicate team names can exist

-- Step 1: Clean up existing team names and handle duplicates
DO $$
DECLARE
    team_record RECORD;
    cleaned_name TEXT;
    base_name TEXT;
    counter INTEGER;
BEGIN
    -- Process each team
    FOR team_record IN 
        SELECT id, name, created_at
        FROM public.teams
        ORDER BY created_at ASC
    LOOP
        -- Handle NULL or empty team names
        IF team_record.name IS NULL OR trim(team_record.name) = '' THEN
            -- Use a default name with team ID
            cleaned_name := 'Team_' || substr(team_record.id::text, 1, 8);
        ELSE
            -- Use existing name, trimmed
            cleaned_name := trim(team_record.name);
        END IF;
        
        -- Ensure uniqueness by checking if cleaned name already exists
        counter := 0;
        base_name := cleaned_name;
        WHILE EXISTS (
            SELECT 1 FROM public.teams 
            WHERE name = cleaned_name 
            AND id != team_record.id
        ) LOOP
            counter := counter + 1;
            cleaned_name := base_name || ' (' || counter || ')';
        END LOOP;
        
        -- Update the team with cleaned name
        UPDATE public.teams
        SET name = cleaned_name
        WHERE id = team_record.id;
    END LOOP;
END $$;

-- Make name NOT NULL now that all teams have valid names
ALTER TABLE public.teams
ALTER COLUMN name SET NOT NULL;

-- Add unique constraint on team name
-- Note: This makes name case-sensitive unique
ALTER TABLE public.teams
ADD CONSTRAINT teams_name_unique UNIQUE (name);

-- Create an index on lowercase name for case-insensitive lookups
CREATE INDEX teams_name_lower_idx ON public.teams (LOWER(name));

-- Add a function to check team name availability (case-insensitive)
CREATE OR REPLACE FUNCTION public.is_team_name_available(team_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Return true if name is available (doesn't exist, case-insensitive)
    RETURN NOT EXISTS (
        SELECT 1 
        FROM public.teams 
        WHERE LOWER(name) = LOWER(team_name)
    );
END;
$$;

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.is_team_name_available(TEXT) TO authenticated;

