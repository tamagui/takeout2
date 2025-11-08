# Native iOS/Android CI/CD Infrastructure Migration Plan

## Executive Summary

This document outlines a comprehensive plan to bring enterprise-grade mobile build and testing infrastructure to takeout3, based on patterns from fleek, chat, and tamagui repositories. The plan focuses on practical, production-ready solutions without Maestro, emphasizing EAS for builds and Appium for testing.

**Current State**: iOS GitHub Actions workflows exist but lack Android support, EAS integration, and mobile E2E testing.

**Target State**: Full iOS/Android build automation with EAS, comprehensive E2E testing with Appium, and hot update deployment.

## Key Technologies

- **EAS (Expo Application Services)**: Cloud build infrastructure for iOS/Android
- **GitHub Actions**: Self-hosted iOS builds and CI/CD orchestration
- **Appium + WebdriverIO**: Mobile E2E testing framework
- **Hot Updater**: OTA updates for React Native apps
- **Fastlane Match**: iOS code signing management (simplified, no Fastfile)

## Phase 1: EAS Foundation (Week 1)

### 1.1 EAS Configuration Setup

Create `eas.json` with multi-environment support:

- **Development**: Development builds with debugging enabled
- **Preview**: Staging builds for QA testing
- **Production**: Release builds for app stores

Key configurations:
- Separate bundle IDs per environment (com.takeout.app.dev, .preview, .prod)
- Auto-increment build numbers
- Resource class optimization for faster builds
- Environment-specific API endpoints

### 1.2 EAS Workflows

Create `.eas/workflows/` directory with three automated workflows:

1. **Development builds**: Triggered on lockfile/config changes
2. **Preview builds**: Triggered on main branch pushes
3. **Production builds**: Manual trigger for releases

Each workflow includes:
- Android APK/AAB builds
- iOS builds with TestFlight submission
- Simulator builds for testing

### 1.3 Environment Setup

Configure EAS secrets and environment variables:
- Authentication secrets (BETTER_AUTH_URL, BETTER_AUTH_SECRET)
- API endpoints (ONE_SERVER_URL)
- Hot updater configuration
- Third-party service keys

### 1.4 Initial Setup Script

Create `scripts/mobile/setup.ts` using takeout's script organization:
- Install dependencies (EAS CLI, CocoaPods)
- Initialize EAS project
- Configure secrets
- Run initial prebuild

## Phase 2: Android Build Support (Week 1-2)

### 2.1 Android Configuration

Update `app.config.ts` with Android-specific settings:
- Package naming based on environment
- Adaptive icons
- Permissions configuration
- Google Services integration
- New Architecture enabled

### 2.2 Keystore Management

Setup Android signing:
- Generate release keystore
- Store in GitHub Secrets (base64 encoded)
- Configure gradle properties
- Setup Google Play App Signing

### 2.3 Build Scripts

Create Android-specific scripts in `scripts/mobile/`:
- `build-android.ts`: Local and EAS builds
- `test-android.ts`: Run Android E2E tests
- `deploy-android.ts`: Deploy to Play Store

## Phase 3: iOS Optimization (Week 2)

### 3.1 Advanced Caching Strategy

Implement hash-based build caching from chat repo:
- Pre-build hash calculation
- Build artifact caching
- Derived data persistence
- CocoaPods caching

### 3.2 Fastlane Match Simplification

Remove Fastfile dependency, use direct CLI:
- Inline match commands in workflows
- Simplified certificate management
- Automated provisioning profile updates

### 3.3 Build Optimization

Performance improvements:
- Parallel pod installation
- Incremental builds with derived data
- Smart skip logic for unchanged code
- Separate JS bundle builds from native

## Phase 4: Mobile E2E Testing with Appium (Week 3)

### 4.1 Test Infrastructure Setup

Create comprehensive testing framework:

**Directory structure**:
```
testing-utils/mobile/
├── webdriver-config.ts    # Device and app discovery
├── setup.ts               # Global test setup
├── helpers.ts             # Test utility functions
└── page-objects/          # Page object patterns
```

### 4.2 WebDriver Configuration

Smart configuration with caching:
- Automatic simulator/emulator discovery
- App path resolution
- Build-on-demand if missing
- Configuration caching for speed

### 4.3 Test Helpers Library

Reusable test utilities:
- Login/logout helpers
- Navigation helpers
- Element interaction wrappers
- Platform-specific handlers
- Scroll and gesture helpers

### 4.4 E2E Test Suites

Comprehensive test coverage:
```
src/test/e2e/
├── auth.e2e.test.ts       # Authentication flows
├── navigation.e2e.test.ts # App navigation
├── core.e2e.test.ts       # Core functionality
└── offline.e2e.test.ts    # Offline sync testing
```

### 4.5 Test Execution Strategy

- **Local development**: Quick smoke tests
- **CI pipeline**: Full regression suite
- **Platform matrix**: iOS + Android parallel testing
- **Device coverage**: Multiple OS versions

## Phase 5: Scripts Organization (Week 3)

### 5.1 Mobile Scripts Structure

Following takeout's custom script organization:

```
scripts/mobile/
├── setup.ts              # Environment setup
├── build-ios.ts          # iOS builds
├── build-android.ts      # Android builds
├── test-ios.ts           # iOS testing
├── test-android.ts       # Android testing
├── deploy-hot-update.ts  # OTA deployments
├── submit-stores.ts      # Store submissions
└── check-health.ts       # Health checks
```

### 5.2 Script Integration

