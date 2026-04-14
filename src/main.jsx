// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { LibraryProvider } from './context/LibraryContext'
import { AuthProvider } from './context/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <ErrorBoundary>
          <LibraryProvider>
            <App />
          </LibraryProvider>
        </ErrorBoundary>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
