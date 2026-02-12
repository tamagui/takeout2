import { Composition } from 'remotion'
import { z } from 'zod'

import { FeatureFlash, FEATURE_FLASH_DURATION } from './FeatureFlash'
import { LaunchIntro, TOTAL_DURATION } from './LaunchIntro'
import { RapidIntro, RAPID_INTRO_TOTAL_DURATION } from './RapidIntro'
import {
  FakeDesktopScene,
  FAKE_DESKTOP_DURATION,
} from './scenes/FakeDesktopScene'
import {
  RoutingWindowScene,
  ROUTING_WINDOW_DURATION,
} from './scenes/RoutingWindowScene'
import {
  StackHeaderWindowScene,
  STACK_HEADER_WINDOW_DURATION,
} from './scenes/StackHeaderWindowScene'
import {
  OnePromoCombined,
  ONE_PROMO_COMBINED_DURATION,
} from './scenes/OnePromoCombined'
import {
  IntroLandingScene,
  INTRO_LANDING_DURATION,
} from './scenes/IntroLandingScene'
import {
  OnePromoFull,
  ONE_PROMO_FULL_DURATION,
} from './OnePromoFull'
import {
  PrefetchWindowScene,
  PREFETCH_WINDOW_DURATION,
} from './scenes/PrefetchWindowScene'
import {
  DeployWindowScene,
  DEPLOY_WINDOW_DURATION,
} from './scenes/DeployWindowScene'
import {
  ProtectedRoutesWindowScene,
  PROTECTED_ROUTES_WINDOW_DURATION,
} from './scenes/ProtectedRoutesWindowScene'
import {
  UseBlockerWindowScene,
  USE_BLOCKER_WINDOW_DURATION,
} from './scenes/UseBlockerWindowScene'
import {
  DevToolsWindowScene,
  DEVTOOLS_WINDOW_DURATION,
} from './scenes/DevToolsWindowScene'
import {
  SearchParamsWindowScene,
  SEARCH_PARAMS_WINDOW_DURATION,
} from './scenes/SearchParamsWindowScene'
import {
  UseMatchesWindowScene,
  USE_MATCHES_WINDOW_DURATION,
} from './scenes/UseMatchesWindowScene'
import {
  UseLoaderStateWindowScene,
  USE_LOADER_STATE_WINDOW_DURATION,
} from './scenes/UseLoaderStateWindowScene'
import {
  ServerDataWindowScene,
  SERVER_DATA_WINDOW_DURATION,
} from './scenes/ServerDataWindowScene'
import {
  MetroModeWindowScene,
  METRO_MODE_WINDOW_DURATION,
} from './scenes/MetroModeWindowScene'
import {
  RouteValidationWindowScene,
  ROUTE_VALIDATION_WINDOW_DURATION,
} from './scenes/RouteValidationWindowScene'
import {
  ScriptLoadingWindowScene,
  SCRIPT_LOADING_WINDOW_DURATION,
} from './scenes/ScriptLoadingWindowScene'
import {
  CSSCollectionWindowScene,
  CSS_COLLECTION_WINDOW_DURATION,
} from './scenes/CSSCollectionWindowScene'
import {
  ParallelBuildsWindowScene,
  PARALLEL_BUILDS_WINDOW_DURATION,
} from './scenes/ParallelBuildsWindowScene'
import {
  ScrollPositionGroupsWindowScene,
  SCROLL_POSITION_GROUPS_WINDOW_DURATION,
} from './scenes/ScrollPositionGroupsWindowScene'
import {
  SitemapWindowScene,
  SITEMAP_WINDOW_DURATION,
} from './scenes/SitemapWindowScene'
import {
  LCPOptimizationWindowScene,
  LCP_OPTIMIZATION_WINDOW_DURATION,
} from './scenes/LCPOptimizationWindowScene'
import {
  ResponseHeadersWindowScene,
  RESPONSE_HEADERS_WINDOW_DURATION,
} from './scenes/ResponseHeadersWindowScene'
import {
  LoaderHMRWindowScene,
  LOADER_HMR_WINDOW_DURATION,
} from './scenes/LoaderHMRWindowScene'
import {
  NativeWindReanimatedWindowScene,
  NATIVEWIND_REANIMATED_WINDOW_DURATION,
} from './scenes/NativeWindReanimatedWindowScene'
import {
  MiddlewareWindowScene,
  MIDDLEWARE_WINDOW_DURATION,
} from './scenes/MiddlewareWindowScene'
import {
  ImageDataWindowScene,
  IMAGE_DATA_WINDOW_DURATION,
} from './scenes/ImageDataWindowScene'

