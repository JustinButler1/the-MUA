import { supabase } from '@/lib/supabase';

export interface TeamMember {
  id: string;
  name: string;
  type: 'REGISTERED USER' | 'GUEST PLAYER';
}

export interface Team {
  id: string;
  name: string;
  members: TeamMember[];
  memberCount: number;
}

/**
 * Fetches all teams that the current user is a member of
 * @param userId - The user ID to fetch teams for
 * @returns Promise<Team[]> - Array of teams with member details
 */
export async function getUserTeams(userId: string): Promise<Team[]> {
  try {
    // First, get teams where user is a member
    const { data: userTeams, error: userTeamsError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId);

    if (userTeamsError) {
      console.error('Error fetching user teams:', userTeamsError);
      throw new Error('Failed to load teams');
    }

    if (!userTeams || userTeams.length === 0) {
      return [];
    }

    // Get all members for each team
    const teamIds = userTeams.map(t => t.team_id);
    const { data: allTeamMembers, error: teamMembersError } = await supabase
      .from('team_members')
      .select(`
        team_id,
        slot,
        teams!inner(id, name),
        profiles(display_name),
        team_guests(display_name)
      `)
      .in('team_id', teamIds)
      .order('team_id, slot');

    if (teamMembersError) {
      console.error('Error fetching team members:', teamMembersError);
      throw new Error('Failed to load team members');
    }

    // Process team data - group by team and collect all members
    const teamMap = new Map<string, Team>();
    
    allTeamMembers?.forEach((member: any) => {
      const teamId = member.team_id;
      const team = member.teams;
      
      if (!teamMap.has(teamId)) {
        teamMap.set(teamId, {
          id: team.id,
          name: team.name,
          members: [],
          memberCount: 0
        });
      }
      
      // Add member to the team
      if (member.profiles?.display_name) {
        teamMap.get(teamId)!.members.push({
          id: `user-${member.slot}`,
          name: member.profiles.display_name,
          type: 'REGISTERED USER'
        });
      }
      if (member.team_guests?.display_name) {
        teamMap.get(teamId)!.members.push({
          id: `guest-${member.slot}`,
          name: member.team_guests.display_name,
          type: 'GUEST PLAYER'
        });
      }
    });

    // Update member counts and return teams
    const processedTeams: Team[] = Array.from(teamMap.values()).map(team => ({
      ...team,
      memberCount: team.members.length
    }));

    return processedTeams;
  } catch (error) {
    console.error('Error in getUserTeams:', error);
    throw error;
  }
}
