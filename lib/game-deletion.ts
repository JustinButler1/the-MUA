import { supabase } from './supabase';

export interface GameDeletionResult {
  success: boolean;
  error?: string;
}

/**
 * Deletes a game and all its related data from the database.
 * This function handles cascading deletion of all game-related records.
 * 
 * @param gameId - The ID of the game to delete
 * @param userId - The ID of the user requesting deletion (for permission check)
 * @returns Promise<GameDeletionResult>
 */
export async function deleteGame(gameId: string, userId: string): Promise<GameDeletionResult> {
  try {
    // First, verify the user has permission to delete this game
    const { data: gameData, error: gameError } = await supabase
      .from('spades_games')
      .select('id, created_by')
      .eq('id', gameId)
      .single();

    if (gameError || !gameData) {
      return {
        success: false,
        error: 'Game not found'
      };
    }

    // Check if user has permission to delete (must be the creator)
    if (gameData.created_by !== userId) {
      return {
        success: false,
        error: 'You do not have permission to delete this game'
      };
    }

    // Delete in the correct order to handle foreign key constraints
    // 1. Delete hands (references game_id)
    const { error: handsError } = await supabase
      .from('spades_hands')
      .delete()
      .eq('game_id', gameId);

    if (handsError) {
      console.error('Error deleting hands:', handsError);
      return {
        success: false,
        error: 'Failed to delete game hands'
      };
    }

    // 2. Delete game outcomes (references game_id)
    const { error: outcomesError } = await supabase
      .from('spades_game_outcomes')
      .delete()
      .eq('game_id', gameId);

    if (outcomesError) {
      console.error('Error deleting game outcomes:', outcomesError);
      return {
        success: false,
        error: 'Failed to delete game outcomes'
      };
    }

    // 3. Delete game team members snapshot (references game_id)
    const { error: teamMembersError } = await supabase
      .from('spades_game_team_members')
      .delete()
      .eq('game_id', gameId);

    if (teamMembersError) {
      console.error('Error deleting game team members:', teamMembersError);
      return {
        success: false,
        error: 'Failed to delete game team members'
      };
    }

    // 4. Finally, delete the main game record
    const { error: gameDeleteError } = await supabase
      .from('spades_games')
      .delete()
      .eq('id', gameId);

    if (gameDeleteError) {
      console.error('Error deleting game:', gameDeleteError);
      return {
        success: false,
        error: 'Failed to delete game'
      };
    }

    // Note: We don't need to manually update stats tables because:
    // 1. The stats triggers should handle decrementing stats when game outcomes are deleted
    // 2. If stats triggers aren't working properly, that's a separate issue to fix

    return {
      success: true
    };

  } catch (error) {
    console.error('Unexpected error deleting game:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while deleting the game'
    };
  }
}

/**
 * Checks if a user has permission to delete a specific game.
 * 
 * @param gameId - The ID of the game to check
 * @param userId - The ID of the user to check permissions for
 * @returns Promise<boolean>
 */
export async function canDeleteGame(gameId: string, userId: string): Promise<boolean> {
  try {
    const { data: gameData, error } = await supabase
      .from('spades_games')
      .select('created_by')
      .eq('id', gameId)
      .single();

    if (error || !gameData) {
      return false;
    }

    return gameData.created_by === userId;
  } catch (error) {
    console.error('Error checking delete permissions:', error);
    return false;
  }
}
