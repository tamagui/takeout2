// peach-swipeable — iOS-native full-swipe-to-delete on top of the RNGH Swipeable API.
// same props as react-native-gesture-handler's Swipeable, no custom API needed from
// the consumer. adds:
//   - commit zone (Delete fills row, other actions shrink to 0)
//   - auto-fires rightmost action's onPress on full swipe (iOS performsFirstActionWithFullSwipe)
//   - height collapse after commit
//
// uses PanResponder (standard RN API) for gesture handling — works on web via
// react-native-web and in rnx via the responder system.

import * as React from 'react'
import { Component } from 'react'
import { Animated, PanResponder, View } from 'react-native'
import type {
  GestureResponderEvent,
  LayoutChangeEvent,
  PanResponderGestureState,
  PanResponderInstance,
  StyleProp,
  ViewStyle,
} from 'react-native'

// react-native's Animated.Value keeps the latest scalar on a private `_value`
// field. there's no public sync getter (everything is push-based via
// addListener), so reading the field directly is the cheapest way to grab
// the current offset at gesture-start time. typed here once instead of
// casting at every call site. uses InstanceType so this resolves equally
// against real RN's `namespace Animated { class Value }` and sootsim-engine's
// `const Animated = { Value }` re-export.
type AnimatedValueWithCurrent = InstanceType<typeof Animated.Value> & {
  _value?: number
}

// shape of the action elements consumers pass to `renderRightActions`.
// the swipeable reads two optional bits off each action: an `onPress`
// (fired on full-swipe commit) and a base `width` (used for proportional
// sizing). everything else is opaque from this component's perspective,
// so we keep the prop type narrow on purpose.
type SwipeActionProps = {
  onPress?: () => void
  width?: number
  style?: StyleProp<ViewStyle>
  children?: React.ReactNode
}
type SwipeActionElement = React.ReactElement<SwipeActionProps>

// `userSelect` is a web-only style, not part of RN's ViewStyle. extend
// once at the type boundary so the row-container style stays typed.
type ViewStyleWithUserSelect = ViewStyle & {
  userSelect?: 'none' | 'auto' | 'text'
}

const COMMIT_START_RATIO = 0.72
const COMMIT_END_RATIO = 0.88
const DRAG_THRESHOLD = 8

export interface SwipeableProps {
  friction?: number
  leftThreshold?: number
  rightThreshold?: number
  overshootLeft?: boolean
  overshootRight?: boolean
  overshootFriction?: number
  onSwipeableLeftOpen?: () => void
  onSwipeableRightOpen?: () => void
  onSwipeableOpen?: (direction: 'left' | 'right', swipeable: RnxSwipeable) => void
  onSwipeableClose?: (direction: 'left' | 'right', swipeable: RnxSwipeable) => void
  onSwipeableWillOpen?: (direction: 'left' | 'right') => void
  onSwipeableWillClose?: (direction: 'left' | 'right') => void
  onSwipeableOpenStartDrag?: (direction: 'left' | 'right') => void
  onSwipeableCloseStartDrag?: (direction: 'left' | 'right') => void
  renderLeftActions?: (
    progress: any,
    dragX: any,
    swipeable: RnxSwipeable,
  ) => React.ReactNode
  renderRightActions?: (
    progress: any,
    dragX: any,
    swipeable: RnxSwipeable,
  ) => React.ReactNode
  useNativeAnimations?: boolean
  animationOptions?: Record<string, unknown>
  containerStyle?: StyleProp<ViewStyle>
  childrenContainerStyle?: StyleProp<ViewStyle>
  children?: React.ReactNode
  [key: string]: any
}

type SwipeableState = {
  rowState: number
  rowWidth: number
  rowHeight: number
  rightActionWidth: number
  revealWidth: number
  collapsing: boolean
  showActions: boolean
}

export class RnxSwipeable extends Component<SwipeableProps, SwipeableState> {
  static defaultProps = {
    friction: 1,
    useNativeAnimations: true,
  }