Integration with takeout CLI (`bun tko`):
- `bun tko mobile/setup`: Initial setup
- `bun tko mobile/build-ios`: Build iOS
- `bun tko mobile/test-android`: Test Android
- `bun tko mobile/deploy-hot-update`: Deploy OTA

## Phase 6: CI/CD Integration (Week 4)

### 6.1 Smart CI Triggers

Path-based triggering to optimize builds:
- Native changes trigger mobile builds
- Web changes skip mobile pipeline
- Conditional deployment based on commit messages

### 6.2 Build Matrix

Parallel build execution:
```yaml
matrix:
  platform: [ios, android]
  profile: [development, preview, production]
  include:
    - platform: ios
      runner: self-hosted-mac
    - platform: android
      runner: ubuntu-latest
```

### 6.3 Test Pipeline

Automated testing stages:
1. Unit tests (fastest)
2. Web integration tests
3. Mobile E2E smoke tests
4. Full mobile regression (on release)

## Phase 7: Hot Updates & Distribution (Week 4-5)

### 7.1 Hot Update Strategy

Multi-channel OTA updates:
- Development: Immediate updates
- Preview: Staged rollout
- Production: Gradual rollout with monitoring

### 7.2 Distribution Channels

**iOS**:
- TestFlight for all environments
- App Store for production

**Android**:
- Internal testing track for development
- Closed testing for preview
- Production track for release

### 7.3 Update Monitoring

- Crash reporting with Sentry
- Update success metrics
- Rollback capabilities
- Version adoption tracking

## Phase 8: Documentation & Training (Week 5)

### 8.1 Documentation Structure

```
docs/
├── mobile-setup.md         # Getting started guide
├── build-system.md         # Build configuration
├── testing-guide.md        # E2E testing guide
├── deployment.md           # Release process
└── troubleshooting.md      # Common issues
```

### 8.2 Team Training

- Build system overview
- Testing best practices
- Release procedures
- Emergency rollback process

## Implementation Timeline

### Week 1: Foundation
- [ ] Create eas.json configuration
- [ ] Setup EAS workflows
- [ ] Configure environment variables
- [ ] Initial Android configuration

### Week 2: Build Infrastructure
- [ ] Implement iOS caching strategy
- [ ] Setup Android keystore
- [ ] Configure Fastlane match
- [ ] Create build scripts

### Week 3: Testing Framework
- [ ] Setup Appium infrastructure
- [ ] Create test helpers
- [ ] Write initial E2E tests
- [ ] Configure test pipeline

### Week 4: CI/CD Integration
- [ ] Setup smart triggers
- [ ] Configure build matrix
- [ ] Integrate hot updates
- [ ] Setup distribution

### Week 5: Polish & Documentation
- [ ] Complete documentation
- [ ] Team training
- [ ] Performance optimization
- [ ] Production readiness review

## Key Decisions

### Build Infrastructure
**Decision**: Use EAS for both platforms, keep self-hosted iOS as backup
**Rationale**: EAS provides consistency and simplicity, self-hosted offers control

### Testing Strategy
**Decision**: Appium for comprehensive E2E testing
**Rationale**: Industry standard with best device support and community

### Code Signing
**Decision**: Fastlane match without Fastfile
**Rationale**: Simpler maintenance while maintaining security

### Hot Updates
**Decision**: Separate channels per environment
**Rationale**: Safe gradual rollouts with easy rollback

## Success Metrics

- **Build Success Rate**: >95%
- **Build Time**: iOS <30min, Android <20min
- **Test Coverage**: >80% critical paths
- **Deployment Time**: <2 hours to TestFlight
- **Hot Update Adoption**: >90% within 24 hours

## Risk Mitigation

### Technical Risks
- **Build failures**: Maintain self-hosted backup
- **Test flakiness**: Implement retry logic
- **Signing issues**: Document recovery procedures

### Process Risks
- **Deployment errors**: Automated rollback capability
- **Update breaking changes**: Gradual rollout strategy
- **Team adoption**: Comprehensive documentation

## Required Resources

### GitHub Secrets
```
APPLE_CODE_SIGNING_GIT_URL
APPLE_CODE_SIGNING_GIT_SSH_KEY
APPLE_CODE_SIGNING_GIT_PASSPHRASE
APP_STORE_CONNECT_API_KEY_*
ANDROID_KEYSTORE
ANDROID_KEYSTORE_PASSWORD
EXPO_TOKEN
```

### External Services
- EAS subscription (for build minutes)
- Apple Developer account ($99/year)
- Google Play Developer account ($25 one-time)
- TestFlight access
- Self-hosted macOS runner

## Cost Analysis

### Monthly Costs
- **EAS Build Minutes**: ~$100-200/month
- **Self-hosted Runner**: ~$50/month (if cloud)
- **Total**: ~$150-250/month

### ROI Justification
- Reduced manual build time: 10 hours/week saved
- Faster bug detection: 50% reduction in production issues
- Improved deployment speed: 4x faster releases

## Next Steps

1. **Review and approve** this plan with team
2. **Set up accounts**: EAS, App Store Connect, Play Console
3. **Begin Phase 1**: EAS configuration
4. **Schedule training**: Team onboarding sessions
5. **Monitor progress**: Weekly check-ins during implementation

## Appendix: Repository Patterns

### From fleek
- EAS multi-environment configuration
- Automated TestFlight submission
- Hot updater integration

### From chat
- Hash-based caching strategy
- Simplified Fastlane usage
- Conditional deployment triggers

### From tamagui
- Appium test infrastructure
- WebdriverIO configuration
- Smart device management

---

**Document Version**: 1.0
**Created**: 2024-11-07
**Status**: Ready for Review
**Author**: AI-assisted planning based on repository analysis