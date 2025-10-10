import { useState, useEffect, useCallback } from 'react'

export interface BreakpointConfig {
  xs: number
  sm: number
  md: number
  lg: number
  xl: number
  '2xl': number
}

export const defaultBreakpoints: BreakpointConfig = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
}

export type Breakpoint = keyof BreakpointConfig

export interface UseResponsiveReturn {
  width: number
  height: number
  isXs: boolean
  isSm: boolean
  isMd: boolean
  isLg: boolean
  isXl: boolean
  is2Xl: boolean
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isTouch: boolean
  orientation: 'portrait' | 'landscape'
  breakpoint: Breakpoint
  isBreakpoint: (breakpoint: Breakpoint) => boolean
  isBreakpointUp: (breakpoint: Breakpoint) => boolean
  isBreakpointDown: (breakpoint: Breakpoint) => boolean
  isBreakpointBetween: (min: Breakpoint, max: Breakpoint) => boolean
}

export const useResponsive = (
  breakpoints: BreakpointConfig = defaultBreakpoints
): UseResponsiveReturn => {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  })

  const updateDimensions = useCallback(() => {
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight
    })
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    window.addEventListener('resize', updateDimensions)
    window.addEventListener('orientationchange', updateDimensions)

    return () => {
      window.removeEventListener('resize', updateDimensions)
      window.removeEventListener('orientationchange', updateDimensions)
    }
  }, [updateDimensions])

  const { width, height } = dimensions

  // Determine current breakpoint
  const getBreakpoint = (): Breakpoint => {
    if (width >= breakpoints['2xl']) return '2xl'
    if (width >= breakpoints.xl) return 'xl'
    if (width >= breakpoints.lg) return 'lg'
    if (width >= breakpoints.md) return 'md'
    if (width >= breakpoints.sm) return 'sm'
    return 'xs'
  }

  const breakpoint = getBreakpoint()

  // Individual breakpoint checks
  const isXs = width >= breakpoints.xs && width < breakpoints.sm
  const isSm = width >= breakpoints.sm && width < breakpoints.md
  const isMd = width >= breakpoints.md && width < breakpoints.lg
  const isLg = width >= breakpoints.lg && width < breakpoints.xl
  const isXl = width >= breakpoints.xl && width < breakpoints['2xl']
  const is2Xl = width >= breakpoints['2xl']

  // Device type checks
  const isMobile = width < breakpoints.md
  const isTablet = width >= breakpoints.md && width < breakpoints.lg
  const isDesktop = width >= breakpoints.lg

  // Touch detection
  const isTouch = typeof window !== 'undefined' && 
    ('ontouchstart' in window || navigator.maxTouchPoints > 0)

  // Orientation
  const orientation = height > width ? 'portrait' : 'landscape'

  // Utility functions
  const isBreakpoint = useCallback((bp: Breakpoint): boolean => {
    return breakpoint === bp
  }, [breakpoint])

  const isBreakpointUp = useCallback((bp: Breakpoint): boolean => {
    return width >= breakpoints[bp]
  }, [width, breakpoints])

  const isBreakpointDown = useCallback((bp: Breakpoint): boolean => {
    return width < breakpoints[bp]
  }, [width, breakpoints])

  const isBreakpointBetween = useCallback((min: Breakpoint, max: Breakpoint): boolean => {
    return width >= breakpoints[min] && width < breakpoints[max]
  }, [width, breakpoints])

  return {
    width,
    height,
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    is2Xl,
    isMobile,
    isTablet,
    isDesktop,
    isTouch,
    orientation,
    breakpoint,
    isBreakpoint,
    isBreakpointUp,
    isBreakpointDown,
    isBreakpointBetween
  }
}

// Hook for specific breakpoint checks
export const useBreakpoint = (breakpoint: Breakpoint) => {
  const { isBreakpoint } = useResponsive()
  return isBreakpoint(breakpoint)
}

// Hook for mobile detection
export const useIsMobile = () => {
  const { isMobile } = useResponsive()
  return isMobile
}

// Hook for tablet detection
export const useIsTablet = () => {
  const { isTablet } = useResponsive()
  return isTablet
}

// Hook for desktop detection
export const useIsDesktop = () => {
  const { isDesktop } = useResponsive()
  return isDesktop
}

// Hook for touch detection
export const useIsTouch = () => {
  const { isTouch } = useResponsive()
  return isTouch
}
