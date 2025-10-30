import { Post } from '@/lib/types/posts';

/**
 * Dummy post data for testing and development
 * Simulates real posts from various groups
 */
export const dummyPosts: Post[] = [
  {
    id: '1',
    type: 'announcement',
    author: {
      id: 'user1',
      name: 'Alex Johnson',
    },
    group: {
      id: 'grp1',
      name: 'Spades Club',
    },
    content: 'Just finished an amazing game of Spades! The bidding was intense and we managed to make our contract by the skin of our teeth. Who else is up for another round?',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
    likes: 12,
    comments: 3,
    isLiked: false,
  },
  {
    id: '2',
    type: 'flyer',
    author: {
      id: 'user2',
      name: 'Sarah Chen',
    },
    group: {
      id: 'grp2',
      name: 'Card Game Enthusiasts',
    },
    content: 'Looking for players for a casual Hearts game this weekend. Beginners welcome! We\'ll be meeting at the community center at 2 PM. Bring snacks! 🃏',
    imageUrl: 'https://images.unsplash.com/photo-1549421263-8a1c1d1c2b54?q=80&w=1600&auto=format&fit=crop',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
    likes: 8,
    comments: 5,
    isLiked: true,
  },
  {
    id: '3',
    type: 'newsletter',
    author: {
      id: 'user3',
      name: 'Mike Rodriguez',
    },
    group: {
      id: 'grp1',
      name: 'Spades Club',
    },
    headline: 'Weekly Strategy Digest',
    subtext: 'Counting spades and timing your bids effectively',
    content: 'Pro tip: Always count your spades before bidding! I learned this the hard way today 😅 What\'s your favorite bidding strategy?',
    imageUrl: 'https://images.unsplash.com/photo-1556745757-8d76bdb6984b?q=80&w=1600&auto=format&fit=crop',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    likes: 15,
    comments: 7,
    isLiked: false,
  },
  {
    id: '4',
    type: 'flyer',
    author: {
      id: 'user4',
      name: 'Emma Thompson',
    },
    group: {
      id: 'grp3',
      name: 'Game Night Crew',
    },
    content: 'Our monthly tournament is coming up! We\'re expecting 20+ players this time. The prize pool is looking good too. Sign up closes Friday - don\'t miss out! 🏆',
    imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1600&auto=format&fit=crop',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    likes: 23,
    comments: 12,
    isLiked: true,
  },
  {
    id: '5',
    type: 'announcement',
    author: {
      id: 'user5',
      name: 'David Kim',
    },
    group: {
      id: 'grp2',
      name: 'Card Game Enthusiasts',
    },
    content: 'Just discovered this amazing new card game called "The Crew". It\'s cooperative and really challenging! Has anyone else tried it?',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    likes: 6,
    comments: 4,
    isLiked: false,
  },
  {
    id: '6',
    type: 'announcement',
    author: {
      id: 'user6',
      name: 'Lisa Wang',
    },
    group: {
      id: 'grp1',
      name: 'Spades Club',
    },
    content: 'Can\'t believe I got a Boston hand today! First time in months. The look on my partner\'s face was priceless 😂',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
    likes: 18,
    comments: 9,
    isLiked: true,
  },
  {
    id: '7',
    type: 'newsletter',
    author: {
      id: 'user7',
      name: 'James Wilson',
    },
    group: {
      id: 'grp4',
      name: 'Bridge Masters',
    },
    headline: 'Passing Down the Game',
    subtext: 'Teaching bridge to the next generation',
    content: 'Teaching my daughter to play bridge. She\'s picking it up faster than I did! Nothing beats passing down the love of card games to the next generation.',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    likes: 31,
    comments: 8,
    isLiked: false,
  },
  {
    id: '8',
    type: 'flyer',
    author: {
      id: 'user8',
      name: 'Maria Garcia',
    },
    group: {
      id: 'grp3',
      name: 'Game Night Crew',
    },
    content: 'Hosting a poker night this Friday! Texas Hold\'em, $10 buy-in. We\'ll have pizza and drinks. RSVP by Thursday so I know how much food to order.',
    imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1600&auto=format&fit=crop',
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), // 18 hours ago
    likes: 14,
    comments: 6,
    isLiked: true,
  },
  {
    id: '9',
    type: 'announcement',
    author: {
      id: 'user9',
      name: 'Tom Anderson',
    },
    group: {
      id: 'grp2',
      name: 'Card Game Enthusiasts',
    },
    content: 'Found this vintage deck of cards at a flea market today. The artwork is incredible! Sometimes the old stuff really is the best.',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    likes: 9,
    comments: 2,
    isLiked: false,
  },
  {
    id: '10',
    type: 'announcement',
    author: {
      id: 'user10',
      name: 'Rachel Brown',
    },
    group: {
      id: 'grp1',
      name: 'Spades Club',
    },
    content: 'New to the group! Just moved to the area and looking to meet fellow card game lovers. Any tips for finding regular games?',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    likes: 7,
    comments: 11,
    isLiked: false,
  },
];

/**
 * Simulates fetching posts with pagination
 * @param page - Page number (0-based)
 * @param pageSize - Number of posts per page
 * @returns Promise<Post[]> - Array of posts for the requested page
 */
export async function fetchDummyPosts(page: number = 0, pageSize: number = 10): Promise<Post[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const startIndex = page * pageSize;
  const endIndex = startIndex + pageSize;
  
  return dummyPosts.slice(startIndex, endIndex);
}

/**
 * Simulates liking/unliking a post
 * @param postId - ID of the post to toggle like
 * @param isLiked - Whether the post should be liked
 * @returns Promise<Post> - Updated post
 */
export async function togglePostLike(postId: string, isLiked: boolean): Promise<Post> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const post = dummyPosts.find(p => p.id === postId);
  if (!post) {
    throw new Error('Post not found');
  }
  
  const updatedPost = {
    ...post,
    isLiked,
    likes: isLiked ? post.likes + 1 : Math.max(0, post.likes - 1),
  };
  
  // Update the dummy data
  const index = dummyPosts.findIndex(p => p.id === postId);
  if (index !== -1) {
    dummyPosts[index] = updatedPost;
  }
  
  return updatedPost;
}
