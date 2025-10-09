import React, { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  retryCount: number
}

class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log to external service in production
    if (import.meta.env.PROD) {
      // Here you would typically send the error to a service like Sentry
      console.error('Production error:', error.message, errorInfo.componentStack)
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }))
    } else {
      // Reset retry count and show error
      this.setState({
        retryCount: 0,
        hasError: true
      })
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return <ErrorFallback 
        error={this.state.error} 
        retryCount={this.state.retryCount}
        maxRetries={this.maxRetries}
        onRetry={this.handleRetry}
        onReset={this.handleReset}
      />
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error: Error | null
  retryCount: number
  maxRetries: number
  onRetry: () => void
  onReset: () => void
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  retryCount, 
  maxRetries, 
  onRetry, 
  onReset 
}) => {
  const canRetry = retryCount < maxRetries

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-md w-full rounded-2xl shadow-2xl p-8 text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white">
          Something went wrong
        </h1>
        
        <p className="text-sm mb-6 text-slate-600 dark:text-slate-300">
          An unexpected error occurred. Please try again.
        </p>

        {import.meta.env.DEV && error && (
          <details className="mb-6 p-4 rounded-lg text-left bg-slate-100 dark:bg-slate-700">
            <summary className="cursor-pointer font-medium text-slate-700 dark:text-slate-300">
              Error Details
            </summary>
            <pre className="mt-2 text-xs overflow-auto text-slate-600 dark:text-slate-400">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}

        <div className="space-y-3">
          {canRetry && (
            <button
              onClick={onRetry}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry ({retryCount + 1}/{maxRetries})
            </button>
          )}
          
          <button
            onClick={onReset}
            className="w-full px-6 py-3 bg-slate-600 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go Home
          </button>
        </div>

        <p className="text-xs mt-6 text-slate-500 dark:text-slate-400">
          If the problem persists, please contact technical support.
        </p>
      </div>
    </div>
  )
}

export default ErrorBoundary
