import { Component } from 'react'
import { H2, View } from 'tamagui'
import { ButtonSimple } from '../buttons/ButtonSimple'
import { showNotification } from '../notification/Notification'

type ErrorBoundaryProps = {
  children: any
  title?: string
  noMessage?: boolean
  attemptRecover?: () => void
}

export class ErrorBoundary extends Component<ErrorBoundaryProps> {
  state = { hasError: false, noMessage: false }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    showNotification(this.props.title || 'Error', {
      display: 'error',
      // action: this.props.attemptRecover ?
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.noMessage) {
        return null
      }
      return (
        <View bg="$red3" p="$3" rounded="$3">
          <H2 size="$3">{this.props.title || 'Error'}</H2>
          <ButtonSimple onPress={() => this.setState({ hasError: false })}>
            Try again?
          </ButtonSimple>
        </View>
      )
    }
    return this.props.children
  }
}
