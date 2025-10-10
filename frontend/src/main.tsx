import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// PWA registration
import { registerSW } from 'virtual:pwa-register'

const queryClient = new QueryClient()

// Register service worker for PWA
registerSW({
  onNeedRefresh() {
    // Show a notification to user that new version is available
    if (confirm('New version available! Click OK to update.')) {
      window.location.reload()
    }
  },
  onOfflineReady() {
    console.log('App is ready to work offline!')
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