  // drives content translateX (negative = swiped left)
  private translateX = new Animated.Value(0)
  // drives action container width (= abs of translateX)
  private actionsWidth = new Animated.Value(0)
  private rightProgress = new Animated.Value(0)
  private rowHeightAnim = new Animated.Value(0)
  private rowOpacityAnim = new Animated.Value(1)
  private activeSpring: { stop: () => void } | null = null
  private dragActive = false
  private lastDragVx = 0
  private lastDragDx = 0
  private settleTimer: ReturnType<typeof setTimeout> | null = null
  private panResponder: PanResponderInstance

  constructor(props: SwipeableProps) {
    super(props)
    this.state = {
      rowState: 0,
      rowWidth: 0,
      rowHeight: 0,
      rightActionWidth: 144,
      revealWidth: 0,
      collapsing: false,
      showActions: false,
    }

    this.panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (
        _e: GestureResponderEvent,
        gs: PanResponderGestureState,
      ) => {
        // claim responder when horizontal drag exceeds threshold
        return Math.abs(gs.dx) > DRAG_THRESHOLD && Math.abs(gs.dx) > Math.abs(gs.dy)
      },
      onPanResponderGrant: () => {
        this.onPanStart()
      },
      onPanResponderMove: (_e: GestureResponderEvent, gs: PanResponderGestureState) => {
        this.onPanMove({ dx: gs.dx, dy: gs.dy, vx: gs.vx, vy: gs.vy })
      },
      onPanResponderRelease: () => {
        this.onPanEnd()
      },
      onPanResponderTerminate: () => {
        this.onPanEnd()
      },
      onPanResponderTerminationRequest: () => false,
    })
  }

  private get rightWidth() {
    // compute from action children base widths (not layout which changes with reveal)
    const actions = this.props.renderRightActions
    if (!actions) return 0
    const children = this.getActionChildren(
      actions(this.rightProgress, this.translateX, this),
    )
    const total = children.reduce((sum, child) => sum + this.getActionWidth(child), 0)
    return total || this.state.rightActionWidth || 144
  }
  private get commitStart() {
    return Math.max(this.rightWidth, this.state.rowWidth * COMMIT_START_RATIO)
  }
  private get maxReveal() {
    return Math.max(this.rightWidth, this.state.rowWidth || this.rightWidth)
  }

  private currentOffset() {
    if (this.state.rowState === -1) return -this.rightWidth
    return 0
  }

  private clearSettleTimer() {
    if (this.settleTimer) {
      clearTimeout(this.settleTimer)
      this.settleTimer = null
    }
  }

  private setReveal(value: number) {
    const reveal = Math.abs(value)
    this.translateX.setValue(value)
    this.actionsWidth.setValue(reveal)
    this.rightProgress.setValue(
      this.rightWidth > 0 ? Math.min(1, reveal / this.rightWidth) : 0,
    )
    if (this.state.revealWidth !== reveal) this.setState({ revealWidth: reveal })
    this.updateActionVisibility(value, this.state.rowState)
  }

  private updateActionVisibility(translateX: number, rowState: number) {
    const showActions = translateX < 0 || rowState !== 0 || this.dragActive
    if (this.state.showActions !== showActions) this.setState({ showActions })
  }

  // --- pan handlers ---

  private dragStartOffset = 0

  private onPanStart = () => {
    if (this.activeSpring) {
      this.activeSpring.stop()
      this.activeSpring = null
    }
    this.clearSettleTimer()
    // capture actual position at grab time (not state-based offset)
    // this prevents jumps when grabbing mid-animation
    this.dragStartOffset =
      (this.translateX as AnimatedValueWithCurrent)._value ?? this.currentOffset()
    this.dragActive = true
    this.lastDragVx = 0
    this.lastDragDx = 0
    this.updateActionVisibility(
      this.state.revealWidth > 0 ? -this.state.revealWidth : 0,
      this.state.rowState,
    )
  }

  private onPanMove = (state: { dx: number; dy: number; vx: number; vy: number }) => {
    if (!this.dragActive) return
    const { dx, vx } = state
    const friction = this.props.friction ?? 1
    this.lastDragVx = vx
    this.lastDragDx = dx

    const rawX = this.dragStartOffset + dx / friction
    let clamped = Math.min(0, rawX)
    if (clamped < -this.maxReveal) {
      const overshoot = -this.maxReveal - clamped
      const overshootFriction = this.props.overshootFriction ?? 8
      clamped = -this.maxReveal - overshoot / overshootFriction
    }
    this.setReveal(clamped)
  }

  private onPanEnd = () => {
    if (!this.dragActive) return
    this.dragActive = false

    const rightWidth = this.rightWidth
    const friction = this.props.friction ?? 1
    const threshold = this.props.rightThreshold ?? rightWidth / 2
    const dx = this.lastDragDx
    const vx = this.lastDragVx

    const startX = this.dragStartOffset + dx / friction
    const reveal = Math.max(0, -startX)
    // velocity-projected final position (for reveal vs close decision)
    // vx is negative when swiping left (opening), positive when swiping right (closing)
    const projectedReveal = reveal + -vx * 0.15

    // 1. DELETE: if Delete is visually filling the row — pure position, no velocity
    const deleteVisible =
      reveal >= this.commitStart || this.state.revealWidth >= this.commitStart

    let toValue = 0
    if (deleteVisible) {
      // Delete is showing fully — auto-delete
      toValue = -this.maxReveal
    } else if (this.state.rowState === 0) {
      // from closed: velocity-projected position decides reveal vs close
      if (projectedReveal >= threshold) {
        toValue = -rightWidth // snap to reveal
      }
      // else: snap closed
    } else {
      // from open: velocity-projected position decides stay vs close
      if (projectedReveal >= rightWidth * 0.3) {
        toValue = -rightWidth // stay at reveal
      }
      // else: snap closed
    }

    this.animateRow(
      Math.min(0, startX),
      toValue,
      vx / friction,
      deleteVisible && toValue < 0,
    )
  }

  private animateRow(
    fromValue: number,
    toValue: number,
    velocityX?: number,
    committed = false,
  ) {
    this.setReveal(fromValue)
    this.setState({ rowState: Math.sign(toValue) })
    this.updateActionVisibility(fromValue, Math.sign(toValue))

    if (this.activeSpring) {
      this.activeSpring.stop()
      this.activeSpring = null
    }
    this.clearSettleTimer()

    const anim = Animated.spring(this.translateX, {
      // snappy overdamped spring tuned for Euler integration stability
      // (upstream reanimated uses mass:2/damping:1000/stiffness:700 in its own runtime)
      stiffness: 500,
      damping: 46,
      mass: 1,
      restSpeedThreshold: 1.7,
      restDisplacementThreshold: 0.4,
      velocity: velocityX,
      overshootClamping: true,
      toValue,
      useNativeDriver: false,
      ...this.props.animationOptions,
    })
    this.activeSpring = anim

    const lid = this.translateX.addListener(({ value }: any) => {
      const reveal = Math.abs(value)
      this.actionsWidth.setValue(reveal)
      this.rightProgress.setValue(
        this.rightWidth > 0 ? Math.min(1, reveal / this.rightWidth) : 0,
      )
      if (this.state.revealWidth !== reveal) this.setState({ revealWidth: reveal })
      this.updateActionVisibility(value, this.state.rowState)
    })

    anim.start(({ finished }: { finished: boolean }) => {
      this.translateX.removeListener(lid)
      if (this.activeSpring === anim) this.activeSpring = null
      if (!finished) this.clearSettleTimer()
    })

    if (toValue < 0 && committed) {
      this.settleTimer = setTimeout(() => {
        this.settleTimer = null
        this.beginCollapse()
      }, 160)
    } else if (toValue < 0) {
      this.settleTimer = setTimeout(() => {
        this.settleTimer = null
        this.props.onSwipeableRightOpen?.()
        this.props.onSwipeableOpen?.('right', this)
      }, 260)
    } else if (toValue === 0) {
      this.settleTimer = setTimeout(() => {
        this.settleTimer = null
        this.props.onSwipeableClose?.(fromValue > 0 ? 'left' : 'right', this)
      }, 220)
    }

    if (toValue < 0) {
      this.props.onSwipeableWillOpen?.('right')
    } else {
      this.props.onSwipeableWillClose?.(fromValue > 0 ? 'left' : 'right')
    }
  }

  // --- iOS full-swipe: fire rightmost action's onPress, then collapse ---

  private getRightmostActionPress(): (() => void) | null {
    const { renderRightActions } = this.props
    if (!renderRightActions) return null
    const children = this.getActionChildren(
      renderRightActions(this.rightProgress, this.translateX, this),
    )
    if (children.length === 0) return null
    const last = children[children.length - 1]
    const onPress = last.props.onPress
    return typeof onPress === 'function' ? onPress : null
  }

  private beginCollapse() {
    if (this.state.collapsing) return
    this.setState({ collapsing: true })

    // fire the rightmost action's onPress — matches iOS performsFirstActionWithFullSwipe
    const actionPress = this.getRightmostActionPress()
    actionPress?.()

    // animate height via setState frames (animated values don't trigger yoga relayout)
    const startHeight = this.state.rowHeight
    const duration = 220
    const startTime = performance.now()

    const tick = () => {
      const elapsed = performance.now() - startTime
      const t = Math.min(1, elapsed / duration)
      const height = startHeight * (1 - t)
      this.setState({ rowHeight: Math.max(0, height) })

      if (t < 1) {
        requestAnimationFrame(tick)
      } else {
        this.props.onSwipeableRightOpen?.()
        this.props.onSwipeableOpen?.('right', this)
      }
    }
    requestAnimationFrame(tick)
  }

  close = () => {
    this.animateRow(this.currentOffset(), 0)
  }
  openRight = () => {
    this.animateRow(this.currentOffset(), -this.rightWidth)
  }
  openLeft = () => {}
  reset = () => {
    if (this.activeSpring) {
      this.activeSpring.stop()
      this.activeSpring = null
    }
    this.clearSettleTimer()
    this.translateX.setValue(0)
    this.actionsWidth.setValue(0)
    this.rightProgress.setValue(0)
    this.rowOpacityAnim.setValue(1)
    this.rowHeightAnim.setValue(this.state.rowHeight)
    this.setState({ rowState: 0, revealWidth: 0, collapsing: false, showActions: false })
  }

  private onRowLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    const { width, height } = nativeEvent.layout
    this.setState({ rowWidth: width, rowHeight: height })
    if (!this.state.collapsing && height > 0) {
      this.rowHeightAnim.setValue(height)
    }
  }

  private onActionsLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    // only update if larger than current (the container shrinks during proportional sizing)
    // we want the NATURAL width (sum of all button base widths)
    if (nativeEvent.layout.width > this.state.rightActionWidth) {
      this.setState({ rightActionWidth: nativeEvent.layout.width })
    }
  }

  private getActionChildren(node: React.ReactNode): SwipeActionElement[] {
    // handle arrays directly (renderRightActions can return an array)
    if (Array.isArray(node)) {
      const out: SwipeActionElement[] = []
      for (const child of node) {
        if (React.isValidElement(child)) out.push(child as SwipeActionElement)
        else if (Array.isArray(child)) out.push(...this.getActionChildren(child))
      }
      return out
    }
    const out: SwipeActionElement[] = []
    React.Children.forEach(node, (child) => {
      if (!React.isValidElement(child)) return
      if (child.type === React.Fragment) {
        const fragmentProps = child.props as { children?: React.ReactNode }
        out.push(...this.getActionChildren(fragmentProps.children))
        return
      }
      out.push(child as SwipeActionElement)
    })
    return out
  }

  private getActionWidth(child: SwipeActionElement) {
    const { width, style } = child.props
    if (typeof width === 'number') return width
    const styles = Array.isArray(style) ? style : [style]
    for (const entry of styles) {
      if (
        entry &&
        typeof entry === 'object' &&
        'width' in entry &&
        typeof (entry as { width?: unknown }).width === 'number'
      ) {
        return (entry as { width: number }).width
      }
    }
    return 72
  }

  private cloneAction(child: SwipeActionElement, width: number) {
    const { style } = child.props
    const styles = Array.isArray(style) ? style : [style]
    return React.cloneElement(child, {
      style: [...styles, { width, height: '100%' }],
    })
  }

  render() {
    const { children, renderRightActions } = this.props
    const actionChildren = renderRightActions
      ? this.getActionChildren(
          renderRightActions(this.rightProgress, this.translateX, this),
        )
      : []
    const baseWidths = actionChildren.map((child) => this.getActionWidth(child))
    const naturalWidth =
      baseWidths.reduce((sum, width) => sum + width, 0) ||
      this.state.rightActionWidth ||
      144
    const commitStart = Math.max(naturalWidth, this.state.rowWidth * COMMIT_START_RATIO)
    const commitEnd = Math.max(commitStart + 1, this.state.rowWidth * COMMIT_END_RATIO)
    const revealWidth = this.state.revealWidth

    const rowWidth = this.state.rowWidth || this.maxReveal
    const inCommitZone = revealWidth >= commitStart

    const renderedActions = actionChildren.map((child, index) => {
      if (inCommitZone) {
        // commit zone: last action fills row, others shrink to 0
        const baseWidth = baseWidths[index] ?? 72
        const ratio =
          naturalWidth > 0 ? baseWidth / naturalWidth : 1 / actionChildren.length
        const preCommitWidth = commitStart * ratio
        const t = Math.min(
          1,
          Math.max(0, (revealWidth - commitStart) / Math.max(1, commitEnd - commitStart)),
        )
        const width =
          index === actionChildren.length - 1
            ? preCommitWidth + t * (rowWidth - preCommitWidth)
            : preCommitWidth * (1 - t)
        return (
          <View
            key={child.key ?? `swipe-action-${index}`}
            style={{ width: Math.max(0, width), height: '100%', overflow: 'hidden' }}
          >
            {this.cloneAction(child, Math.max(baseWidths[index] ?? 72, width))}
          </View>
        )
      }
      // normal: flex-based proportional sizing — grows smoothly with animated container
      return (
        <View
          key={child.key ?? `swipe-action-${index}`}
          style={{ flex: baseWidths[index] ?? 72, height: '100%', overflow: 'hidden' }}
        >
          {React.cloneElement(child, {
            style: [
              ...(Array.isArray(child.props.style)
                ? child.props.style
                : [child.props.style]),
              { width: '100%', height: '100%' },
            ],
          })}
        </View>
      )
    })

    const rightActions = renderRightActions && this.state.showActions && (
      <Animated.View
        onLayout={this.onActionsLayout}
        pointerEvents={this.state.rowState === 0 && !this.dragActive ? 'none' : 'auto'}
        style={{
          position: 'absolute' as const,
          top: 0,
          bottom: 0,
          right: 0,
          width: inCommitZone ? revealWidth : this.actionsWidth,
          flexDirection: 'row' as const,
          zIndex: 1,
        }}
      >
        {renderedActions}
      </Animated.View>
    )

    return (
      <Animated.View
        onLayout={this.onRowLayout}
        {...this.panResponder.panHandlers}
        style={[
          // userSelect is web-only (RN web honours it to suppress drag text
          // selection); RN's typed ViewStyle doesn't include it, so cast
          // through unknown rather than reach for `as any`.
          {
            overflow: 'hidden' as const,
            height: this.state.collapsing ? this.state.rowHeight : undefined,
            opacity: this.rowOpacityAnim,
            userSelect: 'none',
          } as unknown as ViewStyleWithUserSelect,
          this.props.containerStyle,
        ]}
      >
        {rightActions}
        <Animated.View
          style={[
            { transform: [{ translateX: this.translateX }] },
            this.props.childrenContainerStyle,
          ]}
        >
          {children}
        </Animated.View>
      </Animated.View>
    )
  }
}

export { RnxSwipeable as SootSimSwipeable }

export default RnxSwipeable
