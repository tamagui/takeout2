---
name: takeout-react-native-navigation-flow
description: React Native navigation and mobile routing guide for One framework. React Native navigation, native navigation, useRouter, useParams on native, drawer layout, drawer navigation, mobile routing, One framework routing, screen transitions, navigation flow.
---

# React Native Navigation Flow

## Overview

This app uses the One framework instead of React Navigation. One provides
unified routing for both web and React Native platforms using a file-based
routing system.

## Navigation Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    App Entry Point                       │
│              (One Framework Bootstrap)                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│                 app/_layout.tsx                          │
│   • SafeAreaProvider                                     │
│   • TamaguiProvider (Theme)                             │
│   • SchemeProvider (Color Scheme)                       │
│   • DataProvider (Zero sync)                            │
│   • AuthEffects                                         │
│   • <Slot /> (renders current route)                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│            app/(chat)/_layout.native.tsx                 │
│   • Drawer Layout (slide menu)                          │
│   • Server/Channel Context Providers                    │
│   • Safe Area Insets                                    │
│   • <Slot /> (renders chat routes)                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
        ┌────────────┴────────────┬─────────────┐
        │                         │             │
        ↓                         ↓             ↓
┌───────────────┐       ┌─────────────┐ ┌──────────────┐
│ index.tsx     │       │ [serverId]/ │ │ private/     │
│ (Home Page)   │       │ (Channels)  │ │ (DMs)        │
└───────────────┘       └─────────────┘ └──────────────┘
```

## Navigation Components

### 1. Slot Component

- From `one` framework
- Renders the current route content
- Similar to React Router's `<Outlet />`

### 2. Drawer Component

- From `react-native-drawer-layout`
- Provides sliding sidebar on mobile
- Contains server list and channels

### 3. Navigation Hooks

```typescript
// get current route parameters
const params = useParams()
const { serverId, channelId } = useServerParams()

// programmatic navigation
const router = useRouter()
router.navigate(`/${serverId}/${channelId}`)

// current pathname (web only)
const pathname = usePathname() // must check isWeb first
```

## Navigation Flow Examples

### 1. App Launch Flow

```
App Start → Check Auth →
  ├─ Authenticated → Redirect to last visited page
  └─ Not Authenticated → Show home page
```

### 2. Server Navigation Flow

```
User taps server →
  Update context (serverId) →
  Navigate to default channel →
  Close drawer →
  Render channel messages
```

### 3. Deep Link Flow

```
Deep link received →
  Parse URL parameters →
  Navigate to specific message/thread →
  Scroll to message
```

## Platform-Specific Behaviors

### React Native

- Drawer navigation for sidebar
- Safe area handling
- Touch-based interactions
- No browser history API

### Web

- Fixed sidebar (responsive)
- Browser history navigation
- URL-based routing
- Keyboard shortcuts

## Context Flow

```
┌─────────────────────────┐
│   Navigation Event      │
│ (tap, link, redirect)   │
└───────────┬─────────────┘
            │
            ↓
┌─────────────────────────┐
│  Update URL/Route       │
│  (One Framework)        │
└───────────┬─────────────┘
            │
            ↓
┌─────────────────────────┐
│  Update Contexts        │
│  • CurrentServerId      │
│  • CurrentChannelId     │
│  • CurrentThreadId      │
└───────────┬─────────────┘
            │
            ↓
┌─────────────────────────┐
│  Re-render Components   │
│  • Sidebar highlights   │
│  • Message list         │
│  • Header info          │
└─────────────────────────┘
```

## Key Files

1. Navigation Setup

   - `/app/_layout.tsx` - Root layout
   - `/app/(chat)/_layout.native.tsx` - Native chat layout
   - `/src/interface/app/Link.tsx` - Link component wrapper

2. Navigation Helpers

   - `/src/features/channel/getChannelLink.ts`
   - `/src/features/message/getMessageLink.ts`
   - `/src/features/server/useServerParams.ts`

3. Context Providers
   - `/src/context/CurrentServerId.tsx`
   - `/src/context/CurrentChannelId.tsx`
   - `/src/context/CurrentThreadId.tsx`

## Important Notes

1. No React Navigation: This app uses One framework's built-in routing, not
   React Navigation
2. File-based Routing: Routes are determined by file structure in `/app`
3. Platform Parity: Same routing code works on both web and native
4. Context-based State: Navigation state is managed through React Context
5. URL-driven: Even on native, routing is URL-based (though not visible to
   users)
