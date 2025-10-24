-- Diagnostic query to check existing usernames before migration
-- Run this BEFORE running 007_unique_username.sql to see what will be changed

-- Check for NULL display_names
SELECT 
    'NULL display_name' as issue_type,
    user_id,
    display_name,
    (SELECT email FROM auth.users WHERE id = user_id) as email
FROM public.profiles
WHERE display_name IS NULL;

-- Check for display_names that are too short (< 3 chars)
SELECT 
    'Too short (< 3 chars)' as issue_type,
    user_id,
    display_name,
    length(display_name) as current_length
FROM public.profiles
WHERE display_name IS NOT NULL 
AND length(display_name) < 3;

-- Check for display_names that are too long (> 20 chars)
SELECT 
    'Too long (> 20 chars)' as issue_type,
    user_id,
    display_name,
    length(display_name) as current_length
FROM public.profiles
WHERE display_name IS NOT NULL 
AND length(display_name) > 20;

-- Check for display_names with invalid characters
SELECT 
    'Invalid characters' as issue_type,
    user_id,
    display_name,
    regexp_replace(display_name, '[^a-zA-Z0-9_-]', '_', 'g') as cleaned_version
FROM public.profiles
WHERE display_name IS NOT NULL 
AND display_name !~ '^[a-zA-Z0-9_-]+$';

-- Check for duplicate display_names
SELECT 
    'Duplicate' as issue_type,
    display_name,
    COUNT(*) as count,
    array_agg(user_id) as user_ids
FROM public.profiles
WHERE display_name IS NOT NULL
GROUP BY display_name
HAVING COUNT(*) > 1;

-- Summary of all issues
SELECT 
    COUNT(*) FILTER (WHERE display_name IS NULL) as null_count,
    COUNT(*) FILTER (WHERE display_name IS NOT NULL AND length(display_name) < 3) as too_short,
    COUNT(*) FILTER (WHERE display_name IS NOT NULL AND length(display_name) > 20) as too_long,
    COUNT(*) FILTER (WHERE display_name IS NOT NULL AND display_name !~ '^[a-zA-Z0-9_-]+$') as invalid_chars,
    COUNT(*) as total_profiles
FROM public.profiles;

