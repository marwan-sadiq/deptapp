import axios from 'axios'

// Determine API base URL based on environment
const getApiBaseUrl = () => {
  // Check if we're in development (localhost)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8000/api/'
  }
  // Production URL for PythonAnywhere
  return 'https://donnmero.pythonanywhere.com/api/'
}

const apiBaseUrl = getApiBaseUrl()
console.log('API Base URL:', apiBaseUrl)
console.log('Current hostname:', window.location.hostname)

export const api = axios.create({
  baseURL: apiBaseUrl,
})

// Test API connectivity
export const testApiConnection = async () => {
  try {
    console.log('Testing API connection to:', apiBaseUrl)
    const response = await api.get('auth/status/')
    console.log('API connection test successful:', response.data)
    return true
  } catch (error: any) {
    console.error('API connection test failed:', error)
    console.error('Error details:', error.response?.data)
    return false
  }
}

export type Customer = {
  id: number
  name: string
  phone: string
  address: string
  market_money: string
  total_debt: string
  reputation: 'excellent' | 'good' | 'fair' | 'poor' | 'bad'
  reputation_score: number
  last_payment_date?: string
  total_paid_30_days: string
  payment_streak_days: number
  earliest_due_date?: string
  created_at: string
  updated_at?: string
}

export type Company = {
  id: number
  name: string
  phone: string
  address: string
  market_money: string
  total_debt: string
  earliest_due_date?: string
  created_at: string
  updated_at?: string
}

export type Currency = {
  id: number
  code: string
  name: string
  symbol: string
  is_active: boolean
  exchange_rate_to_iqd: string
  created_at: string
  updated_at: string
}

export type Debt = {
  id: number
  customer: number | null
  company: number | null
  amount: string
  currency: number
  currency_code: string
  note: string
  is_settled: boolean
  due_date?: string | null
  override?: boolean
  created_at: string
}


