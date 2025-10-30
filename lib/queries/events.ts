/**
 * Supabase query functions for the event/calendar system
 * Handles fetching events, groups, and related data with proper error handling
 */

import { supabase } from '@/lib/supabase';
import type {
    EventInstanceWithDetails,
    EventSeriesWithDetails,
    GroupWithDetails,
    RSVP,
    Subscription
} from '@/lib/types/events';

/**
 * Fetches upcoming event instances for a user from groups they're subscribed to
 * 
 * @param userId - The user's profile ID
 * @param limit - Maximum number of events to return (default: 15)
 * @returns Promise resolving to array of event instances with details
 */
export async function getUserUpcomingEvents(
  userId: string, 
  limit: number = 15
): Promise<EventInstanceWithDetails[]> {
  try {
    // Check if event tables exist by trying to query them
    const { error: tableCheckError } = await supabase
      .from('event_instance')
      .select('id')
      .limit(1);

    if (tableCheckError && tableCheckError.code === 'PGRST205') {
      // Tables don't exist yet - return empty array
      console.log('Event tables not found - returning empty array. Please apply the database migration.');
      return [];
    }

    const { data, error } = await supabase
      .from('event_instance')
      .select(`
        *,
        event_series!inner (
          *,
          grp!inner (
            *,
            subscription!inner (user_id)
          )
        ),
        venue (*),
        rsvp!left (id, status, guest_count)
      `)
      .eq('event_series.grp.subscription.user_id', userId)
      .gte('starts_at', new Date().toISOString())
      .eq('status', 'published')
      .eq('event_series.status', 'published')
      .order('starts_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching upcoming events:', error);
      throw error;
    }

    // Transform the data to match our interface
    return data?.map(event => ({
      ...event,
      event_series: event.event_series,
      group: event.event_series.grp,
      venue: event.venue,
      rsvp_count: event.rsvp?.reduce((sum, rsvp) => sum + 1 + rsvp.guest_count, 0) || 0,
      user_rsvp: event.rsvp?.find(r => r.user_id === userId)
    })) || [];
  } catch (error) {
    console.error('Error in getUserUpcomingEvents:', error);
    throw error;
  }
}

/**
 * Fetches groups that a user belongs to (as a member)
 * 
 * @param userId - The user's profile ID
 * @returns Promise resolving to array of groups with details
 */
export async function getUserGroups(userId: string): Promise<GroupWithDetails[]> {
  try {
    const { data, error } = await supabase
      .from('grp')
      .select(`
        *,
        grp_member!inner (user_id, role),
        subscription!left (user_id)
      `)
      .eq('grp_member.user_id', userId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching user groups:', error);
      throw error;
    }

    return data?.map(group => ({
      ...group,
      member_count: group.grp_member?.length || 0,
      user_role: group.grp_member?.[0]?.role,
      is_subscribed: group.subscription?.some(sub => sub.user_id === userId) || false
    })) || [];
  } catch (error) {
    console.error('Error in getUserGroups:', error);
    throw error;
  }
}

/**
 * Fetches groups that a user is subscribed to (for feeds/notifications)
 * 
 * @param userId - The user's profile ID
 * @returns Promise resolving to array of subscriptions
 */
export async function getUserSubscriptions(userId: string): Promise<Subscription[]> {
  try {
    const { data, error } = await supabase
      .from('subscription')
      .select(`
        *,
        grp (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user subscriptions:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserSubscriptions:', error);
    throw error;
  }
}

/**
 * Creates an RSVP for a user to an event instance
 * 
 * @param userId - The user's profile ID
 * @param eventInstanceId - The event instance ID
 * @param status - RSVP status
 * @param guestCount - Number of additional guests (default: 0)
 * @returns Promise resolving to the created RSVP
 */
export async function createRSVP(
  userId: string,
  eventInstanceId: string,
  status: 'interested' | 'going' | 'not_going' = 'interested',
  guestCount: number = 0
): Promise<RSVP> {
  try {
    const { data, error } = await supabase
      .from('rsvp')
      .insert({
        user_id: userId,
        event_instance_id: eventInstanceId,
        status,
        guest_count: guestCount
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating RSVP:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createRSVP:', error);
    throw error;
  }
}

/**
 * Updates an existing RSVP
 * 
 * @param rsvpId - The RSVP ID
 * @param updates - Partial RSVP data to update
 * @returns Promise resolving to the updated RSVP
 */
export async function updateRSVP(
  rsvpId: string,
  updates: Partial<Pick<RSVP, 'status' | 'guest_count'>>
): Promise<RSVP> {
  try {
    const { data, error } = await supabase
      .from('rsvp')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', rsvpId)
      .select()
      .single();

    if (error) {
      console.error('Error updating RSVP:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateRSVP:', error);
    throw error;
  }
}

/**
 * Subscribes a user to a group for feeds and notifications
 * 
 * @param userId - The user's profile ID
 * @param groupId - The group ID
 * @returns Promise resolving to the created subscription
 */
export async function subscribeToGroup(
  userId: string,
  groupId: string
): Promise<Subscription> {
  try {
    const { data, error } = await supabase
      .from('subscription')
      .insert({
        user_id: userId,
        grp_id: groupId
      })
      .select()
      .single();

    if (error) {
      console.error('Error subscribing to group:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in subscribeToGroup:', error);
    throw error;
  }
}

/**
 * Unsubscribes a user from a group
 * 
 * @param userId - The user's profile ID
 * @param groupId - The group ID
 * @returns Promise resolving to success boolean
 */
export async function unsubscribeFromGroup(
  userId: string,
  groupId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('subscription')
      .delete()
      .eq('user_id', userId)
      .eq('grp_id', groupId);

    if (error) {
      console.error('Error unsubscribing from group:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in unsubscribeFromGroup:', error);
    throw error;
  }
}

/**
 * Fetches event series details with tags and audience
 * 
 * @param eventSeriesId - The event series ID
 * @returns Promise resolving to event series with details
 */
export async function getEventSeriesDetails(
  eventSeriesId: string
): Promise<EventSeriesWithDetails | null> {
  try {
    const { data, error } = await supabase
      .from('event_series')
      .select(`
        *,
        grp (*),
        event_series_tag (
          tag (*)
        ),
        event_audience (*)
      `)
      .eq('id', eventSeriesId)
      .single();

    if (error) {
      console.error('Error fetching event series details:', error);
      throw error;
    }

    return {
      ...data,
      tags: data.event_series_tag?.map(est => est.tag) || [],
      audience: data.event_audience || [],
      group: data.grp
    };
  } catch (error) {
    console.error('Error in getEventSeriesDetails:', error);
    throw error;
  }
}
