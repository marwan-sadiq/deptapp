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
    // Force update without asking user
    console.log('New version available, forcing update...')
    window.location.reload()
  },
  onOfflineReady() {
    console.log('App is ready to work offline!')
  },
  // Force immediate update
  immediate: true
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
