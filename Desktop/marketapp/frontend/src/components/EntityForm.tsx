import React, { useState } from 'react'
import { User, Phone, MapPin, DollarSign, Calendar, FileText } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useLanguage } from '../contexts/LanguageContext'

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
  label
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
          theme === 'dark' 
            ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
            : 'bg-slate-50 border-slate-200 text-slate-900'
        }`}
      />
    </div>
  )
}

const EntityForm: React.FC<EntityFormProps> = ({ onSubmit, buttonText, entityType = 'customer' }) => {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [initialAmount, setInitialAmount] = useState('')
  const [note, setNote] = useState('')
  const [dueDays, setDueDays] = useState('')
  const { theme } = useTheme()
  const { t } = useLanguage()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const entityData = { name, phone, address }
    onSubmit({ 
      [entityType]: entityData, 
      initialAmount, 
      note, 
      dueDays 
    })
    setName('')
    setPhone('')
    setAddress('')
    setInitialAmount('')
    setNote('')
    setDueDays('')
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <InputWithIcon
        value={name}
        onChange={setName}
        required
        icon={<User size={20} />}
        label={t('customer.name')}
      />
      <InputWithIcon
        value={phone}
        onChange={setPhone}
        icon={<Phone size={20} />}
        label={t('customer.phone')}
      />
      <InputWithIcon
        value={address}
        onChange={setAddress}
        icon={<MapPin size={20} />}
        label={t('customer.address')}
      />
      <InputWithIcon
        type="number"
        step="0.01"
        value={initialAmount}
        onChange={setInitialAmount}
        icon={<DollarSign size={20} />}
        label={t('debt.amount')}
      />
      <div>
        <InputWithIcon
          type="number"
          min="1"
          max="365"
          value={dueDays}
          onChange={setDueDays}
          placeholder="e.g., 10"
          icon={<Calendar size={20} />}
          label={t('debt.daysToPay')}
        />
        <p className={`text-xs mt-1 ${
          theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
        }`}>
          Number of days until payment is due
        </p>
      </div>
      <InputWithIcon
        value={note}
        onChange={setNote}
        icon={<FileText size={20} />}
        label={t('debt.note')}
      />
      <div className="md:col-span-2">
        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          {buttonText}
        </button>
      </div>
    </form>
  )
}

export default EntityForm
