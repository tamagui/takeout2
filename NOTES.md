# Takeout3 Migration Notes

## Current Status (2024-10-24) - MIGRATION MOSTLY COMPLETE

### Phase 1 - Data Layer Migration ✅
- Removed all chat/messaging/server models (30+ files)
- Imported social models from fleek (post, like, follows, block, report, userStats)
- Updated user model with social fields (bio, ranking, walletAddress, socialLinks)
- Simplified migrations to basic social setup

### Phase 2 - UI Migration ✅
- Imported fleek app routing structure (auth, onboarding, main tabs)
- Cleaned up CSS files, removed chat-specific styles
- Imported essential UI components from fleek
- Replaced react-native-reanimated with Tamagui animations
- Removed Tauri desktop integration
- Created stub modules for analytics, feature flags, statsig

### Phase 3 - Cleanup ✅
- Removed references to deleted chat/server features
- Simplified dialogs to only essential ones
- Fixed all lint errors (now passing)
- Reduced TypeScript errors from 400+ to 381

### Remaining Work
- **TypeScript Errors**: 381 errors remaining, mostly missing component imports and type mismatches
- **Missing Components**: Some UI components still need to be imported or stubbed
- **Testing**: Basic functionality needs to be tested (auth, feed, profile)
- **Documentation**: Update README with starter kit setup instructions

## Project Goal
Transform takeout3 from a chat-based application (based on ~/chat) into a social media starter kit by incorporating features from ~/fleek, while keeping it simple and universal (web + native).

## Key Decisions

### Architecture Principles
- **Universal First**: Avoid .native specific files where possible, use Tamagui for animations
- **Simple Data Models**: Keep only user + post as examples (removing 30+ chat/server models)
- **Tab Navigation**: Replace sidebar with tab-based navigation (home | create | profile)
- **No Reanimated**: Use Tamagui animations instead of react-native-reanimated
- **No Friendship System**: Using simpler follows/followers pattern
- **Keep Minimal**: Only auth, onboarding, basic feed, post, settings, compliance features

### What We're Keeping from Takeout3 (~/chat)
- Better infrastructure setup and config
- PostHog/Postmark services (fleek uses Statsig/Mailgun)
- Cleaner project structure
- Admin helper authentication
- Device model for push notifications
- Private beta invite system

### What We're Taking from Fleek
- Tab-based layout (main | create | profile)
- Authentication flows (login, signup, OTP, profile setup, avatar setup)
- User onboarding flow
- Basic feed + post functionality
- Like/follow/block social features
- Report system for compliance
- Settings page structure
- Profile viewing and editing

### What We're NOT Taking from Fleek
- Character/AI conversation features
- Token/wallet/crypto features
- Draft system (keeping it simple)
- Complex animation files using reanimated
- Studio/content creation features
- Native-specific implementations where avoidable

## Migration Progress Tracking

### Phase 1: Cleanup (COMPLETED) ✅
- [x] Research all three repositories
- [x] Create comprehensive migration plan
- [x] Document decisions in NOTES.md

### Phase 2: Delete Old Features (COMPLETED) ✅
- [x] Remove chat/messaging models (30+ files)
  - server, serverMember, channel, channelActive, channelPermission, channelTopic, channelTopicMessage
  - message, messageReaction, messageReactionStats, thread, seen, pin, indicator
  - meeting, meetingUser
- [x] Remove app/bot models
  - app, appInstall, appInstallPermission, data, task, taskRun, job
- [x] Remove friendship model
- [x] Remove attachment model
- [x] Remove chat UI components
  - src/interface/sidebar/
  - src/interface/chat/
  - src/interface/activity/
  - src/interface/searchable-list/
- [x] Remove chat features
  - src/features/notification/ (chat-specific)
  - src/features/attachments/
  - src/features/sidecar/
  - src/features/analytics/ (replacing with Statsig)

### Phase 3: Import Fleek Features (COMPLETED) ✅
- [x] Import auth routes (13 files)
- [x] Import tab structure (15 files)
- [x] Import user profile routes (6 files)
- [x] Import social models (post, like, follows, block, report, userStats)
- [x] Import feed features
- [x] Import profile features
- [x] Import compliance features (report, block)
- [x] Import UI components (sheets, alerts, snackbars, etc.)

