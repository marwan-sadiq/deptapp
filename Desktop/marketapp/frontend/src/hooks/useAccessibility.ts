import { useEffect, useCallback, useRef } from 'react'

export interface UseAccessibilityOptions {
  enableKeyboardNavigation?: boolean
  enableFocusManagement?: boolean
  enableScreenReader?: boolean
  enableHighContrast?: boolean
  enableReducedMotion?: boolean
}

export interface UseAccessibilityReturn {
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void
  setFocus: (element: HTMLElement | null) => void
  trapFocus: (container: HTMLElement) => void
  releaseFocus: () => void
  isHighContrast: boolean
  isReducedMotion: boolean
  addKeyboardListener: (key: string, handler: () => void) => void
  removeKeyboardListener: (key: string) => void
}

export const useAccessibility = (
  options: UseAccessibilityOptions = {}
): UseAccessibilityReturn => {
  const {
    enableKeyboardNavigation = true,
    enableFocusManagement = true,
    enableScreenReader = true,
    // enableHighContrast = true,
    // enableReducedMotion = true
  } = options

  const keyboardListeners = useRef<Map<string, () => void>>(new Map())
  const focusTrapRef = useRef<HTMLElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Screen reader announcements
  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!enableScreenReader || typeof window === 'undefined') return

    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message

    document.body.appendChild(announcement)

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }, [enableScreenReader])

  // Focus management
  const setFocus = useCallback((element: HTMLElement | null) => {
    if (!enableFocusManagement || !element) return

    // Store previous focus
    previousFocusRef.current = document.activeElement as HTMLElement

    // Set focus
    element.focus()
  }, [enableFocusManagement])

  // Focus trap
  const trapFocus = useCallback((container: HTMLElement) => {
    if (!enableFocusManagement) return

    focusTrapRef.current = container
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>

    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)
    firstElement.focus()

    // Store cleanup function
    ;(container as any).__focusTrapCleanup = () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  }, [enableFocusManagement])

  // Release focus trap
  const releaseFocus = useCallback(() => {
    if (!enableFocusManagement) return

    if (focusTrapRef.current) {
      const cleanup = (focusTrapRef.current as any).__focusTrapCleanup
      if (cleanup) {
        cleanup()
      }
      focusTrapRef.current = null
    }

    // Return focus to previous element
    if (previousFocusRef.current) {
      previousFocusRef.current.focus()
      previousFocusRef.current = null
    }
  }, [enableFocusManagement])

  // Keyboard navigation
  const addKeyboardListener = useCallback((key: string, handler: () => void) => {
    if (!enableKeyboardNavigation) return

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === key) {
        e.preventDefault()
        handler()
      }
    }

    const eventListener = (e: Event) => handleKeyPress(e as KeyboardEvent)
    document.addEventListener('keydown', eventListener as EventListener)
    keyboardListeners.current.set(key, eventListener as any)
  }, [enableKeyboardNavigation])

  const removeKeyboardListener = useCallback((key: string) => {
    const handler = keyboardListeners.current.get(key)
    if (handler) {
      document.removeEventListener('keydown', handler)
      keyboardListeners.current.delete(key)
    }
  }, [])

  // Media query checks
  const isHighContrast = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-contrast: high)').matches

  const isReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Remove all keyboard listeners
      keyboardListeners.current.forEach((handler) => {
        document.removeEventListener('keydown', handler)
      })
      keyboardListeners.current.clear()

      // Release focus trap
      releaseFocus()
    }
  }, [releaseFocus])

  return {
    announceToScreenReader,
    setFocus,
    trapFocus,
    releaseFocus,
    isHighContrast,
    isReducedMotion,
    addKeyboardListener,
    removeKeyboardListener
  }
}

// Hook for screen reader announcements
export const useScreenReader = () => {
  const { announceToScreenReader } = useAccessibility()
  return announceToScreenReader
}

// Hook for focus management
export const useFocusManagement = () => {
  const { setFocus, trapFocus, releaseFocus } = useAccessibility()
  return { setFocus, trapFocus, releaseFocus }
}

// Hook for keyboard navigation
export const useKeyboardNavigation = () => {
  const { addKeyboardListener, removeKeyboardListener } = useAccessibility()
  return { addKeyboardListener, removeKeyboardListener }
}

// Hook for media preferences
export const useMediaPreferences = () => {
  const { isHighContrast, isReducedMotion } = useAccessibility()
  return { isHighContrast, isReducedMotion }
}
