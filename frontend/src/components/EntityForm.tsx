import React, { useCallback } from 'react'
import { User, Phone, MapPin, DollarSign, Calendar, FileText, AlertCircle } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useFormValidation, commonRules } from '../hooks/useFormValidation'
import { useQuery } from '@tanstack/react-query'
import { api, type Currency } from '../api'

interface EntityFormProps {
  onSubmit: (data: any) => void
  buttonText: string
  entityType?: 'customer' | 'company'
  isLoading?: boolean
  error?: string | null
}

interface InputWithIconProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  type?: string
  step?: string
  min?: string
  max?: string
  required?: boolean
  className?: string
  icon: React.ReactNode
  label: string
  error?: string | null
  touched?: boolean
}

interface CurrencyInputProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  required?: boolean
  className?: string
  icon: React.ReactNode
  label: string
  error?: string | null
  touched?: boolean
  currency: number
  onCurrencyChange: (currency: number) => void
  currencies: Currency[]
  getCurrencyTranslation: (code: string) => string
  isRTL: boolean
}

const InputWithIcon: React.FC<InputWithIconProps> = ({
  value,
  onChange,
  onBlur,
  placeholder,
  type = 'text',
  step,
  min,
  max,
  required = false,
  className = '',
  icon,
  label,
  error,
  touched = false
}) => {
  const { theme } = useTheme()
  const showError = touched && error

  return (
    <div>
      <label className={`flex items-center gap-2 text-sm font-medium mb-1 ${
        theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
      }`}>
        <div className={`${
          theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
        }`}>
          {icon}
        </div>
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        step={step}
        min={min}
        max={max}
        required={required}
        className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${className} ${
          showError
            ? 'border-red-500 focus:ring-red-500'
            : 'focus:ring-blue-500'
        } ${
          theme === 'dark' 
            ? `bg-slate-700 ${showError ? 'border-red-500' : 'border-slate-600'} text-white placeholder-slate-400` 
            : `bg-slate-50 ${showError ? 'border-red-500' : 'border-slate-200'} text-slate-900`
        }`}
      />
      {showError && (
        <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  className = '',
  icon,
  label,
  error,
  touched = false,
  currency,
  onCurrencyChange,
  currencies,
  getCurrencyTranslation,
  isRTL
}) => {
  const { theme } = useTheme()
  const showError = touched && error

  return (
    <div>
      <label className={`flex items-center gap-2 text-sm font-medium mb-1 ${
        theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
      }`}>
        <div className={`${
          theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
        }`}>
          {icon}
        </div>
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex flex-col sm:flex-row">
        <input
          type="number"
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          className={`flex-1 px-3 py-2.5 border ${
            isRTL ? 'sm:rounded-r-lg sm:border-r-0 rounded-lg border' : 'sm:rounded-l-lg sm:border-l-0 rounded-lg border'
          } focus:outline-none focus:ring-2 transition-colors ${className} ${
            showError
              ? 'border-red-500 focus:ring-red-500'
              : 'focus:ring-blue-500'
          } ${
            theme === 'dark' 
              ? `bg-slate-700 ${showError ? 'border-red-500' : 'border-slate-600'} text-white placeholder-slate-400` 
              : `bg-slate-50 ${showError ? 'border-red-500' : 'border-slate-200'} text-slate-900`
          }`}
        />
        <div className={`flex items-center mt-2 sm:mt-0 ${
          isRTL ? 'sm:rounded-l-lg sm:border-l sm:border-r-0 rounded-lg border' : 'sm:rounded-r-lg sm:border-r sm:border-l-0 rounded-lg border'
        } ${
          theme === 'dark' 
            ? 'bg-slate-700 border-slate-600' 
            : 'bg-slate-50 border-slate-200'
        } ${showError ? 'border-red-500' : ''}`}>
          <select
            value={currency}
            onChange={(e) => onCurrencyChange(parseInt(e.target.value))}
            className={`text-sm font-semibold border-none outline-none cursor-pointer w-full sm:min-w-[80px] px-3 py-2.5 ${
              theme === 'dark' 
                ? 'bg-transparent text-slate-100 hover:bg-slate-600' 
                : 'bg-transparent text-slate-800 hover:bg-slate-100'
            } transition-all duration-200 focus:ring-2 focus:ring-blue-500`}
            style={{ 
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23${theme === 'dark' ? 'cbd5e1' : '475569'}' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: isRTL ? 'left 0.75rem center' : 'right 0.75rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '0.875rem 0.875rem',
              paddingLeft: isRTL ? '2.5rem' : '0.75rem',
              paddingRight: isRTL ? '0.75rem' : '2.5rem',
              textAlign: isRTL ? 'right' : 'left'
            }}
          >
            {currencies.length > 0 ? (
              currencies.map((curr) => (
                <option 
                  key={curr.id} 
                  value={curr.id}
                  className={`${
                    theme === 'dark' 
                      ? 'bg-slate-800 text-slate-100 hover:bg-slate-700' 
                      : 'bg-white text-slate-900 hover:bg-slate-50'
                  } py-2 px-3`}
                  style={{ textAlign: isRTL ? 'right' : 'left' }}
                >
                  {getCurrencyTranslation(curr.code)}
                </option>
              ))
            ) : (
              <option 
                value={1} 
                className={`${
                  theme === 'dark' 
                    ? 'bg-slate-800 text-slate-100 hover:bg-slate-700' 
                    : 'bg-white text-slate-900 hover:bg-slate-50'
                } py-2 px-3`}
                style={{ textAlign: isRTL ? 'right' : 'left' }}
              >
                {getCurrencyTranslation('IQD')}
              </option>
            )}
          </select>
        </div>
      </div>
      {showError && (
        <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

const EntityForm: React.FC<EntityFormProps> = ({ onSubmit, buttonText, entityType = 'customer', isLoading = false, error = null }) => {
  const { theme } = useTheme()
  const { t, isRTL } = useLanguage()

  // Function to get translated currency name
  const getCurrencyTranslation = useCallback((code: string) => {
    const currencyKey = code.toLowerCase()
    return t(`currency.${currencyKey}`) || code
  }, [t])

  // Fetch currencies from API
  const { data: currenciesData, isLoading: currenciesLoading, error: currenciesError } = useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      try {
        const response = await api.get('currencies/')
        console.log('Currencies API response:', response.data)
        // The API returns paginated data with results array
        return response.data.results || response.data
      } catch (error) {
        console.error('Error fetching currencies:', error)
        throw error
      }
    }
  })

  // Ensure currencies is always an array
  const currencies = Array.isArray(currenciesData) ? currenciesData : []
  
  // Currency state - default to IQD (ID 1)
  const [currency, setCurrency] = React.useState(1)
  
  // Debug logging
  console.log('Currencies data:', currenciesData)
  console.log('Currencies array:', currencies)
  console.log('Currencies loading:', currenciesLoading)
  console.log('Currencies error:', currenciesError)
  console.log('Currencies length:', currencies.length)
  console.log('Current currency value:', currency)

  // Define validation rules
  const validationRules = {
    name: commonRules.required('Name is required'),
    phone: commonRules.required('Phone number is required'),
    initialAmount: {
      required: true,
      message: 'Amount is required',
      custom: (value: string) => {
        const num = parseFloat(value)
        if (isNaN(num) || num <= 0) {
          return 'Amount must be a positive number'
        }
        return null
      }
    }
  }

  // Use form validation hook
  const {
    values,
    errors,
    touched,
    isValid,
    setValue,
    setTouched,
    validateForm,
    resetForm
  } = useFormValidation({
    name: '',
    phone: '',
    address: '',
    initialAmount: '',
    note: '',
    dueDays: ''
  }, validationRules)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form before submission
    if (!validateForm()) {
      console.log('Form validation failed')
      return
    }

    const entityData = { 
      name: values.name, 
      phone: values.phone, 
      address: values.address 
    }
    
    onSubmit({ 
      [entityType]: entityData, 
      initialAmount: values.initialAmount, 
      currency: currency,
      note: values.note, 
      dueDays: values.dueDays 
    })
    
    // Reset form after successful submission
    resetForm()
    setCurrency(1) // Reset currency to IQD (ID 1)
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className={`p-4 rounded-lg border ${
          theme === 'dark' 
            ? 'bg-red-900/20 border-red-700 text-red-300' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            <AlertCircle size={20} />
            <span className="font-medium">Error</span>
          </div>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <InputWithIcon
        value={values.name}
        onChange={(value) => setValue('name', value)}
        onBlur={() => setTouched('name', true)}
        required
        icon={<User size={20} />}
        label={t('customer.name')}
        error={errors.name}
        touched={touched.name}
      />
      <InputWithIcon
        value={values.phone}
        onChange={(value) => setValue('phone', value)}
        onBlur={() => setTouched('phone', true)}
        required
        icon={<Phone size={20} />}
        label={t('customer.phone')}
        error={errors.phone}
        touched={touched.phone}
      />
      <InputWithIcon
        value={values.address}
        onChange={(value) => setValue('address', value)}
        onBlur={() => setTouched('address', true)}
        icon={<MapPin size={20} />}
        label={t('customer.address')}
        error={errors.address}
        touched={touched.address}
      />
      <CurrencyInput
        value={values.initialAmount}
        onChange={(value) => setValue('initialAmount', value)}
        onBlur={() => setTouched('initialAmount', true)}
        required
        icon={<DollarSign size={20} />}
        label={t('debt.amount')}
        error={errors.initialAmount}
        touched={touched.initialAmount}
        currency={currency}
        onCurrencyChange={setCurrency}
        currencies={currencies}
        getCurrencyTranslation={getCurrencyTranslation}
        isRTL={isRTL}
      />
      {currenciesError && (
        <div className={`text-sm ${
          theme === 'dark' ? 'text-red-400' : 'text-red-600'
        }`}>
          Error loading currencies: {currenciesError.message}
        </div>
      )}
      {currenciesLoading && (
        <div className={`text-sm ${
          theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
        }`}>
          Loading currencies...
        </div>
      )}
      {!currenciesLoading && !currenciesError && currencies.length === 0 && (
        <div className={`text-sm ${
          theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
        }`}>
          No currencies available. Using default (IQD).
        </div>
      )}
      <div>
        <InputWithIcon
          type="number"
          min="1"
          max="365"
          value={values.dueDays}
          onChange={(value) => setValue('dueDays', value)}
          onBlur={() => setTouched('dueDays', true)}
          placeholder="e.g., 10"
          icon={<Calendar size={20} />}
          label={t('debt.daysToPay')}
          error={errors.dueDays}
          touched={touched.dueDays}
        />
        <p className={`text-xs mt-1 ${
          theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
        }`}>
          Number of days until payment is due
        </p>
      </div>
      <InputWithIcon
        value={values.note}
        onChange={(value) => setValue('note', value)}
        onBlur={() => setTouched('note', true)}
        icon={<FileText size={20} />}
        label={t('debt.note')}
        error={errors.note}
        touched={touched.note}
      />
      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={!isValid || isLoading}
          className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
            isValid && !isLoading
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-400 text-gray-200 cursor-not-allowed'
          }`}
        >
          {isLoading ? 'Creating...' : buttonText}
        </button>
        {!isValid && (
          <p className={`text-sm mt-2 text-center ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
          }`}>
            Please fill in all required fields correctly
          </p>
        )}
      </div>
      </form>
    </div>
  )
}

export default EntityForm
