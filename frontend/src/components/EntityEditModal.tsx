import React, { useState, useEffect, useCallback } from 'react'
import { X, User, Phone, MapPin, AlertCircle } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useFormValidation, commonRules } from '../hooks/useFormValidation'
import { type Customer, type Company } from '../api'

interface EntityEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  entity: Customer | Company | null
  type: 'customer' | 'company'
  isLoading?: boolean
  error?: string | null
}

interface InputWithIconProps {
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
}

const InputWithIcon: React.FC<InputWithIconProps> = ({
  value,
  onChange,
  onBlur,
  placeholder,
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
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
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

const EntityEditModal: React.FC<EntityEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  entity,
  type,
  isLoading = false,
  error = null
}) => {
  const { theme } = useTheme()
  const { t } = useLanguage()

  // Define validation rules
  const validationRules = {
    name: commonRules.required('Name is required'),
    phone: commonRules.required('Phone number is required')
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
    address: ''
  }, validationRules)

  // Update form values when entity changes
  useEffect(() => {
    if (entity) {
      setValue('name', entity.name || '')
      setValue('phone', entity.phone || '')
      setValue('address', entity.address || '')
    }
  }, [entity, setValue])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form before submission
    if (!validateForm()) {
      return
    }

    const entityData = { 
      name: values.name, 
      phone: values.phone, 
      address: values.address 
    }
    
    onSave(entityData)
  }

  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [resetForm, onClose])

  if (!isOpen || !entity) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto ${
        theme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
      }`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-xl font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-slate-800'
            }`}>
              {t('buttons.edit')} {type === 'customer' ? t('navigation.customers') : t('navigation.companies')}
            </h3>
            <button
              onClick={handleClose}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark' 
                  ? 'hover:bg-slate-700 text-slate-400 hover:text-slate-300' 
                  : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'
              }`}
            >
              <X size={20} />
            </button>
          </div>

          {error && (
            <div className={`p-4 rounded-lg border mb-6 ${
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
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <InputWithIcon
              value={values.name}
              onChange={(value) => setValue('name', value)}
              onBlur={() => setTouched('name', true)}
              required
              icon={<User size={20} />}
              label={type === 'customer' ? t('customer.name') : t('company.name')}
              error={errors.name}
              touched={touched.name}
            />
            <InputWithIcon
              value={values.phone}
              onChange={(value) => setValue('phone', value)}
              onBlur={() => setTouched('phone', true)}
              required
              icon={<Phone size={20} />}
              label={type === 'customer' ? t('customer.phone') : t('company.phone')}
              error={errors.phone}
              touched={touched.phone}
            />
            <InputWithIcon
              value={values.address}
              onChange={(value) => setValue('address', value)}
              onBlur={() => setTouched('address', true)}
              icon={<MapPin size={20} />}
              label={type === 'customer' ? t('customer.address') : t('company.address')}
              error={errors.address}
              touched={touched.address}
            />

            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={handleClose}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t('buttons.cancel')}
              </button>
              <button
                type="submit"
                disabled={!isValid || isLoading}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isValid && !isLoading
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                }`}
              >
                {isLoading ? t('buttons.saving') : t('buttons.save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EntityEditModal
