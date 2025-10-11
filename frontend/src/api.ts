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

export type Debt = {
  id: number
  customer: number | null
  company: number | null
  amount: string
  note: string
  is_settled: boolean
  due_date?: string | null
  override?: boolean
  created_at: string
}


