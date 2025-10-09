import { useState, useCallback, useMemo } from 'react'

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: string) => string | null
  message?: string
}

export interface ValidationRules {
  [key: string]: ValidationRule
}

export interface FormErrors {
  [key: string]: string | null
}

export interface FormTouched {
  [key: string]: boolean
}

export interface UseFormValidationReturn {
  values: Record<string, string>
  errors: FormErrors
  touched: FormTouched
  isValid: boolean
  setValue: (field: string, value: string) => void
  setTouched: (field: string, touched: boolean) => void
  validateField: (field: string) => void
  validateForm: () => boolean
  resetForm: () => void
  setFieldError: (field: string, error: string | null) => void
  clearErrors: () => void
}

export const useFormValidation = (
  initialValues: Record<string, string> = {},
  rules: ValidationRules = {}
): UseFormValidationReturn => {
  const [values, setValues] = useState<Record<string, string>>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<FormTouched>({})

  const validateField = useCallback((field: string) => {
    const value = values[field] || ''
    const rule = rules[field]
    
    if (!rule) return

    let error: string | null = null

    // Required validation
    if (rule.required && !value.trim()) {
      error = rule.message || `${field} is required`
    }
    // Min length validation
    else if (rule.minLength && value.length < rule.minLength) {
      error = rule.message || `${field} must be at least ${rule.minLength} characters`
    }
    // Max length validation
    else if (rule.maxLength && value.length > rule.maxLength) {
      error = rule.message || `${field} must be no more than ${rule.maxLength} characters`
    }
    // Pattern validation
    else if (rule.pattern && !rule.pattern.test(value)) {
      error = rule.message || `${field} format is invalid`
    }
    // Custom validation
    else if (rule.custom) {
      error = rule.custom(value)
    }

    setErrors(prev => ({ ...prev, [field]: error }))
  }, [values, rules])

  const validateForm = useCallback(() => {
    const newErrors: FormErrors = {}
    let isValid = true

    Object.keys(rules).forEach(field => {
      const value = values[field] || ''
      const rule = rules[field]
      
      if (!rule) return

      let error: string | null = null

      // Required validation
      if (rule.required && !value.trim()) {
        error = rule.message || `${field} is required`
        isValid = false
      }
      // Min length validation
      else if (rule.minLength && value.length < rule.minLength) {
        error = rule.message || `${field} must be at least ${rule.minLength} characters`
        isValid = false
      }
      // Max length validation
      else if (rule.maxLength && value.length > rule.maxLength) {
        error = rule.message || `${field} must be no more than ${rule.maxLength} characters`
        isValid = false
      }
      // Pattern validation
      else if (rule.pattern && !rule.pattern.test(value)) {
        error = rule.message || `${field} format is invalid`
        isValid = false
      }
      // Custom validation
      else if (rule.custom) {
        error = rule.custom(value)
        if (error) isValid = false
      }

      newErrors[field] = error
    })

    setErrors(newErrors)
    return isValid
  }, [values, rules])

  const setValue = useCallback((field: string, value: string) => {
    setValues(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }, [errors])

  const setFieldTouched = useCallback((field: string, isTouched: boolean) => {
    setTouched(prev => ({ ...prev, [field]: isTouched }))
    
    // Validate field when it loses focus
    if (isTouched) {
      validateField(field)
    }
  }, [validateField])

  const setFieldError = useCallback((field: string, error: string | null) => {
    setErrors(prev => ({ ...prev, [field]: error }))
  }, [])

  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  const resetForm = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  const isValid = useMemo(() => {
    return Object.values(errors).every(error => !error) && 
           Object.keys(rules).every(field => {
             const value = values[field] || ''
             const rule = rules[field]
             if (!rule) return true
             if (rule.required && !value.trim()) return false
             return true
           })
  }, [errors, values, rules])

  return {
    values,
    errors,
    touched,
    isValid,
    setValue,
    setTouched: setFieldTouched,
    validateField,
    validateForm,
    resetForm,
    setFieldError,
    clearErrors
  }
}

// Common validation patterns
export const validationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\+]?[1-9][\d]{0,15}$/,
  numeric: /^\d+$/,
  decimal: /^\d+(\.\d{1,2})?$/,
  url: /^https?:\/\/.+/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  name: /^[a-zA-Z\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s]+$/
}

// Common validation rules
export const commonRules = {
  required: (message?: string): ValidationRule => ({
    required: true,
    message: message || 'This field is required'
  }),
  minLength: (min: number, message?: string): ValidationRule => ({
    minLength: min,
    message: message || `Must be at least ${min} characters`
  }),
  maxLength: (max: number, message?: string): ValidationRule => ({
    maxLength: max,
    message: message || `Must be no more than ${max} characters`
  }),
  pattern: (pattern: RegExp, message?: string): ValidationRule => ({
    pattern,
    message: message || 'Invalid format'
  }),
  email: (message?: string): ValidationRule => ({
    pattern: validationPatterns.email,
    message: message || 'Invalid email format'
  }),
  phone: (message?: string): ValidationRule => ({
    pattern: validationPatterns.phone,
    message: message || 'Invalid phone number format'
  }),
  numeric: (message?: string): ValidationRule => ({
    pattern: validationPatterns.numeric,
    message: message || 'Must be a number'
  }),
  decimal: (message?: string): ValidationRule => ({
    pattern: validationPatterns.decimal,
    message: message || 'Must be a valid decimal number'
  }),
  name: (message?: string): ValidationRule => ({
    pattern: validationPatterns.name,
    message: message || 'Invalid name format'
  })
}
