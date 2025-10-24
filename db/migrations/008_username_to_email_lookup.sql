-- Create a function to get email from username
-- This allows sign-in with username by looking up the associated email
CREATE OR REPLACE FUNCTION public.get_email_from_username(username_input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_email TEXT;
BEGIN
    -- Look up the user_id from profiles using the username (case-insensitive)
    -- Then get the email from auth.users
    SELECT au.email INTO user_email
    FROM public.profiles p
    JOIN auth.users au ON au.id = p.user_id
    WHERE LOWER(p.display_name) = LOWER(username_input);
    
    RETURN user_email;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_email_from_username(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_from_username(TEXT) TO anon;