const LaunchIntroSchema = z.object({
  tagline: z.string(),
})

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="IntroLanding"
        component={IntroLandingScene}
        durationInFrames={INTRO_LANDING_DURATION}
        fps={60}
        width={1920}
        height={1080}
      />

      <Composition
        id="OnePromoDesktop"
        component={FakeDesktopScene}
        durationInFrames={FAKE_DESKTOP_DURATION}
        fps={60}
        width={1920}
        height={1080}
      />

      <Composition
        id="OnePromoRouting"
        component={RoutingWindowScene}
        durationInFrames={ROUTING_WINDOW_DURATION}
        fps={60}
        width={1920}
        height={1080}
      />

      <Composition
        id="OnePromoStackHeader"
        component={StackHeaderWindowScene}
        durationInFrames={STACK_HEADER_WINDOW_DURATION}
        fps={60}
        width={1920}
        height={1080}
      />

      <Composition
        id="OnePromoPrefetch"
        component={PrefetchWindowScene}
        durationInFrames={PREFETCH_WINDOW_DURATION}
        fps={60}
        width={1920}
        height={1080}
      />

      <Composition
        id="OnePromoDeploy"
        component={DeployWindowScene}
        durationInFrames={DEPLOY_WINDOW_DURATION}
        fps={60}
        width={1920}
        height={1080}
      />

      <Composition
        id="OnePromoProtectedRoutes"
        component={ProtectedRoutesWindowScene}
        durationInFrames={PROTECTED_ROUTES_WINDOW_DURATION}
        fps={60}
        width={1920}
        height={1080}
      />

      <Composition
        id="OnePromoUseBlocker"
        component={UseBlockerWindowScene}
        durationInFrames={USE_BLOCKER_WINDOW_DURATION}
        fps={60}
        width={1920}
        height={1080}
      />

      <Composition
        id="OnePromoDevTools"
        component={DevToolsWindowScene}
        durationInFrames={DEVTOOLS_WINDOW_DURATION}
        fps={60}
        width={1920}
        height={1080}
      />

      <Composition
        id="OnePromoSearchParams"
        component={SearchParamsWindowScene}
        durationInFrames={SEARCH_PARAMS_WINDOW_DURATION}
        fps={60}
        width={1920}
        height={1080}
      />

      <Composition
        id="OnePromoUseMatches"
        component={UseMatchesWindowScene}
        durationInFrames={USE_MATCHES_WINDOW_DURATION}
        fps={60}
        width={1920}
        height={1080}
      />

      <Composition
        id="OnePromoUseLoaderState"
        component={UseLoaderStateWindowScene}
        durationInFrames={USE_LOADER_STATE_WINDOW_DURATION}
        fps={60}
        width={1920}
        height={1080}
      />

      <Composition
        id="OnePromoServerData"
        component={ServerDataWindowScene}
        durationInFrames={SERVER_DATA_WINDOW_DURATION}
        fps={60}
        width={1920}
        height={1080}
      />

      <Composition
        id="OnePromoMetroMode"
        component={MetroModeWindowScene}
        durationInFrames={METRO_MODE_WINDOW_DURATION}
        fps={60}
        width={1920}
        height={1080}
      />

      <Composition
        id="OnePromoRouteValidation"
        component={RouteValidationWindowScene}
        durationInFrames={ROUTE_VALIDATION_WINDOW_DURATION}
        fps={60}
        width={1920}
        height={1080}
      />

      <Composition
        id="OnePromoScriptLoading"
        component={ScriptLoadingWindowScene}
        durationInFrames={SCRIPT_LOADING_WINDOW_DURATION}
        fps={60}
        width={1920}
        height={1080}
      />

      <Composition
        id="OnePromoCSSCollection"
        component={CSSCollectionWindowScene}
        durationInFrames={CSS_COLLECTION_WINDOW_DURATION}
        fps={60}
        width={1920}
        height={1080}
      />

      <Composition
        id="OnePromoParallelBuilds"
        component={ParallelBuildsWindowScene}
        durationInFrames={PARALLEL_BUILDS_WINDOW_DURATION}
        fps={60}
        width={1920}
        height={1080}
      />

      <Composition
        id="OnePromoScrollPositionGroups"
        component={ScrollPositionGroupsWindowScene}
        durationInFrames={SCROLL_POSITION_GROUPS_WINDOW_DURATION}
        fps={60}
        width={1920}
        height={1080}
      />

      <Composition
        id="OnePromoSitemap"
        component={SitemapWindowScene}
        durationInFrames={SITEMAP_WINDOW_DURATION}
        fps={60}
        width={1920}
        height={1080}
      />

      <Composition
        id="OnePromoLCPOptimization"
        component={LCPOptimizationWindowScene}
        durationInFrames={LCP_OPTIMIZATION_WINDOW_DURATION}
        fps={60}
        width={1920}
        height={1080}
      />

      <Composition
        id="OnePromoResponseHeaders"
        component={ResponseHeadersWindowScene}
        durationInFrames={RESPONSE_HEADERS_WINDOW_DURATION}
        fps={60}
        width={1920}
        height={1080}
      />

      <Composition
        id="OnePromoLoaderHMR"
        component={LoaderHMRWindowScene}
        durationInFrames={LOADER_HMR_WINDOW_DURATION}
        fps={60}
        width={1920}
        height={1080}
      />

      <Composition
        id="OnePromoNativeWindReanimated"
        component={NativeWindReanimatedWindowScene}
        durationInFrames={NATIVEWIND_REANIMATED_WINDOW_DURATION}
        fps={60}
        width={1920}
        height={1080}
      />

      <Composition
        id="OnePromoMiddleware"
        component={MiddlewareWindowScene}
        durationInFrames={MIDDLEWARE_WINDOW_DURATION}
        fps={60}
        width={1920}
        height={1080}
      />

      <Composition
        id="OnePromoImageData"
        component={ImageDataWindowScene}
        durationInFrames={IMAGE_DATA_WINDOW_DURATION}
        fps={60}
        width={1920}
        height={1080}
      />

      <Composition
        id="OnePromoCombined"
        component={OnePromoCombined}
        durationInFrames={ONE_PROMO_COMBINED_DURATION}
        fps={60}
        width={1920}
        height={1080}
      />

      <Composition
        id="OnePromoFull"
        component={OnePromoFull}
        durationInFrames={ONE_PROMO_FULL_DURATION}
        fps={60}
        width={1920}
        height={1080}
      />

      <Composition
        id="FeatureFlash"
        component={FeatureFlash}
        durationInFrames={FEATURE_FLASH_DURATION}
        fps={60}
        width={1920}
        height={1080}
      />

      <Composition
        id="LaunchIntro"
        component={LaunchIntro}
        durationInFrames={TOTAL_DURATION}
        fps={60}
        width={1920}
        height={1080}
        schema={LaunchIntroSchema}
        defaultProps={{
          tagline: 'ship faster. ship everywhere.',
        }}
      />

      <Composition
        id="RapidIntro"
        component={RapidIntro}
        durationInFrames={RAPID_INTRO_TOTAL_DURATION}
        fps={60}
        width={1920}
        height={1080}
      />
    </>
  )
}
