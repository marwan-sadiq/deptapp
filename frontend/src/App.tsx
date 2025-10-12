import { useState, useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Plus, TrendingUp, Users, Building2, Search, X, CreditCard, Users2, Building, Calendar, Wallet, Filter, Moon, Sun, LogOut } from 'lucide-react'
import { api, type Customer, type Company } from './api'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { LanguageProvider, useLanguage } from './contexts/LanguageContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LanguageSwitcher from './components/LanguageSwitcher'
import NavTab from './components/NavTab'
import StatCard from './components/StatCard'
import TopDebtors from './components/TopDebtors'
import EntityCard from './components/EntityCard'
import EntityForm from './components/EntityForm'
import CompanyPaymentPlanner from './components/CompanyPaymentPlanner'
import ShopMoneyInput from './components/ShopMoneyInput'
import CustomerProfile from './components/CustomerProfile'
import CompanyProfile from './components/CompanyProfile'
import ErrorBoundary from './components/ErrorBoundary'
import Login from './components/Login'
// import ProtectedRoute from './components/ProtectedRoute'
// import PWAInstallPrompt from './components/PWAInstallPrompt'

function AppContent() {
  const location = useLocation()
  const currentPath = location.pathname.split('/')[1] || 'login'
  const { theme, toggleTheme } = useTheme()
  const { t, isRTL } = useLanguage()
  const { user, logout, isAuthenticated } = useAuth()

  // If not authenticated, show only login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Login />} />
        </Routes>
      </div>
    )
  }

  // If authenticated, show the full dashboard
  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      theme === 'dark' 
        ? 'bg-slate-900' 
        : 'bg-slate-50'
    }`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <header className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="animate-fade-in">
                <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-display font-bold mb-2 transition-colors duration-200 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-800'
                }`}>
                  {t('app.title')}
                </h1>
                <p className={`text-sm sm:text-base font-sans transition-colors duration-200 ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  {t('app.subtitle')}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
                {/* User Info */}
                <div className={`px-3 py-2 rounded-lg ${
                  theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'
                }`}>
                  <p className={`text-xs sm:text-sm font-medium ${
                    theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
                  }`}>
                    {t('auth.welcome')}, {user?.first_name || user?.username}
                  </p>
                </div>
                
                <LanguageSwitcher />
                <button
                  onClick={toggleTheme}
                  className={`p-2 sm:p-3 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg ${
                    theme === 'dark' 
                      ? 'bg-slate-700 text-yellow-400 hover:bg-slate-600' 
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                  title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <button
                  onClick={logout}
                  className={`p-2 sm:p-3 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg ${
                    theme === 'dark' 
                      ? 'bg-red-700 text-red-200 hover:bg-red-600' 
                      : 'bg-red-200 text-red-700 hover:bg-red-300'
                  }`}
                  title={t('auth.logout')}
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </header>

        <nav className={`rounded-xl shadow-lg p-2 mb-6 sm:mb-8 sticky top-4 z-10 transition-all duration-200 ${
          theme === 'dark' 
            ? 'bg-slate-800 border border-slate-700' 
            : 'bg-white border border-slate-200'
        }`}>
          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2">
            <NavTab to="/" icon={<TrendingUp size={18} />} active={currentPath === 'dashboard'}>{t('navigation.dashboard')}</NavTab>
            <NavTab to="/customers" icon={<Users size={18} />} active={currentPath === 'customers'}>{t('navigation.customers')}</NavTab>
            <NavTab to="/companies" icon={<Building2 size={18} />} active={currentPath === 'companies'}>{t('navigation.companies')}</NavTab>
            <NavTab to="/payments" icon={<Calendar size={18} />} active={currentPath === 'payments'}>{t('navigation.payments')}</NavTab>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/:id" element={<CustomerProfile />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/companies/:id" element={<CompanyProfile />} />
          <Route path="/payments" element={<CompanyPaymentPlanner />} />
        </Routes>
      </div>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}


function Dashboard() {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const { data: custData, error: custError } = useQuery({ 
    queryKey: ['customers'], 
    queryFn: async () => (await api.get('customers/')).data,
    retry: false,
    refetchOnWindowFocus: false
  })
  const { data: compData, error: compError } = useQuery({ 
    queryKey: ['companies'], 
    queryFn: async () => (await api.get('companies/')).data,
    retry: false,
    refetchOnWindowFocus: false
  })
  const { data: shopData } = useQuery({ 
    queryKey: ['shop-money'], 
    queryFn: async () => {
      try {
        return (await api.get('shop-money/')).data
      } catch (error) {
        // If endpoint doesn't exist yet, return default value from localStorage
        return { current_money: localStorage.getItem('shop-current-money') || '0' }
      }
    },
    retry: false,
    refetchOnWindowFocus: false
  })
  
  const customers = custData?.results || []
  const companies = compData?.results || []

  // Fetch all debts to calculate proper currency totals
  const { data: allDebtsData } = useQuery({
    queryKey: ['all-debts'],
    queryFn: async () => {
      const response = await api.get('debts/')
      return response.data.results || response.data
    },
    enabled: !!custData && !!compData
  })

  const allDebts = allDebtsData || []

  // Helper function to get currency translation
  const getCurrencyTranslation = useCallback((code: string) => {
    const currencyKey = code.toLowerCase()
    return t(`currency.${currencyKey}`) || code
  }, [t])

  // Calculate debt totals by currency
  const calculateDebtTotals = (debts: any[]) => {
    const totals: { [key: string]: number } = {}
    debts.forEach((debt: any) => {
      const amount = parseFloat(debt.amount || '0') || 0
      const currency = debt.currency_code || 'IQD'
      totals[currency] = (totals[currency] || 0) + amount
    })
    return totals
  }

  const customerDebts = allDebts.filter((debt: any) => debt.customer && !debt.company)
  const companyDebts = allDebts.filter((debt: any) => debt.company && !debt.customer)
  
  const customerDebtTotals = calculateDebtTotals(customerDebts)
  const companyDebtTotals = calculateDebtTotals(companyDebts)

  // Format currency totals for display
  const formatCurrencyTotals = (totals: { [key: string]: number }) => {
    const currencies = Object.keys(totals).sort()
    if (currencies.length === 0) return '0 IQD'
    if (currencies.length === 1) {
      const currency = currencies[0]
      return `${totals[currency].toFixed(3)} ${getCurrencyTranslation(currency)}`
    }
    // Multiple currencies - show as "USD: 100, IQD: 200"
    return currencies.map(currency => 
      `${totals[currency].toFixed(3)} ${getCurrencyTranslation(currency)}`
    ).join(', ')
  }

  const totalShopMoney = parseFloat(shopData?.current_money || '0')

  const customersWithDebt = customers.filter((c: Customer) => parseFloat(c.total_debt || '0') > 0).length
  const companiesWithDebt = companies.filter((c: Company) => parseFloat(c.total_debt || '0') > 0).length


  // Show loading state if any critical data is still loading
  if (!custData && !custError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className={`font-sans ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Loading dashboard...</div>
        </div>
      </div>
    )
  }

  // Show error state if there are API errors
  if (custError || compError) {
    return (
      <div className="space-y-6">
        <div className={`rounded-xl p-6 text-center ${
          theme === 'dark' 
            ? 'bg-red-900/20 border border-red-700' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <h3 className={`text-lg font-display font-semibold mb-2 ${
            theme === 'dark' ? 'text-red-300' : 'text-red-800'
          }`}>
            Connection Error
          </h3>
          <p className={`mb-4 font-sans ${
            theme === 'dark' ? 'text-red-400' : 'text-red-600'
          }`}>
            Unable to connect to the server. Please make sure the backend is running.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 hover:scale-105 shadow-lg font-sans font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Shop Money Section */}
      <div className={`rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl border ${
        theme === 'dark' 
          ? 'bg-slate-800 border-slate-700' 
          : 'bg-gradient-to-br from-white to-slate-50 border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-lg ${
              theme === 'dark' 
                ? 'bg-gradient-to-br from-green-500 to-green-600 text-white' 
                : 'bg-green-900 text-white'
            }`}>
              <Wallet size={24} />
            </div>
            <div>
              <h3 className={`text-xl sm:text-2xl font-display font-bold ${
                theme === 'dark' ? 'text-white' : 'text-slate-800'
              }`}>
                {t('shopMoney.title')}
              </h3>
              <p className={`text-sm sm:text-base font-sans ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>
                {t('shopMoney.subtitle')}
              </p>
            </div>
          </div>
          <div className={`px-4 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-xl shadow-sm w-full sm:w-auto ${
            theme === 'dark' ? 'bg-green-900/20' : 'bg-gradient-to-br from-green-50 to-green-100'
          }`}>
            <div className="text-center">
              <p className={`text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-display font-bold ${
                theme === 'dark' ? 'text-green-300' : 'text-green-800'
              }`}>
                {totalShopMoney.toFixed(3)} {t('currency.iqd')}
              </p>
              <p className={`text-xs sm:text-sm font-sans font-medium ${
                theme === 'dark' ? 'text-green-400' : 'text-green-600'
              }`}>
                {t('shopMoney.currentAmount')}
              </p>
            </div>
          </div>
        </div>
        <ShopMoneyInput />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        <StatCard 
          title={t('dashboard.customerDebt')} 
          value={formatCurrencyTotals(customerDebtTotals)} 
          subtitle={`${customersWithDebt} ${t('dashboard.withDebt')}`} 
          color="orange" 
          icon={<Users2 size={24} />}
        />
        <StatCard 
          title={t('dashboard.companyDebt')} 
          value={formatCurrencyTotals(companyDebtTotals)} 
          subtitle={`${companiesWithDebt} ${t('dashboard.withDebt')}`} 
          color="purple" 
          icon={<Building size={24} />}
        />
        <StatCard 
          title={t('dashboard.totalAccounts')} 
          value={customers.length + companies.length} 
          subtitle={`${customers.length} ${t('navigation.customers')}, ${companies.length} ${t('navigation.companies')}`} 
          color="orange" 
          icon={<CreditCard size={24} />}
        />
      </div>


      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        <TopDebtors title={t('dashboard.topCustomerDebts')} items={customers} type="customer" />
        <TopDebtors title={t('dashboard.topCompanyDebts')} items={companies} type="company" />
      </div>
    </div>
  )
}



function CustomersPage() {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    debtRange: 'all', // all, no-debt, low, medium, high
    reputation: 'all', // all, excellent, good, fair, poor, bad
    paymentStatus: 'all', // all, paid-recently, overdue, no-payments
    sortBy: 'created' // name, debt, reputation, created
  })
  const qc = useQueryClient()
  const { t } = useLanguage()
  const { theme } = useTheme()
  const { data } = useQuery({ queryKey: ['customers'], queryFn: async () => (await api.get('customers/')).data })
  const customers = data?.results || []

  // Apply filters
  const filtered = customers.filter((c: Customer) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.address.toLowerCase().includes(search.toLowerCase())
    
    if (!matchesSearch) return false

    const debt = parseFloat(c.total_debt || '0')
    
    // Debt range filter
    if (filters.debtRange !== 'all') {
      switch (filters.debtRange) {
        case 'no-debt':
          if (debt > 0) return false
          break
        case 'low':
          if (debt <= 0 || debt > 1000) return false
          break
        case 'medium':
          if (debt <= 1000 || debt > 5000) return false
          break
        case 'high':
          if (debt <= 5000) return false
          break
      }
    }

    // Reputation filter
    if (filters.reputation !== 'all' && c.reputation !== filters.reputation) {
      return false
    }

    // Payment status filter
    if (filters.paymentStatus !== 'all') {
      const daysSinceLastPayment = c.last_payment_date 
        ? Math.floor((Date.now() - new Date(c.last_payment_date).getTime()) / (1000 * 60 * 60 * 24))
        : 999
      
      switch (filters.paymentStatus) {
        case 'paid-recently':
          if (daysSinceLastPayment > 30) return false
          break
        case 'overdue':
          if (c.earliest_due_date && new Date(c.earliest_due_date) > new Date()) return false
          break
        case 'no-payments':
          if (daysSinceLastPayment < 999) return false
          break
      }
    }

    return true
  }).sort((a: Customer, b: Customer) => {
    switch (filters.sortBy) {
      case 'debt':
        return parseFloat(b.total_debt || '0') - parseFloat(a.total_debt || '0')
      case 'reputation':
        const repOrder = { excellent: 5, good: 4, fair: 3, poor: 2, bad: 1 }
        return repOrder[b.reputation] - repOrder[a.reputation]
      case 'created':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      default:
        return a.name.localeCompare(b.name)
    }
  })

  // const addDebt = useMutation({
  //   mutationFn: (payload: Partial<Debt>) => api.post('debts/', payload),
  //   onSuccess: (_r, variables) => {
  //     qc.invalidateQueries({ queryKey: ['customers'] })
  //     if (variables.customer) qc.invalidateQueries({ queryKey: ['customer-debts', variables.customer] })
  //   },
  // })

  const adjustDebt = useMutation({
    mutationFn: async ({ entityId, type, amount, note, isIncrease, override }: any) => {
      console.log('Raw amount parameter:', amount, 'Type:', typeof amount, 'Is Array:', Array.isArray(amount))
      // Ensure amount is a string, not an array
      const cleanAmount = Array.isArray(amount) ? amount[0] : amount
      const adjustmentAmount = isIncrease ? String(cleanAmount) : `-${cleanAmount}`
      const payload = type === 'customer' 
        ? { customer: entityId, company: null, amount: adjustmentAmount, note, override: override || false }
        : { company: entityId, customer: null, amount: adjustmentAmount, note, override: override || false }
      
      
      console.log('Sending debt adjustment payload:', payload)
      console.log('Payload amount type:', typeof payload.amount, 'Value:', payload.amount)
      return (await api.post('debts/', payload)).data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['companies'] })
    },
    onError: (error: any) => {
      console.error('Debt adjustment error:', error)
      console.error('Error response data:', error.response?.data)
      // The error will be available in adjustDebt.error for UI display
      // Don't close modal automatically - let the modal handle the error display
    }
  })

  // Credit check function
  const checkCustomerCredit = async (customerId: number) => {
    try {
      const response = await api.get(`check-customer-credit/${customerId}/`)
      return {
        canReceive: response.data.can_receive_new_debt,
        reason: response.data.reason
      }
    } catch (error) {
      console.error('Credit check failed:', error)
      return { canReceive: false, reason: 'Unable to check credit status' }
    }
  }

  const createCustomer = useMutation({
    mutationFn: async (args: { customer: Partial<Customer>; initialAmount?: string; note?: string; dueDays?: string; currency?: number }) => {
      const res = await api.post('customers/', args.customer)
      const newCustomer: Customer = res.data
      if (args.initialAmount && parseFloat(args.initialAmount) > 0) {
        // Convert days to date
        let dueDate = null
        if (args.dueDays && args.dueDays.trim()) {
          const days = parseInt(args.dueDays)
          if (!isNaN(days) && days > 0) {
            const futureDate = new Date()
            futureDate.setDate(futureDate.getDate() + days)
            dueDate = futureDate.toISOString().split('T')[0] // Format as YYYY-MM-DD
          }
        }
        
        await api.post('debts/', { 
          customer: newCustomer.id, 
          company: null, 
          amount: args.initialAmount, 
          currency: args.currency || 1, // Default to IQD (ID 1)
          note: args.note || '', 
          due_date: dueDate, 
          override: false 
        })
        // Invalidate queries after creating debt to refresh the customer's total_debt
        qc.invalidateQueries({ queryKey: ['customers'] })
      }
      return newCustomer
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      setShowForm(false)
    },
  })

  const deleteCustomer = useMutation({
    mutationFn: async (id: number) => api.delete(`customers/${id}/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
    }
  })


  // const deleteDebt = useMutation({
  //   mutationFn: (id: number) => api.delete(`debts/${id}/`),
  //   onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  // })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className={`text-xl sm:text-2xl font-display font-bold ${
          theme === 'dark' ? 'text-white' : 'text-slate-800'
        }`}>{t('navigation.customers')}</h2>
        <button
          onClick={() => setShowForm(!showForm)}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-sans font-medium hover:bg-blue-700 transition-all duration-200 hover:scale-105 shadow-lg flex items-center gap-2"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? t('buttons.cancel') : t('customer.addCustomer')}
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className={`absolute left-3.5 pointer-events-none ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`} size={18} style={{ top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder={t('search.customers')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-11 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans ${
                theme === 'dark'
                  ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-500'
              }`}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 border font-sans ${
              theme === 'dark'
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600 border-slate-600'
                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
            }`}
          >
            <Filter size={18} />
            <span className="hidden sm:inline">{t('filters.title')}</span>
          </button>
        </div>

         {showFilters && (
           <div className={`rounded-xl border p-4 ${
             theme === 'dark'
               ? 'bg-slate-800 border-slate-700'
               : 'bg-white border-slate-200'
           }`}>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
               <div>
                 <label className={`block text-sm font-sans font-medium mb-2 ${
                   theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                 }`}>{t('filters.debtRange')}</label>
                 <select
                   value={filters.debtRange}
                   onChange={(e) => setFilters(prev => ({ ...prev, debtRange: e.target.value }))}
                   className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans ${
                     theme === 'dark'
                       ? 'bg-slate-700 border-slate-600 text-white'
                       : 'bg-white border-slate-300 text-slate-900'
                   }`}
                 >
                  <option value="all">{t('filters.allDebts')}</option>
                  <option value="no-debt">{t('filters.noDebt')}</option>
                  <option value="low">{t('filters.low')}</option>
                  <option value="medium">{t('filters.medium')}</option>
                  <option value="high">{t('filters.high')}</option>
                </select>
              </div>

               <div>
                 <label className={`block text-sm font-sans font-medium mb-2 ${
                   theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                 }`}>{t('filters.reputation')}</label>
                 <select
                   value={filters.reputation}
                   onChange={(e) => setFilters(prev => ({ ...prev, reputation: e.target.value }))}
                   className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans ${
                     theme === 'dark'
                       ? 'bg-slate-700 border-slate-600 text-white'
                       : 'bg-white border-slate-300 text-slate-900'
                   }`}
                 >
                  <option value="all">{t('filters.allReputations')}</option>
                  <option value="excellent">{t('filters.excellent')}</option>
                  <option value="good">{t('filters.good')}</option>
                  <option value="fair">{t('filters.fair')}</option>
                  <option value="poor">{t('filters.poor')}</option>
                  <option value="bad">{t('filters.bad')}</option>
                </select>
              </div>

               <div>
                 <label className={`block text-sm font-sans font-medium mb-2 ${
                   theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                 }`}>{t('filters.paymentStatus')}</label>
                 <select
                   value={filters.paymentStatus}
                   onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
                   className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans ${
                     theme === 'dark'
                       ? 'bg-slate-700 border-slate-600 text-white'
                       : 'bg-white border-slate-300 text-slate-900'
                   }`}
                 >
                  <option value="all">{t('filters.allStatus')}</option>
                  <option value="paid-recently">{t('filters.paidRecently')}</option>
                  <option value="overdue">{t('filters.overdue')}</option>
                  <option value="no-payments">{t('filters.noPayments')}</option>
                </select>
              </div>

               <div>
                 <label className={`block text-sm font-sans font-medium mb-2 ${
                   theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                 }`}>{t('filters.sortBy')}</label>
                 <select
                   value={filters.sortBy}
                   onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                   className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans ${
                     theme === 'dark'
                       ? 'bg-slate-700 border-slate-600 text-white'
                       : 'bg-white border-slate-300 text-slate-900'
                   }`}
                 >
                  <option value="name">{t('filters.name')}</option>
                  <option value="debt">{t('filters.debtAmount')}</option>
                  <option value="reputation">{t('filters.reputation')}</option>
                  <option value="created">{t('filters.createdDate')}</option>
                </select>
              </div>
            </div>
            
            <div className={`flex justify-between items-center mt-4 pt-4 border-t ${
              theme === 'dark' ? 'border-slate-600' : 'border-slate-200'
            }`}>
              <span className={`text-sm font-sans ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Showing {filtered.length} of {customers.length} customers
              </span>
              <button
                onClick={() => setFilters({
                  debtRange: 'all',
                  reputation: 'all',
                  paymentStatus: 'all',
                  sortBy: 'created'
                })}
                className={`px-3 py-1 text-sm rounded-xl transition-all duration-200 font-sans ${
                  theme === 'dark'
                    ? 'text-slate-400 bg-slate-700 hover:bg-slate-600'
                    : 'text-slate-600 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {t('filters.clearFilters')}
              </button>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <div className={`rounded-xl p-6 shadow-lg border ${
          theme === 'dark' 
            ? 'bg-slate-800 border-slate-700' 
            : 'bg-white border-slate-200'
        }`}>
          <EntityForm
            onSubmit={(data) => createCustomer.mutate(data)}
            buttonText="Add Customer"
            entityType="customer"
            isLoading={createCustomer.isPending}
            error={(createCustomer.error as any)?.response?.data?.name?.[0] || 
                   (createCustomer.error as any)?.response?.data?.phone?.[0] || 
                   (createCustomer.error as any)?.response?.data?.detail || 
                   createCustomer.error?.message}
          />
        </div>
      )}

      <div className="space-y-4">
         {filtered.map((c: Customer) => (
           <EntityCard
             key={c.id}
             entity={c}
             onAdjustDebt={(amount, note, isIncrease, override) => adjustDebt.mutate({ entityId: c.id, type: 'customer', amount, note, isIncrease, override: override || false })}
             type="customer"
             onDeleteEntity={() => deleteCustomer.mutate(c.id)}
             debtError={adjustDebt.error?.response?.data?.amount?.[0] || adjustDebt.error?.response?.data?.detail || adjustDebt.error?.message}
             isDebtLoading={adjustDebt.isPending}
             isDebtSuccess={adjustDebt.isSuccess}
             onCheckCredit={checkCustomerCredit}
           />
         ))}
         {filtered.length === 0 && (
           <div className={`col-span-full rounded-xl p-12 text-center shadow-lg ${
             theme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white'
           }`}>
             <p className={`font-sans ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>No customers found</p>
           </div>
         )}
       </div>
    </div>
  )
}