### Phase 4: Update Infrastructure (COMPLETED) ✅
- [x] Update user model with fleek fields (bio, ranking, walletAddress, socialLinks, whitelisted)
- [x] Simplify userState model
- [x] Update tables.ts
- [x] Update models.ts
- [x] Update relationships.ts
- [x] Clean migrations folder
- [x] Remove Tauri references

### Phase 5: Testing & Cleanup (IN PROGRESS)
- [x] Fix lint errors
- [x] Run linting (passing)
- [ ] Fix remaining TypeScript errors (381 remaining)
- [ ] Test web dev server
- [ ] Test auth flow
- [ ] Test main routes
- [ ] Remove unused dependencies
- [ ] Final review

## Components Created/Stubbed

### Stub Modules Created
- `src/features/analytics/analytics.ts` - Simple analytics stub
- `src/features/apps/ui/AppProvider.tsx` - Basic provider wrapper
- `src/statsig/client-bindings.tsx` - Statsig stub with useStatsig and useStatsigClient
- `src/features/unfurl/unfurl.ts` - URL unfurl stub
- `src/constants/server-urls.ts` - Server URL configuration
- `src/auth/consts.ts` - Auth constants and onboarding steps
- `src/interface/constants.ts` - Added PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL

### Components Imported from Fleek
- Contexts: OnboardingContext, AppInitContext
- Interface: Pressable, StepPageLayout, PageHeader, BasicHeader
- Text components: Body, Headings
- Icons: Full icon set from fleek
- Toast: Full toast system
- Brand components: Logo
- Image components: ResponsiveImage
- Interaction components: RepeatedTapToShowDevTools
- Auth client modules: otpLogin, passwordLogin, signInAsAdmin

### Files Removed/Cleaned
- Removed all Tauri references
- Removed app/_layout.native.tsx
- Simplified dialog system (removed server/chat dialogs)
- Cleaned up migrations to remove server/channel references

## Known Issues to Address

1. **TypeScript Errors**: 381 errors remaining, mostly:
   - Missing module imports (TS2307: 138 errors)
   - Property doesn't exist (TS2339: 78 errors)
   - Missing type annotations (TS7006: 65 errors)

2. **Button Variant Issue**: "highlight" variant not in Tamagui Button types (may need custom theme)

3. **Auth State Type Mismatch**: Better Auth state doesn't have `loggedIn` property, uses `state: "logged-in"`

4. **Missing Features**: Some components still reference deleted features and need cleanup

## Next Steps for Completion

1. **Fix Critical Type Errors**:
   - Import or stub remaining missing modules
   - Fix auth state type references
   - Add missing type annotations

2. **Test Basic Functionality**:
   - Start dev server
   - Test auth flow
   - Test feed display
   - Test post creation

3. **Documentation**:
   - Update README with setup instructions
   - Document the starter kit features
   - Add usage examples

4. **Cleanup**:
   - Remove unused dependencies from package.json
   - Clean up any remaining dead code
   - Optimize bundle size

## Dependencies to Update

### To Remove (Later)
- @tauri-apps/* (Already removed references)
- posthog-js, posthog-node (if fully replacing with Statsig)
- Chat-specific native dependencies

### To Consider Adding
- Proper statsig integration (currently stubbed)
- Additional social platform packages as needed

## Testing Checklist (For Later)

### Core Flows
- [ ] User can access homepage
- [ ] User can sign up with email
- [ ] User can complete onboarding (profile setup, avatar)
- [ ] User can log in
- [ ] User can view feed
- [ ] User can create a post
- [ ] User can like posts
- [ ] User can follow/unfollow users
- [ ] User can edit profile
- [ ] User can access settings
- [ ] User can block/report content

### Platform Testing
- [x] Linting passes
- [ ] TypeScript compiles without errors (381 errors remain)
- [ ] Web builds and runs
- [ ] No console errors on main flows

## Decisions Log

### 2024-10-24
- Decided to use sub-agents for faster analysis
- Chose to remove all chat/messaging features completely
- Decided to keep device model for future push notifications
- Chose tab navigation over sidebar
- Decided against importing character/AI features from fleek
- Chose to simplify data models to just user + post as examples
- Created stub modules for missing features rather than full implementations
- Replaced react-native-reanimated with Tamagui animations
- Removed all Tauri desktop integration

---

*This document tracks the migration progress and important decisions. The migration is mostly complete with lint passing and TypeScript errors reduced from 400+ to 381. The starter kit structure is in place and ready for testing and final cleanup.*