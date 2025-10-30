/**
 * Type definitions for different post types in the application
 * Supports text-only, announcement, event, and newsletter post formats
 */

export type PostType = 'text-only' | 'announcement' | 'event' | 'newsletter';

export interface BasePost {
  id: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  group: {
    id: string;
    name: string;
  };
  createdAt: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
}

/**
 * Announcement post - text only content
 */
export interface AnnouncementPost extends BasePost {
  type: 'announcement';
  content: string;
}

/**
 * Text-only post - simple text content
 */
export interface TextOnlyPost extends BasePost {
  type: 'text-only';
  content: string;
}

/**
 * Event post - event information with optional image
 */
export interface EventPost extends BasePost {
  type: 'event';
  content: string;
  imageUrl?: string;
}

/**
 * Newsletter post - headline and subtext, opens to detail page
 */
export interface NewsletterPost extends BasePost {
  type: 'newsletter';
  headline: string;
  subtext: string;
  content?: string; // Optional preview content
  imageUrl?: string; // Optional preview image
}

/**
 * Union type for all post types
 */
export type Post = TextOnlyPost | AnnouncementPost | EventPost | NewsletterPost;

/**
 * Type guard functions to check post types
 */
export function isTextOnlyPost(post: Post): post is TextOnlyPost {
  return post.type === 'text-only';
}

export function isAnnouncementPost(post: Post): post is AnnouncementPost {
  return post.type === 'announcement';
}

export function isEventPost(post: Post): post is EventPost {
  return post.type === 'event';
}

export function isNewsletterPost(post: Post): post is NewsletterPost {
  return post.type === 'newsletter';
}