function CompaniesPage() {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    debtRange: 'all', // all, no-debt, low, medium, high
    dueDate: 'all', // all, overdue, due-soon, no-due-date
    sortBy: 'created' // name, debt, due-date, created
  })
  const qc = useQueryClient()
  const { theme } = useTheme()
  const { t } = useLanguage()
  const { data } = useQuery({ queryKey: ['companies'], queryFn: async () => (await api.get('companies/')).data })
  const companies = data?.results || []

  // Apply filters
  const filtered = companies.filter((c: Company) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.address.toLowerCase().includes(search.toLowerCase())
    
    if (!matchesSearch) return false

    const debt = parseFloat(c.total_debt || '0')
    
    // Debt range filter
    if (filters.debtRange !== 'all') {
      switch (filters.debtRange) {
        case 'no-debt':
          if (debt > 0) return false
          break
        case 'low':
          if (debt <= 0 || debt > 1000) return false
          break
        case 'medium':
          if (debt <= 1000 || debt > 5000) return false
          break
        case 'high':
          if (debt <= 5000) return false
          break
      }
    }

    // Due date filter
    if (filters.dueDate !== 'all') {
      if (!c.earliest_due_date) {
        if (filters.dueDate !== 'no-due-date') return false
      } else {
        const dueDate = new Date(c.earliest_due_date)
        const today = new Date()
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        switch (filters.dueDate) {
          case 'overdue':
            if (daysUntilDue >= 0) return false
            break
          case 'due-soon':
            if (daysUntilDue < 0 || daysUntilDue > 7) return false
            break
          case 'no-due-date':
            return false
        }
      }
    }

    return true
  }).sort((a: Company, b: Company) => {
    switch (filters.sortBy) {
      case 'debt':
        return parseFloat(b.total_debt || '0') - parseFloat(a.total_debt || '0')
      case 'due-date':
        if (!a.earliest_due_date && !b.earliest_due_date) return 0
        if (!a.earliest_due_date) return 1
        if (!b.earliest_due_date) return -1
        return new Date(a.earliest_due_date).getTime() - new Date(b.earliest_due_date).getTime()
      case 'created':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      default:
        return a.name.localeCompare(b.name)
    }
  })

  // const addDebt = useMutation({
  //   mutationFn: (payload: Partial<Debt>) => api.post('debts/', payload),
  //   onSuccess: (_r, variables) => {
  //     qc.invalidateQueries({ queryKey: ['companies'] })
  //     if (variables.company) qc.invalidateQueries({ queryKey: ['company-debts', variables.company] })
  //   },
  // })

  const adjustDebt = useMutation({
    mutationFn: async ({ entityId, type, amount, note, isIncrease, override }: any) => {
      console.log('Raw amount parameter:', amount, 'Type:', typeof amount, 'Is Array:', Array.isArray(amount))
      // Ensure amount is a string, not an array
      const cleanAmount = Array.isArray(amount) ? amount[0] : amount
      const adjustmentAmount = isIncrease ? String(cleanAmount) : `-${cleanAmount}`
      const payload = type === 'customer' 
        ? { customer: entityId, company: null, amount: adjustmentAmount, note, override: override || false }
        : { company: entityId, customer: null, amount: adjustmentAmount, note, override: override || false }
      
      
      console.log('Sending debt adjustment payload:', payload)
      console.log('Payload amount type:', typeof payload.amount, 'Value:', payload.amount)
      return (await api.post('debts/', payload)).data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['companies'] })
    },
    onError: (error: any) => {
      console.error('Debt adjustment error:', error)
      console.error('Error response data:', error.response?.data)
      // The error will be available in adjustDebt.error for UI display
      // Don't close modal automatically - let the modal handle the error display
    }
  })

  const createCompany = useMutation({
    mutationFn: async (args: { company: Partial<Company>; initialAmount?: string; note?: string; dueDays?: string; currency?: number }) => {
      console.log('Creating company with args:', args)
      const res = await api.post('companies/', args.company)
      console.log('Company created successfully:', res.data)
      const newCompany: Company = res.data
      if (args.initialAmount && parseFloat(args.initialAmount) > 0) {
        // Convert days to date
        let dueDate = null
        if (args.dueDays && args.dueDays.trim()) {
          const days = parseInt(args.dueDays)
          if (!isNaN(days) && days > 0) {
            const futureDate = new Date()
            futureDate.setDate(futureDate.getDate() + days)
            dueDate = futureDate.toISOString().split('T')[0] // Format as YYYY-MM-DD
          }
        }
        
        console.log('Creating initial debt for company:', { company: newCompany.id, amount: args.initialAmount, currency: args.currency, due_date: dueDate })
        await api.post('debts/', { 
          company: newCompany.id, 
          customer: null, 
          amount: args.initialAmount, 
          currency: args.currency || 1, // Default to IQD (ID 1)
          note: args.note || '', 
          due_date: dueDate, 
          override: false 
        })
      }
      return newCompany
    },
    onSuccess: () => {
      console.log('Company creation successful, invalidating queries')
      qc.invalidateQueries({ queryKey: ['companies'] })
      setShowForm(false)
    },
    onError: (error) => {
      console.error('Company creation error:', error)
    }
  })

  // const deleteDebt = useMutation({
  //   mutationFn: (id: number) => api.delete(`debts/${id}/`),
  //   onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  // })

  const deleteCompany = useMutation({
    mutationFn: async (id: number) => api.delete(`companies/${id}/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] })
    }
  })


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className={`text-xl sm:text-2xl font-display font-bold ${
          theme === 'dark' ? 'text-white' : 'text-slate-800'
        }`}>{t('navigation.companies')}</h2>
        <button
          onClick={() => setShowForm(!showForm)}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-sans font-medium hover:bg-blue-700 transition-all duration-200 hover:scale-105 shadow-lg flex items-center gap-2"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? t('buttons.cancel') : t('company.addCompany')}
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className={`absolute left-3.5 pointer-events-none ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`} size={18} style={{ top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder={t('search.companies')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-11 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans ${
                theme === 'dark'
                  ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-500'
              }`}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 border font-sans ${
              theme === 'dark'
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600 border-slate-600'
                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
            }`}
          >
            <Filter size={18} />
            <span className="hidden sm:inline">{t('filters.title')}</span>
          </button>
        </div>

         {showFilters && (
           <div className={`rounded-xl border p-4 ${
             theme === 'dark'
               ? 'bg-slate-800 border-slate-700'
               : 'bg-white border-slate-200'
           }`}>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
               <div>
                 <label className={`block text-sm font-sans font-medium mb-2 ${
                   theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                 }`}>{t('filters.debtRange')}</label>
                 <select
                   value={filters.debtRange}
                   onChange={(e) => setFilters(prev => ({ ...prev, debtRange: e.target.value }))}
                   className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans ${
                     theme === 'dark'
                       ? 'bg-slate-700 border-slate-600 text-white'
                       : 'bg-white border-slate-300 text-slate-900'
                   }`}
                 >
                  <option value="all">{t('filters.allDebts')}</option>
                  <option value="no-debt">{t('filters.noDebt')}</option>
                  <option value="low">{t('filters.low')}</option>
                  <option value="medium">{t('filters.medium')}</option>
                  <option value="high">{t('filters.high')}</option>
                </select>
              </div>

               <div>
                 <label className={`block text-sm font-sans font-medium mb-2 ${
                   theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                 }`}>{t('filters.dueDate')}</label>
                 <select
                   value={filters.dueDate}
                   onChange={(e) => setFilters(prev => ({ ...prev, dueDate: e.target.value }))}
                   className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans ${
                     theme === 'dark'
                       ? 'bg-slate-700 border-slate-600 text-white'
                       : 'bg-white border-slate-300 text-slate-900'
                   }`}
                 >
                  <option value="all">{t('filters.allDueDates')}</option>
                  <option value="overdue">{t('filters.overdue')}</option>
                  <option value="due-soon">{t('filters.dueSoon')}</option>
                  <option value="no-due-date">{t('filters.noDueDate')}</option>
                </select>
              </div>

               <div>
                 <label className={`block text-sm font-sans font-medium mb-2 ${
                   theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                 }`}>{t('filters.sortBy')}</label>
                 <select
                   value={filters.sortBy}
                   onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                   className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans ${
                     theme === 'dark'
                       ? 'bg-slate-700 border-slate-600 text-white'
                       : 'bg-white border-slate-300 text-slate-900'
                   }`}
                 >
                  <option value="name">{t('filters.name')}</option>
                  <option value="debt">{t('filters.debtAmount')}</option>
                  <option value="due-date">{t('filters.dueDate')}</option>
                  <option value="created">{t('filters.createdDate')}</option>
                </select>
              </div>
            </div>
            
            <div className={`flex justify-between items-center mt-4 pt-4 border-t ${
              theme === 'dark' ? 'border-slate-600' : 'border-slate-200'
            }`}>
              <span className={`text-sm font-sans ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Showing {filtered.length} of {companies.length} companies
              </span>
              <button
                onClick={() => setFilters({
                  debtRange: 'all',
                  dueDate: 'all',
                  sortBy: 'created'
                })}
                className={`px-3 py-1 text-sm rounded-xl transition-all duration-200 font-sans ${
                  theme === 'dark'
                    ? 'text-slate-400 bg-slate-700 hover:bg-slate-600'
                    : 'text-slate-600 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {t('filters.clearFilters')}
              </button>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <div className={`rounded-xl p-6 shadow-lg border ${
          theme === 'dark' 
            ? 'bg-slate-800 border-slate-700' 
            : 'bg-white border-slate-200'
        }`}>
          <EntityForm
            onSubmit={(data) => createCompany.mutate(data)}
            buttonText="Add Company"
            entityType="company"
            isLoading={createCompany.isPending}
            error={(createCompany.error as any)?.response?.data?.name?.[0] || 
                   (createCompany.error as any)?.response?.data?.phone?.[0] || 
                   (createCompany.error as any)?.response?.data?.detail || 
                   createCompany.error?.message}
          />
        </div>
      )}

      <div className="space-y-4">
         {filtered.map((c: Company) => (
           <EntityCard
             key={c.id}
             entity={c}
             onAdjustDebt={(amount, note, isIncrease, override) => adjustDebt.mutate({ entityId: c.id, type: 'company', amount, note, isIncrease, override: override || false })}
             type="company"
             debtError={adjustDebt.error?.response?.data?.amount?.[0] || adjustDebt.error?.response?.data?.detail || adjustDebt.error?.message}
             isDebtLoading={adjustDebt.isPending}
             isDebtSuccess={adjustDebt.isSuccess}
             onDeleteEntity={() => deleteCompany.mutate(c.id)}
           />
         ))}
         {filtered.length === 0 && (
           <div className={`col-span-full rounded-xl p-12 text-center shadow-lg ${
             theme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white'
           }`}>
             <p className={`font-sans ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>No companies found</p>
           </div>
         )}
       </div>
    </div>
  )
}





export default App