// src/components/ErrorBoundary.jsx
import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null, info: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
    this.setState({ info })
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-parchment flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-red-200 rounded-2xl p-6 shadow-modal">
            <h1 className="font-display text-2xl text-red-600 mb-2">Something went wrong</h1>
            <p className="text-sm text-stone mb-4">
              The app encountered an error. This is usually caused by:
            </p>
            <ul className="text-sm text-stone space-y-1 mb-4 list-disc pl-4">
              <li>Running from an old project folder — make sure you're in the new unzipped folder</li>
              <li>Missing <code className="bg-mist px-1 rounded">node_modules</code> — run <code className="bg-mist px-1 rounded">npm install</code></li>
              <li>Server not running — run <code className="bg-mist px-1 rounded">npm run dev</code></li>
            </ul>
            <pre className="text-xs text-red-500 bg-red-50 rounded-lg p-3 overflow-auto mb-4 max-h-32">
              {this.state.error?.message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-bamboo text-white rounded-lg py-2.5 text-sm font-medium hover:bg-bamboo-dark transition-colors"
            >
              Reload App
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
