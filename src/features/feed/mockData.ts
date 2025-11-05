import type { Post, User } from '~/data/types'

export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Alex Chen',
    username: 'alexchen',
    image: 'https://i.pravatar.cc/150?img=12',
    joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
    hasOnboarded: true,
    whitelisted: true,
    migrationVersion: 1,
    postsCount: 15,
  },
  {
    id: 'user-2',
    name: 'Sarah Kim',
    username: 'sarahk',
    image: 'https://i.pravatar.cc/150?img=5',
    joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 60,
    hasOnboarded: true,
    whitelisted: true,
    migrationVersion: 1,
    postsCount: 23,
  },
  {
    id: 'user-3',
    name: 'Marcus Johnson',
    username: 'marcusj',
    image: 'https://i.pravatar.cc/150?img=33',
    joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 45,
    hasOnboarded: true,
    whitelisted: true,
    migrationVersion: 1,
    postsCount: 8,
  },
  {
    id: 'user-4',
    name: 'Emma Wilson',
    username: 'emmaw',
    image: 'https://i.pravatar.cc/150?img=47',
    joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 90,
    hasOnboarded: true,
    whitelisted: true,
    migrationVersion: 1,
    postsCount: 42,
  },
  {
    id: 'user-5',
    name: 'David Park',
    username: 'davidp',
    image: 'https://i.pravatar.cc/150?img=59',
    joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 15,
    hasOnboarded: true,
    whitelisted: true,
    migrationVersion: 1,
    postsCount: 12,
  },
]

export const mockPosts: Post[] = [
  {
    id: 'post-1',
    userId: 'user-1',
    image: 'https://picsum.photos/seed/1/1200/1600',
    caption: 'beautiful sunset at the beach today 🌅',
    hiddenByAdmin: false,
    createdAt: Date.now() - 1000 * 60 * 30,
  },
  {
    id: 'post-2',
    userId: 'user-2',
    image: 'https://picsum.photos/seed/2/1200/1600',
    caption:
      'finally tried that new coffee shop downtown ☕️ the vibes are immaculate and the latte art is on point',
    hiddenByAdmin: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
  },
  {
    id: 'post-3',
    userId: 'user-3',
    image: 'https://picsum.photos/seed/3/1200/1600',
    caption: 'weekend hiking adventures 🏔️',
    hiddenByAdmin: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
  },
  {
    id: 'post-4',
    userId: 'user-4',
    image: 'https://picsum.photos/seed/4/1200/1600',
    caption:
      'homemade pasta from scratch! took forever but totally worth it 🍝 recipe in my bio',
    hiddenByAdmin: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 8,
  },
  {
    id: 'post-5',
    userId: 'user-5',
    image: 'https://picsum.photos/seed/5/1200/1600',
    caption: 'golden hour hits different',
    hiddenByAdmin: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 12,
  },
  {
    id: 'post-6',
    userId: 'user-1',
    image: 'https://picsum.photos/seed/6/1200/1600',
    caption:
      'throwback to last summer when we spontaneously drove up the coast. still thinking about those fish tacos 🌮',
    hiddenByAdmin: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 18,
  },
  {
    id: 'post-7',
    userId: 'user-2',
    image: 'https://picsum.photos/seed/7/1200/1600',
    caption: 'new plant baby alert 🪴 hoping i dont kill this one lol',
    hiddenByAdmin: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
  },
  {
    id: 'post-8',
    userId: 'user-3',
    image: 'https://picsum.photos/seed/8/1200/1600',
    caption: 'city lights',
    hiddenByAdmin: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 30,
  },
  {
    id: 'post-9',
    userId: 'user-4',
    image: 'https://picsum.photos/seed/9/1200/1600',
    caption:
      'found this cute bookshop tucked away in an alley. spent 3 hours browsing and left with way too many books 📚',
    hiddenByAdmin: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 36,
  },
  {
    id: 'post-10',
    userId: 'user-5',
    image: 'https://picsum.photos/seed/10/1200/1600',
    caption: 'morning motivation ✨',
    hiddenByAdmin: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 48,
  },
  {
    id: 'post-11',
    userId: 'user-1',
    image: 'https://picsum.photos/seed/11/1200/1600',
    caption: 'rainy day mood 🌧️',
    hiddenByAdmin: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 60,
  },
  {
    id: 'post-12',
    userId: 'user-2',
    image: 'https://picsum.photos/seed/12/1200/1600',
    caption:
      'finally finished this painting i started like 6 months ago 🎨 procrastination is real',
    hiddenByAdmin: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 72,
  },
  {
    id: 'post-13',
    userId: 'user-3',
    image: 'https://picsum.photos/seed/13/1200/1600',
    caption: 'sunset vibes',
    hiddenByAdmin: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 84,
  },
  {
    id: 'post-14',
    userId: 'user-4',
    image: 'https://picsum.photos/seed/14/1200/1600',
    caption: 'farmers market haul 🥕🥬🍅 eating good this week',
    hiddenByAdmin: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 96,
  },
  {
    id: 'post-15',
    userId: 'user-5',
    image: 'https://picsum.photos/seed/15/1200/1600',
    caption:
      'late night studio session. this track is coming together nicely 🎧 might drop it next week',
    hiddenByAdmin: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 108,
  },
]

// helper to get user by id
export const getMockUserById = (userId: string): User | undefined => {
  return mockUsers.find((u) => u.id === userId)
}

// helper to get posts with pagination
export const getMockPostsPaginated = (cursor?: Post | null, pageSize = 10): Post[] => {
  if (!cursor) {
    return mockPosts.slice(0, pageSize)
  }

  const cursorIndex = mockPosts.findIndex((p) => p.id === cursor.id)
  if (cursorIndex === -1) {
    return []
  }

  return mockPosts.slice(cursorIndex + 1, cursorIndex + 1 + pageSize)
}
