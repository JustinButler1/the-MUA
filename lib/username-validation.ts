import { supabase } from './supabase';

/**
 * Validates username format
 * Requirements:
 * - 3-20 characters
 * - Only alphanumeric, underscores, and hyphens
 * - No spaces
 */
export function validateUsernameFormat(username: string): { valid: boolean; error?: string } {
  if (!username) {
    return { valid: false, error: 'Username is required' };
  }

  if (username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }

  if (username.length > 20) {
    return { valid: false, error: 'Username must be 20 characters or less' };
  }

  const validPattern = /^[a-zA-Z0-9_-]+$/;
  if (!validPattern.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }

  return { valid: true };
}

/**
 * Checks if a username is available (not taken by another user)
 * Case-insensitive check
 */
export async function checkUsernameAvailability(
  username: string,
  excludeUserId?: string
): Promise<{ available: boolean; error?: string }> {
  try {
    // First validate format
    const formatCheck = validateUsernameFormat(username);
    if (!formatCheck.valid) {
      return { available: false, error: formatCheck.error };
    }

    // Check if username exists (case-insensitive)
    let query = supabase
      .from('profiles')
      .select('user_id, display_name')
      .ilike('display_name', username);

    // If we're updating a username, exclude the current user
    if (excludeUserId) {
      query = query.neq('user_id', excludeUserId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error checking username availability:', error);
      return { available: false, error: 'Error checking username availability' };
    }

    if (data && data.length > 0) {
      return { available: false, error: 'This username is already taken' };
    }

    return { available: true };
  } catch (error) {
    console.error('Error in checkUsernameAvailability:', error);
    return { available: false, error: 'Error checking username availability' };
  }
}

/**
 * Updates a user's username
 */
export async function updateUsername(
  userId: string,
  newUsername: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate format
    const formatCheck = validateUsernameFormat(newUsername);
    if (!formatCheck.valid) {
      return { success: false, error: formatCheck.error };
    }

    // Check availability
    const availabilityCheck = await checkUsernameAvailability(newUsername, userId);
    if (!availabilityCheck.available) {
      return { success: false, error: availabilityCheck.error };
    }

    // Update the username
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: newUsername })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating username:', error);
      return { success: false, error: 'Failed to update username' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateUsername:', error);
    return { success: false, error: 'Failed to update username' };
  }
}

