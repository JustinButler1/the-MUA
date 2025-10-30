-- Migration: Add posts table with support for announcement, flyer, and newsletter post types
-- This migration creates a posts table that supports three different post types:
-- 1. Announcement posts (text only)
-- 2. Flyer posts (image with text)
-- 3. Newsletter posts (headline, subtext, and optional content that opens to detail page)

-- Create post type enum
CREATE TYPE post_type AS ENUM ('announcement', 'flyer', 'newsletter');

-- Create posts table
CREATE TABLE posts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type            post_type NOT NULL,
  author_id       uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  group_id        uuid NOT NULL REFERENCES grp(id) ON DELETE CASCADE,
  
  -- Common fields
  content         text, -- For announcement and flyer posts
  image_url       text, -- For flyer posts and optional newsletter preview
  
  -- Newsletter-specific fields
  headline        text, -- For newsletter posts
  subtext         text, -- For newsletter posts
  newsletter_content text, -- Full content for newsletter detail page
  
  -- Engagement metrics
  likes_count     integer NOT NULL DEFAULT 0,
  comments_count  integer NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT posts_content_required_for_announcement 
    CHECK (type != 'announcement' OR content IS NOT NULL),
  CONSTRAINT posts_content_and_image_required_for_flyer 
    CHECK (type != 'flyer' OR (content IS NOT NULL AND image_url IS NOT NULL)),
  CONSTRAINT posts_headline_subtext_required_for_newsletter 
    CHECK (type != 'newsletter' OR (headline IS NOT NULL AND subtext IS NOT NULL))
);

-- Create indexes for performance
CREATE INDEX posts_author_id_idx ON posts(author_id);
CREATE INDEX posts_group_id_idx ON posts(group_id);
CREATE INDEX posts_type_idx ON posts(type);
CREATE INDEX posts_created_at_idx ON posts(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_posts_updated_at 
  BEFORE UPDATE ON posts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create posts_likes table for user likes
CREATE TABLE posts_likes (
  post_id         uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

-- Create posts_comments table for comments
CREATE TABLE posts_comments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id       uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  content         text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Create updated_at trigger for comments
CREATE TRIGGER update_posts_comments_updated_at 
  BEFORE UPDATE ON posts_comments 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for comments
CREATE INDEX posts_comments_post_id_idx ON posts_comments(post_id);
CREATE INDEX posts_comments_author_id_idx ON posts_comments(author_id);
CREATE INDEX posts_comments_created_at_idx ON posts_comments(created_at DESC);

-- Function to update post engagement counts
CREATE OR REPLACE FUNCTION update_post_engagement_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update likes count
    IF TG_TABLE_NAME = 'posts_likes' THEN
      UPDATE posts 
      SET likes_count = likes_count + 1 
      WHERE id = NEW.post_id;
    END IF;
    
    -- Update comments count
    IF TG_TABLE_NAME = 'posts_comments' THEN
      UPDATE posts 
      SET comments_count = comments_count + 1 
      WHERE id = NEW.post_id;
    END IF;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update likes count
    IF TG_TABLE_NAME = 'posts_likes' THEN
      UPDATE posts 
      SET likes_count = likes_count - 1 
      WHERE id = OLD.post_id;
    END IF;
    
    -- Update comments count
    IF TG_TABLE_NAME = 'posts_comments' THEN
      UPDATE posts 
      SET comments_count = comments_count - 1 
      WHERE id = OLD.post_id;
    END IF;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update engagement counts
CREATE TRIGGER update_post_likes_count
  AFTER INSERT OR DELETE ON posts_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_engagement_counts();

CREATE TRIGGER update_post_comments_count
  AFTER INSERT OR DELETE ON posts_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_engagement_counts();

-- Add some sample data for testing (only if groups exist)
DO $$
BEGIN
  -- Only insert sample data if we have groups and profiles
  IF EXISTS (SELECT 1 FROM grp LIMIT 1) AND EXISTS (SELECT 1 FROM profiles LIMIT 1) THEN
    INSERT INTO posts (type, author_id, group_id, content) VALUES
    ('announcement', (SELECT user_id FROM profiles LIMIT 1), (SELECT id FROM grp LIMIT 1), 'Welcome to our community! This is an announcement post.');

    INSERT INTO posts (type, author_id, group_id, content, image_url) VALUES
    ('flyer', (SELECT user_id FROM profiles LIMIT 1), (SELECT id FROM grp LIMIT 1), 'Check out our upcoming event!', 'https://example.com/flyer-image.jpg');

    INSERT INTO posts (type, author_id, group_id, headline, subtext, newsletter_content) VALUES
    ('newsletter', (SELECT user_id FROM profiles LIMIT 1), (SELECT id FROM grp LIMIT 1), 'Monthly Newsletter', 'Stay updated with our latest news and events', 'This is the full content of our monthly newsletter. It contains detailed information about upcoming events, community updates, and important announcements.');
  END IF;
END $$;
