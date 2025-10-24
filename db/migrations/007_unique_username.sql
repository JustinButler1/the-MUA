-- Add unique constraint to display_name to enforce unique usernames
-- This migration ensures no duplicate usernames can exist

-- Step 1: Clean up existing invalid usernames
DO $$
DECLARE
    profile_record RECORD;
    cleaned_name TEXT;
    base_name TEXT;
    counter INTEGER;
BEGIN
    -- Process each profile
    FOR profile_record IN 
        SELECT user_id, display_name
        FROM public.profiles
    LOOP
        -- Handle NULL display_name
        IF profile_record.display_name IS NULL THEN
            -- Get email prefix or use 'user' as fallback
            SELECT COALESCE(
                split_part(email, '@', 1),
                'user_' || substr(profile_record.user_id::text, 1, 8)
            )
            INTO cleaned_name
            FROM auth.users
            WHERE id = profile_record.user_id;
            
            -- Clean the name to match format
            cleaned_name := regexp_replace(cleaned_name, '[^a-zA-Z0-9_-]', '_', 'g');
        ELSE
            -- Clean existing display_name
            cleaned_name := profile_record.display_name;
            
            -- Remove invalid characters
            cleaned_name := regexp_replace(cleaned_name, '[^a-zA-Z0-9_-]', '_', 'g');
            
            -- Trim to max 20 characters
            IF length(cleaned_name) > 20 THEN
                cleaned_name := substr(cleaned_name, 1, 20);
            END IF;
            
            -- Ensure minimum 3 characters
            IF length(cleaned_name) < 3 THEN
                cleaned_name := cleaned_name || '_user';
            END IF;
        END IF;
        
        -- Ensure uniqueness by checking if cleaned name already exists
        counter := 0;
        base_name := cleaned_name;
        WHILE EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE display_name = cleaned_name 
            AND user_id != profile_record.user_id
        ) LOOP
            counter := counter + 1;
            -- Ensure the name with counter still fits within 20 chars
            cleaned_name := substr(base_name, 1, 20 - length(counter::text) - 1) || '_' || counter;
        END LOOP;
        
        -- Update the profile with cleaned name
        UPDATE public.profiles
        SET display_name = cleaned_name
        WHERE user_id = profile_record.user_id;
    END LOOP;
END $$;

-- Add unique constraint on display_name
-- Note: This makes display_name case-sensitive unique
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_display_name_unique UNIQUE (display_name);

-- Create an index on lowercase display_name for case-insensitive lookups
CREATE INDEX profiles_display_name_lower_idx ON public.profiles (LOWER(display_name));

-- Add a function to check username availability (case-insensitive)
CREATE OR REPLACE FUNCTION public.is_username_available(username TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE LOWER(display_name) = LOWER(username)
    );
END;
$$;

-- Add a constraint to ensure display_name is not null and has minimum length
ALTER TABLE public.profiles
ALTER COLUMN display_name SET NOT NULL;

-- Add a check constraint for username format (alphanumeric, underscores, hyphens, 3-20 chars)
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_display_name_format 
CHECK (display_name ~ '^[a-zA-Z0-9_-]{3,20}$');

