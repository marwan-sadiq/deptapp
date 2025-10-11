import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DollarSign, Building, CheckCircle, AlertCircle, Calculator, Target, X } from 'lucide-react'
import { api, getCurrencySymbol } from '../api'
import { useTheme } from '../contexts/ThemeContext'
import { useLanguage } from '../contexts/LanguageContext'

interface Company {
  id: number
  name: string
  total_debt: string
  earliest_due_date?: string
  created_at: string
  primary_currency?: string
}


interface PaymentSchedule {
  id: number
  payment_plan: number
  scheduled_date: string
  scheduled_amount: string
  actual_amount?: string
  is_paid: boolean
  paid_at?: string
  entity_name: string
}


interface GeneratedSchedule {
  date: string
  companyId: number
  companyName: string
  amount: number
  priority: number
  daysLeft: number
  isUrgent: boolean
  isPaid?: boolean
  currency: string
}

const CompanyPaymentPlanner: React.FC = () => {
  const [showGenerator, setShowGenerator] = useState(false)
  const [generatedSchedule, setGeneratedSchedule] = useState<GeneratedSchedule[]>([])
  const [shopMoney, setShopMoney] = useState('')
  const [safetyMargin, setSafetyMargin] = useState('20') // 20% safety margin
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<PaymentSchedule | null>(null)
  const [actualAmount, setActualAmount] = useState('')
  const [paidItems, setPaidItems] = useState<Set<string>>(new Set())
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)
  const [itemToConfirm, setItemToConfirm] = useState<GeneratedSchedule | null>(null)
  
  // Error handling states
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({})
  const [generateSuccess, setGenerateSuccess] = useState<string | null>(null)
  
  const queryClient = useQueryClient()
  const { theme } = useTheme()
  const { t, language } = useLanguage()

  // Fetch data
  const { data: companiesData } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => (await api.get('companies/')).data,
    retry: false,
    refetchOnWindowFocus: false
  })

  const { data: shopMoneyData } = useQuery({
    queryKey: ['shop-money'],
    queryFn: async () => {
      try {
        return (await api.get('shop-money/')).data
      } catch (error) {
        return { current_money: localStorage.getItem('shop-current-money') || '0' }
      }
    },
    retry: false,
    refetchOnWindowFocus: false
  })

  const { data: paymentPlansData } = useQuery({
    queryKey: ['payment-plans'],
    queryFn: async () => (await api.get('payment-plans/')).data,
    retry: false,
    refetchOnWindowFocus: false
  })

  const { data: schedulesData } = useQuery({
    queryKey: ['payment-schedules'],
    queryFn: async () => (await api.get('payment-schedules/')).data,
    retry: false,
    refetchOnWindowFocus: false
  })


  const companies = companiesData?.results || []
  const paymentPlans = paymentPlansData?.results || []
  const schedules = schedulesData?.results || []

  // Calculate totals
  const totalCompanyDebt = companies.reduce((sum: number, c: Company) => sum + parseFloat(c.total_debt || '0'), 0)
  const currentShopMoney = parseFloat(shopMoneyData?.current_money || '0')

  // Initialize form data
  useEffect(() => {
    if (shopMoneyData?.current_money) {
      setShopMoney(shopMoneyData.current_money)
    }
    
    // Set default date range (next 30 days)
    const today = new Date()
    const nextMonth = new Date(today)
    nextMonth.setDate(today.getDate() + 30)
    
    setStartDate(today.toISOString().split('T')[0])
    setEndDate(nextMonth.toISOString().split('T')[0])
    
    // Load saved generated schedule from localStorage
    const savedSchedule = localStorage.getItem('generated-payment-schedule')
    if (savedSchedule) {
      try {
        const parsedSchedule = JSON.parse(savedSchedule)
        setGeneratedSchedule(parsedSchedule)
        console.log('Loaded saved schedule from localStorage:', parsedSchedule)
      } catch (error) {
        console.error('Error loading saved schedule:', error)
        localStorage.removeItem('generated-payment-schedule')
      }
    }
  }, [shopMoneyData])

  // Calculate available money for payments
  const availableMoney = currentShopMoney * (1 - parseFloat(safetyMargin) / 100)
  const calculatedMaxDaily = availableMoney / 30 // Spread over 30 days

  console.log('Debug values:')
  console.log('currentShopMoney:', currentShopMoney)
  console.log('safetyMargin:', safetyMargin)
  console.log('availableMoney:', availableMoney)
  console.log('calculatedMaxDaily:', calculatedMaxDaily)

  // Validation functions
  const validateInputs = () => {
    const errors: {[key: string]: string} = {}
    
    // Check required fields
    if (!startDate) {
      errors.startDate = 'Start date is required'
    }
    if (!endDate) {
      errors.endDate = 'End date is required'
    }
    
    // Check date validity
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (isNaN(start.getTime())) {
        errors.startDate = 'Invalid start date'
      } else if (start < today) {
        errors.startDate = 'Start date cannot be in the past'
      }
      
      if (isNaN(end.getTime())) {
        errors.endDate = 'Invalid end date'
      } else if (end <= start) {
        errors.endDate = 'End date must be after start date'
      }
    }
    
    // Check safety margin
    const margin = parseFloat(safetyMargin)
    if (isNaN(margin) || margin < 0 || margin > 100) {
      errors.safetyMargin = 'Safety margin must be between 0 and 100'
    }
    
    // Check if there are companies with debt
    const companiesWithDebt = companies.filter((c: Company) => parseFloat(c.total_debt || '0') > 0)
    if (companiesWithDebt.length === 0) {
      errors.companies = 'No companies with debt found'
    }
    
    // Check available money
    if (availableMoney <= 0) {
      errors.money = 'No available money for payments after safety margin'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Clear errors when inputs change
  const clearErrors = () => {
    setGenerateError(null)
    setValidationErrors({})
    setGenerateSuccess(null)
  }


  // Generate payment schedule with error handling
  const generatePaymentSchedule = async () => {
    try {
      // Clear previous errors
      clearErrors()
      
      // Validate inputs
      if (!validateInputs()) {
        setGenerateError('Please fix the validation errors before generating schedule')
        return
      }

      setIsGenerating(true)
      setGenerateError(null)

      console.log('Generate schedule clicked')
      console.log('startDate:', startDate)
      console.log('endDate:', endDate)
      console.log('companies:', companies)

      const start = new Date(startDate)
      const end = new Date(endDate)
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      
      // Validate date range
      if (daysDiff <= 0) {
        throw new Error('Invalid date range: end date must be after start date')
      }
      
      if (daysDiff > 365) {
        throw new Error('Date range too long: maximum 365 days allowed')
      }
      
      // Calculate daily budget automatically based on available money and days
      const dailyBudget = availableMoney / daysDiff
      
      console.log('daysDiff:', daysDiff)
      console.log('availableMoney:', availableMoney)
      console.log('dailyBudget (auto-calculated):', dailyBudget)

      // Get companies with debt, sorted by priority
      const companiesWithDebt = companies
        .filter((c: Company) => parseFloat(c.total_debt || '0') > 0)
        .map((c: Company) => {
          const daysLeft = c.earliest_due_date 
            ? Math.ceil((new Date(c.earliest_due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : 999 // No due date = low priority
          
          return {
            ...c,
            daysLeft,
            isUrgent: daysLeft <= 7,
            priority: daysLeft <= 0 ? 1 : daysLeft <= 7 ? 2 : daysLeft <= 30 ? 3 : 4,
            currency: c.primary_currency || 'USD' // Include currency information
          }
        })
        .sort((a: any, b: any) => a.priority - b.priority || parseFloat(b.total_debt) - parseFloat(a.total_debt))

      console.log('companiesWithDebt:', companiesWithDebt)
      console.log('companiesWithDebt length:', companiesWithDebt.length)

      if (companiesWithDebt.length === 0) {
        throw new Error('No companies with debt found to generate schedule for')
      }

      const schedule: GeneratedSchedule[] = []
      const remainingDebts = new Map<number, number>(companiesWithDebt.map((c: any) => [c.id, parseFloat(c.total_debt)]))

      // Generate schedule for each day
      for (let i = 0; i < daysDiff; i++) {
        const currentDate = new Date(start)
        currentDate.setDate(start.getDate() + i)
        const dateStr = currentDate.toISOString().split('T')[0]
        
        let dailyRemaining = dailyBudget

        // Pay companies in priority order
        for (const company of companiesWithDebt) {
          if (dailyRemaining <= 0) break
          
          const remainingDebt = remainingDebts.get(company.id) || 0
          if (remainingDebt <= 0) continue

          // Calculate payment amount based on priority and remaining budget
          let paymentAmount = 0
          
          // Calculate how many days are left in the month
          const daysLeftInMonth = daysDiff - i
          
          if (company.priority === 1) { // Overdue - try to pay off completely
            if (remainingDebt <= dailyRemaining) {
              paymentAmount = remainingDebt // Pay off completely
            } else {
              paymentAmount = Math.min(remainingDebt, dailyRemaining * 0.8) // 80% of daily budget
            }
          } else if (company.priority === 2) { // Urgent (≤7 days)
            if (remainingDebt <= dailyRemaining * 0.9) {
              paymentAmount = remainingDebt // Pay off completely if reasonable
            } else {
              paymentAmount = Math.min(remainingDebt, dailyRemaining * 0.6) // 60% of daily budget
            }
          } else if (company.priority === 3) { // Normal (≤30 days)
            // Distribute remaining debt over remaining days
            const targetDailyPayment = remainingDebt / Math.max(daysLeftInMonth, 1)
            paymentAmount = Math.min(remainingDebt, Math.max(targetDailyPayment, dailyRemaining * 0.4))
          } else { // Low priority
            // Distribute remaining debt over remaining days
            const targetDailyPayment = remainingDebt / Math.max(daysLeftInMonth, 1)
            paymentAmount = Math.min(remainingDebt, Math.max(targetDailyPayment, dailyRemaining * 0.2))
          }

          if (paymentAmount > 0) {
            schedule.push({
              date: dateStr,
              companyId: company.id,
              companyName: company.name,
              amount: paymentAmount,
              priority: company.priority,
              daysLeft: company.daysLeft,
              isUrgent: company.isUrgent,
              currency: company.currency // Include currency in schedule
            })

            remainingDebts.set(company.id, remainingDebt - paymentAmount)
            dailyRemaining -= paymentAmount
          }
        }
      }

      console.log('Generated schedule:', schedule)
      console.log('Schedule length:', schedule.length)
      
      if (schedule.length === 0) {
        throw new Error('No payment schedule could be generated with current parameters')
      }
      
      setGeneratedSchedule(schedule)
      setGenerateSuccess(`Successfully generated payment schedule with ${schedule.length} payment items`)
      
      // Save schedule to localStorage for persistence
      try {
        localStorage.setItem('generated-payment-schedule', JSON.stringify(schedule))
        console.log('Schedule saved to localStorage')
      } catch (error) {
        console.error('Error saving schedule to localStorage:', error)
        // Don't throw here, just log the error as the schedule was still generated
      }
      
    } catch (error) {
      console.error('Error generating schedule:', error)
      setGenerateError(error instanceof Error ? error.message : 'An unexpected error occurred while generating the schedule')
    } finally {
      setIsGenerating(false)
    }
  }

  // Save generated schedule
  const saveSchedule = useMutation({
    mutationFn: async () => {
      // Create payment plans for companies with debt
      const plans = []
      for (const company of companies.filter((c: Company) => parseFloat(c.total_debt || '0') > 0)) {
        const plan = await api.post('payment-plans/', {
          company: company.id,
          total_debt: company.total_debt,
          paid_amount: '0',
          remaining_debt: company.total_debt,
          manual_priority: 1,
          is_active: true
        })
        plans.push(plan.data)
      }

      // Create payment schedules
      for (const item of generatedSchedule) {
        const plan = plans.find(p => p.company === item.companyId)
        if (plan) {
          await api.post('payment-schedules/', {
            payment_plan: plan.id,
            scheduled_date: item.date,
            scheduled_amount: item.amount.toFixed(3),
            actual_amount: '0',
            is_paid: false,
            currency: item.currency // Include currency in payment schedule
          })
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] })
      queryClient.invalidateQueries({ queryKey: ['payment-schedules'] })
      setShowGenerator(false)
    }
  })

  // Mark payment as done
  const markPaymentDone = useMutation({
    mutationFn: async ({ scheduleId, actualAmount }: { scheduleId: number, actualAmount: string }) => {
      // Update the payment schedule
      await api.patch(`payment-schedules/${scheduleId}/`, {
        actual_amount: actualAmount,
        is_paid: true,
        paid_at: new Date().toISOString()
      })

      // Find the schedule to get company info
      const schedule = schedules.find((s: any) => s.id === scheduleId)
      if (schedule) {
        // Create a debt entry (negative amount = payment)
        const plan = paymentPlans.find((p: any) => p.id === schedule.payment_plan)
        if (plan) {
          await api.post('debts/', {
            company: plan.company,
            customer: null,
            amount: `-${actualAmount}`, // Negative amount indicates payment
            note: `Payment completed - Schedule ID: ${scheduleId}`,
            override: false
          })
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-schedules'] })
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] })
    }
  })

  // Handle payment completion
  const handlePaymentDone = (schedule: PaymentSchedule) => {
    setSelectedSchedule(schedule)
    setActualAmount(schedule.scheduled_amount)
    setShowPaymentModal(true)
  }

  const confirmPayment = () => {
    if (selectedSchedule && actualAmount) {
      markPaymentDone.mutate({
        scheduleId: selectedSchedule.id,
        actualAmount: actualAmount
      })
      setShowPaymentModal(false)
      setSelectedSchedule(null)
      setActualAmount('')
    }
  }

  // Create payment debt mutation for generated schedule items
  const createPaymentDebt = useMutation({
    mutationFn: async (item: GeneratedSchedule) => {
      await api.post('debts/', {
        company: item.companyId,
        customer: null,
        amount: `-${item.amount}`, // Negative amount indicates payment
        note: `Payment completed - Generated schedule: ${item.date}`,
        override: false
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    }
  })

  // Handle marking generated schedule item as paid
  const handleGeneratedItemPaid = (item: GeneratedSchedule) => {
    setItemToConfirm(item)
    setShowConfirmationModal(true)
  }

  // Confirm generated payment
  const confirmGeneratedPayment = () => {
    if (itemToConfirm) {
      const itemKey = `${itemToConfirm.date}-${itemToConfirm.companyId}`
      setPaidItems(prev => new Set([...prev, itemKey]))
      createPaymentDebt.mutate(itemToConfirm)
      setShowConfirmationModal(false)
      setItemToConfirm(null)
      
      // Update localStorage to mark this item as paid
      try {
        const savedSchedule = localStorage.getItem('generated-payment-schedule')
        if (savedSchedule) {
          const schedule = JSON.parse(savedSchedule)
          // Mark the specific item as paid in the schedule
          const updatedSchedule = schedule.map((item: GeneratedSchedule) => 
            item.date === itemToConfirm.date && item.companyId === itemToConfirm.companyId
              ? { ...item, isPaid: true }
              : item
          )
          localStorage.setItem('generated-payment-schedule', JSON.stringify(updatedSchedule))
          console.log('Updated schedule in localStorage with paid item')
        }
      } catch (error) {
        console.error('Error updating schedule in localStorage:', error)
      }
    }
  }

  // Cancel payment confirmation
  const cancelPayment = () => {
    setShowConfirmationModal(false)
    setItemToConfirm(null)
  }

  // Clear generated schedule
  const clearSchedule = () => {
    setGeneratedSchedule([])
    setPaidItems(new Set())
    localStorage.removeItem('generated-payment-schedule')
    console.log('Schedule cleared from localStorage')
  }

  // Group schedule by date
  const scheduleByDate = generatedSchedule.reduce((acc, item) => {
    if (!acc[item.date]) acc[item.date] = []
    acc[item.date].push(item)
    return acc
  }, {} as {[key: string]: GeneratedSchedule[]})

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white">
            <Building size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className={`text-lg sm:text-xl lg:text-2xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-slate-800'
            }`}>{t('payment.title')}</h2>
            <p className={`text-sm sm:text-base ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
            }`}>{t('payment.subtitle')}</p>
          </div>
        </div>
        <button
          onClick={() => setShowGenerator(!showGenerator)}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <Calculator size={18} />
          {showGenerator ? t('payment.hideGenerator') : t('payment.generateSchedule')}
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className={`rounded-xl p-6 shadow-sm border ${
          theme === 'dark' 
            ? 'bg-slate-800 border-slate-700' 
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>{t('payment.totalCompanyDebt')}</p>
              <p className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-blue-300' : 'text-blue-900'
              }`}>{totalCompanyDebt.toFixed(3)} {t('currency.iqd')}</p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'
            }`}>
              <Building size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className={`rounded-xl p-6 shadow-sm border ${
          theme === 'dark' 
            ? 'bg-slate-800 border-slate-700' 
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>{t('payment.availableMoney')}</p>
              <p className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-green-300' : 'text-green-900'
              }`}>{availableMoney.toFixed(3)} {t('currency.iqd')}</p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              theme === 'dark' ? 'bg-green-900/30' : 'bg-green-100'
            }`}>
              <DollarSign size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className={`rounded-xl p-6 shadow-sm border ${
          theme === 'dark' 
            ? 'bg-slate-800 border-slate-700' 
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>{t('payment.dailyBudget')}</p>
              <p className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-purple-300' : 'text-purple-900'
              }`}>{startDate && endDate ? (availableMoney / Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))).toFixed(3) : '0.000'} {t('currency.iqd')}</p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              theme === 'dark' ? 'bg-purple-900/30' : 'bg-purple-100'
            }`}>
              <Target size={24} className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className={`rounded-xl p-6 shadow-sm border ${
          theme === 'dark' 
            ? 'bg-slate-800 border-slate-700' 
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>{t('payment.safetyMargin')}</p>
              <p className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-orange-300' : 'text-orange-900'
              }`}>{safetyMargin}%</p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              theme === 'dark' ? 'bg-orange-900/30' : 'bg-orange-100'
            }`}>
              <AlertCircle size={24} className="text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Generator Form */}
      {showGenerator && (
        <div className={`rounded-xl p-4 sm:p-6 shadow-sm border ${
          theme === 'dark' 
            ? 'bg-slate-800 border-slate-700' 
            : 'bg-white border-slate-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-slate-800'
          }`}>{t('payment.generateSchedule')}</h3>
          
          {/* Error Display */}
          {generateError && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <p className="text-red-800 dark:text-red-200 text-sm font-medium">
                  {generateError}
                </p>
              </div>
            </div>
          )}

          {/* Success Display */}
          {generateSuccess && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <p className="text-green-800 dark:text-green-200 text-sm font-medium">
                  {generateSuccess}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>{t('payment.shopMoney')}</label>
              <input
                type="number"
                step="0.001"
                value={shopMoney}
                onChange={(e) => {
                  setShopMoney(e.target.value)
                  clearErrors()
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.money
                    ? 'border-red-500 focus:ring-red-500'
                    : theme === 'dark'
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
                placeholder="0.000"
              />
              {validationErrors.money && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {validationErrors.money}
                </p>
              )}
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>{t('payment.safetyMarginPercent')}</label>
              <input
                type="number"
                min="0"
                max="100"
                value={safetyMargin}
                onChange={(e) => {
                  setSafetyMargin(e.target.value)
                  clearErrors()
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.safetyMargin
                    ? 'border-red-500 focus:ring-red-500'
                    : theme === 'dark'
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
                placeholder="20"
              />
              {validationErrors.safetyMargin && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {validationErrors.safetyMargin}
                </p>
              )}
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>{t('payment.dateRange')}</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value)
                      clearErrors()
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.startDate
                        ? 'border-red-500 focus:ring-red-500'
                        : theme === 'dark'
                        ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                  {validationErrors.startDate && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {validationErrors.startDate}
                    </p>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value)
                      clearErrors()
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.endDate
                        ? 'border-red-500 focus:ring-red-500'
                        : theme === 'dark'
                        ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                  {validationErrors.endDate && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {validationErrors.endDate}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Additional validation errors */}
          {validationErrors.companies && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                  {validationErrors.companies}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={generatePaymentSchedule}
              disabled={isGenerating}
              className={`w-full sm:w-auto px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                isGenerating
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Calculator size={18} />
                  {t('payment.generateSchedule')}
                </>
              )}
            </button>
            
            {generatedSchedule.length > 0 && (
              <button
                onClick={() => saveSchedule.mutate()}
                disabled={saveSchedule.isPending}
                className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} />
                {saveSchedule.isPending ? t('buttons.saving') : t('buttons.saveSchedule')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Generated Schedule */}
      {generatedSchedule.length > 0 && (
        <div className={`rounded-xl p-4 sm:p-6 shadow-sm border ${
          theme === 'dark' 
            ? 'bg-slate-800 border-slate-700' 
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <h3 className={`text-lg font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-slate-800'
            }`}>{t('payment.generatedSchedule')}</h3>
            <button
              onClick={clearSchedule}
              className="w-full sm:w-auto px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <X size={16} />
              {t('buttons.clearSchedule')}
            </button>
          </div>
          
          <div className="space-y-4">
            {Object.entries(scheduleByDate).map(([date, items]) => (
              <div key={date} className={`border rounded-lg p-4 ${
                theme === 'dark' 
                  ? 'border-slate-600 bg-slate-700' 
                  : 'border-slate-200 bg-white'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className={`font-medium ${
                    theme === 'dark' ? 'text-white' : 'text-slate-800'
                  }`}>
                    {new Date(date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h4>
                  <span className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    {t('common.total')}: {items.reduce((sum, item) => sum + item.amount, 0).toFixed(3)} {getCurrencySymbol(items[0]?.currency || 'USD', language)}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {items.map((item, index) => {
                    const itemKey = `${item.date}-${item.companyId}`
                    const isPaid = paidItems.has(itemKey) || item.isPaid
                    
                    return (
                      <div 
                        key={index}
                        className={`p-3 rounded-lg border ${
                          isPaid 
                            ? theme === 'dark'
                              ? 'border-green-700 bg-green-900/20'
                              : 'border-green-200 bg-green-50'
                            : item.isUrgent 
                              ? theme === 'dark'
                                ? 'border-red-700 bg-red-900/20'
                                : 'border-red-200 bg-red-50'
                              : item.priority === 2 
                                ? theme === 'dark'
                                  ? 'border-orange-700 bg-orange-900/20'
                                  : 'border-orange-200 bg-orange-50'
                                : theme === 'dark'
                                  ? 'border-slate-600 bg-slate-600'
                                  : 'border-slate-200 bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`font-medium ${
                              theme === 'dark' ? 'text-white' : 'text-slate-800'
                            }`}>{item.companyName}</p>
                            <p className={`text-sm ${
                              theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                            }`}>
                              {item.amount.toFixed(3)} {getCurrencySymbol(item.currency, language)}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              isPaid
                                ? theme === 'dark'
                                  ? 'bg-green-900/30 text-green-300'
                                  : 'bg-green-100 text-green-800'
                                : item.isUrgent 
                                  ? theme === 'dark'
                                    ? 'bg-red-900/30 text-red-300'
                                    : 'bg-red-100 text-red-800'
                                  : item.priority === 2
                                    ? theme === 'dark'
                                      ? 'bg-orange-900/30 text-orange-300'
                                      : 'bg-orange-100 text-orange-800'
                                    : theme === 'dark'
                                      ? 'bg-blue-900/30 text-blue-300'
                                      : 'bg-blue-100 text-blue-800'
                            }`}>
                              {isPaid ? t('payment.paid') : item.isUrgent ? t('payment.urgent') : item.priority === 2 ? t('payment.high') : t('payment.normal')}
                            </span>
                            {item.daysLeft < 999 && !isPaid && (
                              <p className={`text-xs mt-1 ${
                                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                              }`}>
                                {item.daysLeft} {t('time.daysLeft')}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {!isPaid && (
                          <div className="mt-2 flex justify-end">
                            <button
                              onClick={() => handleGeneratedItemPaid(item)}
                              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors flex items-center gap-1"
                            >
                              <CheckCircle size={12} />
                              Done
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing Schedules */}
      {schedules.length > 0 && (
        <div className={`rounded-xl p-4 sm:p-6 shadow-sm border ${
          theme === 'dark' 
            ? 'bg-slate-800 border-slate-700' 
            : 'bg-white border-slate-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-slate-800'
          }`}>{t('payment.existingSchedules')}</h3>
          
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className={`border-b ${
                  theme === 'dark' ? 'border-slate-600' : 'border-slate-200'
                }`}>
                  <th className={`text-left py-3 px-2 sm:px-4 font-medium text-sm ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                  }`}>{t('common.date')}</th>
                  <th className={`text-left py-3 px-2 sm:px-4 font-medium text-sm ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                  }`}>{t('navigation.companies')}</th>
                  <th className={`text-left py-3 px-2 sm:px-4 font-medium text-sm ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                  }`}>{t('payment.scheduledAmount')}</th>
                  <th className={`text-left py-3 px-2 sm:px-4 font-medium text-sm ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                  }`}>{t('payment.actualAmount')}</th>
                  <th className={`text-left py-3 px-2 sm:px-4 font-medium text-sm ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                  }`}>{t('common.status')}</th>
                  <th className={`text-left py-3 px-2 sm:px-4 font-medium text-sm ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                  }`}>{t('common.action')}</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((schedule: PaymentSchedule) => (
                  <tr key={schedule.id} className={`border-b ${
                    theme === 'dark' ? 'border-slate-700' : 'border-slate-100'
                  }`}>
                    <td className={`py-3 px-2 sm:px-4 text-sm ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      {new Date(schedule.scheduled_date).toLocaleDateString()}
                    </td>
                    <td className={`py-3 px-2 sm:px-4 font-medium text-sm ${
                      theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                    }`}>{schedule.entity_name}</td>
                    <td className={`py-3 px-2 sm:px-4 text-sm ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                    }`}>{parseFloat(schedule.scheduled_amount).toFixed(3)} IQD</td>
                    <td className={`py-3 px-2 sm:px-4 text-sm ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      {schedule.actual_amount ? `${parseFloat(schedule.actual_amount).toFixed(3)} IQD` : '-'}
                    </td>
                    <td className="py-3 px-2 sm:px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        schedule.is_paid 
                          ? theme === 'dark'
                            ? 'bg-green-900/30 text-green-300'
                            : 'bg-green-100 text-green-800'
                          : theme === 'dark'
                            ? 'bg-yellow-900/30 text-yellow-300'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {schedule.is_paid ? t('payment.paid') : t('common.pending')}
                      </span>
                    </td>
                    <td className="py-3 px-2 sm:px-4">
                      {!schedule.is_paid ? (
                        <button
                          onClick={() => handlePaymentDone(schedule)}
                          className="px-2 sm:px-3 py-1 bg-green-600 text-white text-xs sm:text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                        >
                          <CheckCircle size={12} className="sm:w-3.5 sm:h-3.5" />
                          <span className="hidden sm:inline">{t('buttons.done')}</span>
                        </button>
                      ) : (
                        <span className={`text-xs sm:text-sm ${
                          theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                        }`}>{t('common.completed')}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {showPaymentModal && selectedSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl p-4 sm:p-6 w-full max-w-md ${
            theme === 'dark' ? 'bg-slate-800' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-slate-800'
              }`}>{t('payment.confirmPayment')}</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-600">{t('navigation.companies')}:</p>
                <p className="font-medium text-slate-800">{selectedSchedule.entity_name}</p>
              </div>
              
              <div>
                <p className="text-sm text-slate-600">{t('payment.scheduledAmount')}:</p>
                <p className="font-medium text-slate-800">{parseFloat(selectedSchedule.scheduled_amount).toFixed(3)} {t('currency.iqd')}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('payment.actualAmount')} *
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={actualAmount}
                  onChange={(e) => setActualAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.000"
                  autoFocus
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 text-slate-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {t('buttons.cancel')}
                </button>
                <button
                  onClick={confirmPayment}
                  disabled={!actualAmount || markPaymentDone.isPending}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {markPaymentDone.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {t('debt.processing')}
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      {t('payment.markAsPaid')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {showConfirmationModal && itemToConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-4 sm:p-6 max-w-md w-full shadow-2xl ${
            theme === 'dark' ? 'bg-slate-800' : 'bg-white'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white">
                <CheckCircle size={24} />
              </div>
              <div>
                <h3 className={`text-xl font-display font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-slate-800'
                }`}>
                  {t('payment.confirmPayment')}
                </h3>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  {t('payment.confirmPaymentDesc')}
                </p>
              </div>
            </div>

            <div className={`p-4 rounded-xl mb-6 ${
              theme === 'dark' ? 'bg-slate-700' : 'bg-slate-50'
            }`}>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={`font-medium ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    {t('company.name')}:
                  </span>
                  <span className={`font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-slate-800'
                  }`}>
                    {itemToConfirm.companyName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`font-medium ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    {t('payment.amount')}:
                  </span>
                  <span className={`font-bold text-lg ${
                    theme === 'dark' ? 'text-green-400' : 'text-green-600'
                  }`}>
                    {itemToConfirm.amount.toFixed(3)} {t('currency.iqd')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`font-medium ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    {t('payment.date')}:
                  </span>
                  <span className={`font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-slate-800'
                  }`}>
                    {new Date(itemToConfirm.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={cancelPayment}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  theme === 'dark'
                    ? 'text-slate-300 bg-slate-700 hover:bg-slate-600'
                    : 'text-slate-600 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {t('buttons.cancel')}
              </button>
              <button
                onClick={confirmGeneratedPayment}
                disabled={createPaymentDebt.isPending}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {createPaymentDebt.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t('debt.processing')}
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    {t('payment.confirm')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CompanyPaymentPlanner
