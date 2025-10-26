// Generate a random avatar URL using a service like DiceBear
export function generateRandomAvatar(seed?: string): string {
  const avatarSeed = seed || Math.random().toString(36).substring(7)
  // Using DiceBear API for avatar generation
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`
}

// Alternative avatar services you could use:
// - https://avatars.dicebear.com/
// - https://ui-avatars.com/
// - https://robohash.org/