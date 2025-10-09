import '@testing-library/jest-dom'
import { configure } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './contexts/ThemeContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { ReactElement } from 'react'

// Configure testing library
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
})

// Mock fetch
global.fetch = jest.fn()

// Mock console methods to reduce noise in tests
const originalError = console.error
const originalWarn = console.warn

beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
  
  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('componentWillReceiveProps')
    ) {
      return
    }
    originalWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
  console.warn = originalWarn
})

// Test utilities
export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
})

export const createTestWrapper = () => {
  const queryClient = createTestQueryClient()
  
  return ({ children }: { children: React.ReactNode }) => {
    // This would be used in actual test files
    return null
  }
}

// Mock API responses
export const mockApiResponse = <T,>(data: T, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {},
})

export const mockApiError = (message = 'API Error', status = 500) => {
  const error = new Error(message)
  ;(error as any).response = {
    data: { message },
    status,
    statusText: 'Internal Server Error',
    headers: {},
    config: {},
  }
  return error
}

// Test data factories
export const createMockCustomer = (overrides = {}) => ({
  id: 1,
  name: 'Test Customer',
  phone: '1234567890',
  address: 'Test Address',
  market_money: '0.000',
  total_debt: '1000.000',
  reputation: 'good',
  reputation_score: 75,
  last_payment_date: null,
  total_paid_30_days: '0.000',
  payment_streak_days: 0,
  earliest_due_date: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createMockCompany = (overrides = {}) => ({
  id: 1,
  name: 'Test Company',
  phone: '1234567890',
  address: 'Test Address',
  market_money: '0.000',
  total_debt: '2000.000',
  earliest_due_date: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createMockDebt = (overrides = {}) => ({
  id: 1,
  customer: 1,
  company: null,
  amount: '500.000',
  note: 'Test debt',
  is_settled: false,
  due_date: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

// Custom matchers
expect.extend({
  toBeInTheDocument: require('@testing-library/jest-dom/matchers').toBeInTheDocument,
  toHaveClass: require('@testing-library/jest-dom/matchers').toHaveClass,
  toHaveTextContent: require('@testing-library/jest-dom/matchers').toHaveTextContent,
  toBeVisible: require('@testing-library/jest-dom/matchers').toBeVisible,
  toBeDisabled: require('@testing-library/jest-dom/matchers').toBeDisabled,
  toBeEnabled: require('@testing-library/jest-dom/matchers').toBeEnabled,
  toHaveValue: require('@testing-library/jest-dom/matchers').toHaveValue,
  toHaveAttribute: require('@testing-library/jest-dom/matchers').toHaveAttribute,
  toHaveStyle: require('@testing-library/jest-dom/matchers').toHaveStyle,
})
