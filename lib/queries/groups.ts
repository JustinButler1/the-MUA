import { supabase } from '@/lib/supabase';

export interface GroupMember {
  id: string;
  name: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

export interface Group {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  createdBy?: string;
  createdAt: string;
  members: GroupMember[];
  memberCount: number;
  eventCount: number;
  isSubscribed: boolean;
}

/**
 * Fetches all groups that the current user is subscribed to or is a member of
 * Groups come from the grp table and are separate from teams
 * @param userId - The user ID to fetch groups for
 * @returns Promise<Group[]> - Array of groups with member and event details
 */
export async function getUserGroups(userId: string): Promise<Group[]> {
  try {
    // Get groups the user is subscribed to
    const { data: subscriptions, error: subscriptionError } = await supabase
      .from('subscription')
      .select(`
        grp_id,
        grp!inner(
          id,
          name,
          slug,
          description,
          parent_id,
          created_by,
          created_at
        )
      `)
      .eq('user_id', userId);

    if (subscriptionError) {
      console.error('Error fetching user subscriptions:', subscriptionError);
      throw new Error('Failed to load group subscriptions');
    }

    if (!subscriptions || subscriptions.length === 0) {
      return [];
    }

    const groupIds = subscriptions.map(s => s.grp_id);

    // Get member information for each group
    const { data: membersData, error: membersError } = await supabase
      .from('grp_member')
      .select(`
        grp_id,
        user_id,
        role,
        joined_at,
        profiles!inner(display_name)
      `)
      .in('grp_id', groupIds);

    if (membersError) {
      console.error('Error fetching group members:', membersError);
      throw new Error('Failed to load group members');
    }

    // Get event counts for each group
    const { data: eventCounts, error: eventError } = await supabase
      .from('event_series')
      .select('grp_id')
      .in('grp_id', groupIds);

    if (eventError) {
      console.error('Error fetching event counts:', eventError);
    }

    // Process group data
    const processedGroups: Group[] = subscriptions.map(subscription => {
      const grp = subscription.grp;
      const groupMembers = membersData?.filter(m => m.grp_id === grp.id) || [];
      const eventCount = eventCounts?.filter(e => e.grp_id === grp.id).length || 0;

      return {
        id: grp.id,
        name: grp.name,
        slug: grp.slug,
        description: grp.description,
        parentId: grp.parent_id,
        createdBy: grp.created_by,
        createdAt: grp.created_at,
        members: groupMembers.map(member => ({
          id: member.user_id,
          name: member.profiles.display_name,
          role: member.role as 'owner' | 'admin' | 'member',
          joinedAt: member.joined_at
        })),
        memberCount: groupMembers.length,
        eventCount,
        isSubscribed: true
      };
    });

    return processedGroups;
  } catch (error) {
    console.error('Error in getUserGroups:', error);
    throw error;
  }
}
