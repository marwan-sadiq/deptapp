import React, { useState } from 'react'
import { User, Phone, MapPin, DollarSign, Calendar, FileText, AlertCircle, ChevronDown } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useLanguage } from '../contexts/LanguageContext'
import { getCurrencySymbol, convertToArabicNumerals } from '../api'

interface EntityFormProps {
  onSubmit: (data: any) => void
  buttonText: string
  entityType?: 'customer' | 'company'
}

interface InputWithIconProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  step?: string
  min?: string
  max?: string
  required?: boolean
  className?: string
  icon: React.ReactNode
  label: string
  error?: string
}

const InputWithIcon: React.FC<InputWithIconProps> = ({
  value,
  onChange,
  placeholder,
  type = 'text',
  step,
  min,
  max,
  required = false,
  className = '',
  icon,
  label,
  error
}) => {
  const { theme } = useTheme()

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
        placeholder={placeholder}
        step={step}
        min={min}
        max={max}
        required={required}
        className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${className} ${
          error
            ? 'border-red-500 focus:ring-red-500'
            : theme === 'dark' 
            ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
            : 'bg-slate-50 border-slate-200 text-slate-900'
        }`}
      />
      {error && (
        <div className="flex items-center gap-1 mt-1">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  )
}

// Currency dropdown component
const CurrencyDropdown: React.FC<{
  value: 'USD' | 'IQD'
  onChange: (value: 'USD' | 'IQD') => void
  error?: string
}> = ({ value, onChange, error }) => {
  const { theme } = useTheme()
  const { language } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: getCurrencySymbol('USD', language) },
    { code: 'IQD', name: 'Iraqi Dinar', symbol: getCurrencySymbol('IQD', language) }
  ]

  const selectedCurrency = currencies.find(c => c.code === value)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between ${
          error
            ? 'border-red-500 focus:ring-red-500'
            : theme === 'dark' 
            ? 'bg-slate-700 border-slate-600 text-white' 
            : 'bg-slate-50 border-slate-200 text-slate-900'
        }`}
      >
        <span className="flex items-center gap-2">
          <span className="text-lg">{selectedCurrency?.symbol}</span>
          <span className="text-sm">{selectedCurrency?.code}</span>
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className={`absolute top-full left-0 right-0 z-10 mt-1 rounded-lg shadow-lg border ${
          theme === 'dark' 
            ? 'bg-slate-700 border-slate-600' 
            : 'bg-white border-slate-200'
        }`}>
          {currencies.map((currency) => (
            <button
              key={currency.code}
              type="button"
              onClick={() => {
                onChange(currency.code as 'USD' | 'IQD')
                setIsOpen(false)
              }}
              className={`w-full px-3 py-2 text-left hover:bg-blue-50 dark:hover:bg-slate-600 flex items-center gap-2 ${
                value === currency.code 
                  ? 'bg-blue-100 dark:bg-slate-600' 
                  : ''
              }`}
            >
              <span className="text-lg">{currency.symbol}</span>
              <span className="text-sm">{currency.code}</span>
              <span className={`text-xs ml-auto ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}>
                {currency.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const EntityForm: React.FC<EntityFormProps> = ({ onSubmit, buttonText, entityType = 'customer' }) => {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [initialAmount, setInitialAmount] = useState('')
  const [currency, setCurrency] = useState<'USD' | 'IQD'>('USD')
  const [note, setNote] = useState('')
  const [dueDays, setDueDays] = useState('')
  
  // Validation states
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { theme } = useTheme()
  const { t, language } = useLanguage()

  // Validation functions
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}
    
    // Name is required
    if (!name.trim()) {
      newErrors.name = 'Name is required'
    }
    
    // Phone is required
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^[\+]?[0-9\s\-\(\)]{7,}$/.test(phone.trim())) {
      newErrors.phone = 'Please enter a valid phone number'
    }
    
    // Amount is required
    if (!initialAmount.trim()) {
      newErrors.initialAmount = 'Amount is required'
    } else {
      const amount = parseFloat(initialAmount)
      if (isNaN(amount) || amount <= 0) {
        newErrors.initialAmount = 'Please enter a valid amount greater than 0'
      }
    }
    
    // Due days validation (if provided)
    if (dueDays.trim()) {
      const days = parseInt(dueDays)
      if (isNaN(days) || days < 1 || days > 365) {
        newErrors.dueDays = 'Due days must be between 1 and 365'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Clear errors when input changes
  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const entityData = { name: name.trim(), phone: phone.trim(), address: address.trim() }
      await onSubmit({ 
        [entityType]: entityData, 
        initialAmount: initialAmount.trim(), 
        currency: currency,
        note: note.trim(), 
        dueDays: dueDays.trim() 
      })
      
      // Reset form on success
      setName('')
      setPhone('')
      setAddress('')
      setInitialAmount('')
      setCurrency('USD')
      setNote('')
      setDueDays('')
      setErrors({})
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <InputWithIcon
        value={name}
        onChange={(value) => {
          setName(value)
          clearError('name')
        }}
        required
        icon={<User size={20} />}
        label={t('customer.name')}
        error={errors.name}
      />
      <InputWithIcon
        value={phone}
        onChange={(value) => {
          setPhone(value)
          clearError('phone')
        }}
        required
        icon={<Phone size={20} />}
        label={t('customer.phone')}
        error={errors.phone}
        placeholder="e.g., +1234567890"
      />
      <InputWithIcon
        value={address}
        onChange={(value) => {
          setAddress(value)
          clearError('address')
        }}
        icon={<MapPin size={20} />}
        label={t('customer.address')}
        error={errors.address}
        placeholder="Optional address"
      />
      <div>
        <label className={`flex items-center gap-2 text-sm font-medium mb-1 ${
          theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
        }`}>
          <div className={`${
            theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
          }`}>
            <DollarSign size={20} />
          </div>
          {t('debt.amount')}
          <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            step="0.01"
            value={initialAmount}
            onChange={(e) => {
              setInitialAmount(e.target.value)
              clearError('initialAmount')
            }}
            required
            className={`flex-1 px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.initialAmount
                ? 'border-red-500 focus:ring-red-500'
                : theme === 'dark' 
                ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}
            placeholder={(language === 'ar' || language === 'ku') ? convertToArabicNumerals('0.00') : '0.00'}
          />
          <div className="w-24">
            <CurrencyDropdown
              value={currency}
              onChange={(value) => {
                setCurrency(value)
                clearError('currency')
              }}
              error={errors.currency}
            />
          </div>
        </div>
        {errors.initialAmount && (
          <div className="flex items-center gap-1 mt-1">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-sm text-red-600 dark:text-red-400">{errors.initialAmount}</p>
          </div>
        )}
        {errors.currency && (
          <div className="flex items-center gap-1 mt-1">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-sm text-red-600 dark:text-red-400">{errors.currency}</p>
          </div>
        )}
      </div>
      <div>
        <InputWithIcon
          type="number"
          min="1"
          max="365"
          value={dueDays}
          onChange={(value) => {
            setDueDays(value)
            clearError('dueDays')
          }}
          placeholder="e.g., 10"
          icon={<Calendar size={20} />}
          label={t('debt.daysToPay')}
          error={errors.dueDays}
        />
        <p className={`text-xs mt-1 ${
          theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
        }`}>
          Number of days until payment is due (optional)
        </p>
      </div>
      <InputWithIcon
        value={note}
        onChange={(value) => {
          setNote(value)
          clearError('note')
        }}
        icon={<FileText size={20} />}
        label={t('debt.note')}
        error={errors.note}
        placeholder="Optional note"
      />
      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
            isSubmitting
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {entityType === 'customer' ? 'Adding Customer...' : 'Adding Company...'}
            </>
          ) : (
            buttonText
          )}
        </button>
      </div>
    </form>
  )
}

export default EntityForm
