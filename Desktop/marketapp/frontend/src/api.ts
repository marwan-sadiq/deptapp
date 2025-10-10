import axios from 'axios'

export const api = axios.create({
  baseURL: 'https://donnmero.pythonanywhere.com/api/',
})

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
  primary_currency: string
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
  primary_currency: string
  created_at: string
  updated_at?: string
}

export type Debt = {
  id: number
  customer: number | null
  company: number | null
  amount: string
  currency: string
  note: string
  is_settled: boolean
  due_date?: string | null
  override?: boolean
  created_at: string
}

// Currency utility functions
export const getCurrencySymbol = (currency: string, language?: string): string => {
  switch (currency) {
    case 'USD':
      return '$'
    case 'IQD':
      // Return different symbols based on language
      switch (language) {
        case 'ku': // Kurdish
          return 'د.ع'
        case 'ar': // Arabic
          return 'د.ع'
        case 'tr': // Turkish
          return 'IQD'
        case 'en': // English
        default:
          return 'IQD'
      }
    default:
      return currency
  }
}

export const getCurrencyName = (currency: string): string => {
  switch (currency) {
    case 'USD':
      return 'US Dollar'
    case 'IQD':
      return 'Iraqi Dinar'
    default:
      return currency
  }
}

// Number formatting utility functions
export const formatNumber = (number: string | number, language?: string): string => {
  const num = typeof number === 'string' ? parseFloat(number) : number
  if (isNaN(num)) return '0'
  
  const formatted = num.toFixed(3)
  
  // Convert to Arabic-Indic numerals for Arabic and Kurdish languages
  if (language === 'ar' || language === 'ku') {
    return convertToArabicNumerals(formatted)
  }
  
  return formatted
}

export const convertToArabicNumerals = (text: string): string => {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
  const englishNumerals = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
  
  return text.replace(/[0-9]/g, (digit) => {
    const index = englishNumerals.indexOf(digit)
    return index !== -1 ? arabicNumerals[index] : digit
  })
}


