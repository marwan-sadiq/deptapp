import React, { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('PWA: beforeinstallprompt event fired!')
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('PWA: App is already installed')
      return
    }

    // Check if dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      console.log('PWA: Install prompt was dismissed, not showing')
      setIsDismissed(true)
      return
    }

    console.log('PWA: Adding beforeinstallprompt listener')
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Add global function to reset dismissal for testing
    ;(window as any).resetPWAInstallPrompt = () => {
      localStorage.removeItem('pwa-install-dismissed')
      setIsDismissed(false)
      console.log('PWA: Install prompt dismissal reset. The prompt should appear now.')
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }
    
    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    setIsDismissed(true)
    // Persist dismissal across refreshes
    localStorage.setItem('pwa-install-dismissed', 'true')
  }


  // For testing purposes, show a manual install button if no prompt is available
  const showManualInstall = !showInstallPrompt && !deferredPrompt && 
    !window.matchMedia('(display-mode: standalone)').matches && !isDismissed

  if (isDismissed || (!showInstallPrompt && !showManualInstall)) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up">
      <div className={`max-w-sm mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4`}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className={`text-sm font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              Install Shop App
            </h3>
            <p className={`text-xs mt-1 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Install this app on your device for a better experience
            </p>
            
            <div className="flex gap-2 mt-3">
              {showManualInstall ? (
                <button
                  onClick={() => {
                    // Manual install instructions
                    alert('To install this app:\n\n1. Look for the install icon in your browser address bar\n2. Or go to browser menu > Install App\n3. Or on mobile: Add to Home Screen')
                  }}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  How to Install
                </button>
              ) : (
                <button
                  onClick={handleInstallClick}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Install
                </button>
              )}
              <button
                onClick={handleDismiss}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'text-slate-400 hover:bg-slate-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Not now
              </button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className={`p-1 rounded-lg transition-colors ${
              theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
            }`}
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default PWAInstallPrompt
