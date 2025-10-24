import { useRef } from 'react'
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { RightIsland, type RightIslandRef } from './RightIsland'

const avatars = [
  { id: 1, name: 'Alex', uri: 'https://i.pravatar.cc/150?img=1' },
  { id: 2, name: 'Sarah', uri: 'https://i.pravatar.cc/150?img=2' },
  { id: 3, name: 'Mike', uri: 'https://i.pravatar.cc/150?img=3' },
  { id: 4, name: 'Emma', uri: 'https://i.pravatar.cc/150?img=4' },
]

export const RightIslandDemo = () => {
  const islandRef = useRef<RightIslandRef>(null)

  const handleToggle = () => {
    islandRef.current?.toggle()
  }

  // Main blue screen content
  const MainContent = () => (
    <View style={styles.mainContent}>
      <Text style={styles.appTitle}>Tickr</Text>

      <View style={styles.contentArea}>
        <Text style={styles.contentText}>prosku</Text>
        <Text style={styles.contentText}>$ • In Progress</Text>
        <Text style={styles.userName}>Alex</Text>
        <Text style={styles.canEdit}>Can Edit ✓</Text>
      </View>

      <TouchableOpacity style={styles.toggleButton} onPress={handleToggle}>
        <Text style={styles.toggleButtonText}>Toggle Island</Text>
      </TouchableOpacity>
    </View>
  )

  // Island content with avatars - smaller list for smaller island
  const IslandContent = () => (
    <ScrollView
      style={styles.avatarScroll}
      contentContainerStyle={styles.avatarContainer}
      showsVerticalScrollIndicator={false}
    >
      {avatars.map((avatar) => (
        <TouchableOpacity key={avatar.id} style={styles.avatarItem}>
          <Image source={{ uri: avatar.uri }} style={styles.avatar} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  )

  return (
    <RightIsland ref={islandRef} mainContent={<MainContent />}>
      <IslandContent />
    </RightIsland>
  )
}

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 100,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 40,
  },
  contentArea: {
    flex: 1,
    justifyContent: 'center',
  },
  contentText: {
    fontSize: 24,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 15,
  },
  userName: {
    fontSize: 42,
    fontWeight: '600',
    color: 'white',
    marginTop: 30,
    marginBottom: 10,
  },
  canEdit: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  toggleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    alignSelf: 'center',
    marginBottom: 50,
  },
  toggleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  avatarScroll: {
    flex: 1,
    width: '100%',
    backgroundColor: 'transparent',
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: 5,
    gap: 5,
    backgroundColor: 'transparent',
  },
  avatarItem: {
    marginVertical: 5,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
})
