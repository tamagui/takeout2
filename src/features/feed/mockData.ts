export const mockCaptions = [
  'just vibing ✨💫',
  'living my best life 🌟',
  'caught in 4k 📸✨',
  'no caption needed 💅',
  'golden hour hits different 🌅✨',
  'main character energy 💫🎬',
  'aesthetic things only 🌸🦋',
  'soft life era 🧸☁️',
  "it's giving summer vibes 🌺☀️",
  'chaos coordinator 🎨✨',
  'coffee first, adulting later ☕️😴',
  'collecting moments 📸💭',
  "plot twist: i'm the vibe 💫",
  'certified overthinker 🤔💭',
  'here for a good time 🎉✨',
  'chasing sunsets and dreams 🌅💫',
  'mood: unbothered 😌✨',
  'living in my own movie 🎬🌟',
  'weekend loading... 📊✨',
  'making memories 🌟📸',
  'stay golden 🌟✨',
  'feeling cute, might delete later 🙈💕',
  'blessing your feed rn 💫📱',
  'serving looks 💅✨',
  'in my element 🌊🌟',
]

export const mockCommentCounts = [
  5, 12, 23, 8, 45, 67, 15, 32, 91, 18, 7, 29, 156, 42, 11, 88, 24, 53, 76, 9, 234, 17,
  64, 38, 125, 6, 85, 21, 47, 103,
]

export const mockMagicWandCounts = [
  3, 8, 15, 24, 6, 42, 11, 89, 32, 18, 56, 7, 91, 23, 45, 12, 67, 29, 84, 5, 123, 38, 71,
  14, 96, 52, 9, 78, 31, 65,
]

export const getRandomCaption = () => {
  return mockCaptions[Math.floor(Math.random() * mockCaptions.length)]
}

export const getRandomCommentCount = () => {
  return mockCommentCounts[Math.floor(Math.random() * mockCommentCounts.length)]
}

export const getRandomMagicWandCount = () => {
  return mockMagicWandCounts[Math.floor(Math.random() * mockMagicWandCounts.length)]
}
