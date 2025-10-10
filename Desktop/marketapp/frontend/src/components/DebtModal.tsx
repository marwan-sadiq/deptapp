import React, { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useLanguage } from '../contexts/LanguageContext'
import { X, Plus, Minus } from 'lucide-react'

interface DebtModalProps {
  isOpen: boolean
  onClose: () => void
  onAdjust: (amount: string, note: string, isIncrease: boolean, override?: boolean) => void
  currentAmount: string
  entityName: string
  error?: string | null
  isLoading?: boolean
  isSuccess?: boolean
  customerId?: number
  onCheckCredit?: (customerId: number) => Promise<{canReceive: boolean, reason: string}>
}

const DebtModal: React.FC<DebtModalProps> = ({ 
  isOpen, 
  onClose, 
  onAdjust, 
  currentAmount, 
  entityName,
  error,
  isLoading = false,
  isSuccess = false,
  customerId,
  onCheckCredit
}) => {
  const [step, setStep] = useState<'choice' | 'form' | 'override'>('choice')
  const [isIncrease, setIsIncrease] = useState<boolean | null>(null)
  const { theme } = useTheme()
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [isCheckingCredit, setIsCheckingCredit] = useState(false)
  const { t } = useLanguage()

  // Clear local error when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalError(null)
    }
  }, [isOpen])

  // Watch for errors and show override step
  useEffect(() => {
    if (error && isIncrease && step === 'form' && isOpen) {
      setLocalError(error)
      // Add a small delay to ensure the error is visible
      setTimeout(() => {
        setStep('override')
      }, 100)
    }
  }, [error, isIncrease, step, isOpen])

  // Watch for success and close modal
  useEffect(() => {
    if (isSuccess) {
      handleClose()
    }
  }, [isSuccess])

  const handleChoice = async (increase: boolean) => {
    setIsIncrease(increase)
    setLocalError(null) // Clear any previous errors
    if (increase && customerId && onCheckCredit) {
      // For increase, check credit status immediately
      setIsCheckingCredit(true)
      try {
        const creditCheck = await onCheckCredit(customerId)
        if (!creditCheck.canReceive) {
          setLocalError(`Cannot increase debt: ${creditCheck.reason}`)
          setStep('override')
        } else {
          setStep('form')
        }
      } catch (error) {
        console.error('Credit check failed:', error)
        setStep('form')
      } finally {
        setIsCheckingCredit(false)
      }
    } else {
      setStep('form')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || isIncrease === null) return
    
    setLocalError(null) // Clear any previous errors before submitting
    
    // If it's an increase, check if we're in override mode
    if (isIncrease) {
      // If we have a local error, it means we're in override mode
      const useOverride = !!localError
      onAdjust(amount, note, isIncrease, useOverride)
      if (useOverride) {
        handleClose()
      }
    } else {
      // Decrease always works
      onAdjust(amount, note, isIncrease)
      handleClose()
    }
  }

  const handleOverride = () => {
    // Go to form step so user can enter amount and note
    setStep('form')
    setLocalError(null) // Clear error when going to form
  }

  const handleClose = () => {
    setStep('choice')
    setIsIncrease(null)
    setAmount('')
    setNote('')
    setLocalError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-xl shadow-2xl max-w-md w-full max-h-[95vh] overflow-y-auto ${
        theme === 'dark' ? 'bg-slate-800' : 'bg-white'
      }`}>
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className={`text-lg sm:text-xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-slate-800'
            }`}>
              {t('debt.manageDebt')}
            </h2>
            <button
              onClick={handleClose}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-gray-100'
              }`}
            >
              <X size={20} />
            </button>
          </div>

          <div className={`mb-4 p-4 rounded-lg ${
            theme === 'dark' ? 'bg-slate-700' : 'bg-slate-50'
          }`}>
            <p className={`text-sm mb-1 ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
            }`}>
              {t('debt.manageDebt')} {entityName}
            </p>
            <p className={`text-2xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-slate-800'
            }`}>
              {parseFloat(currentAmount).toFixed(3)} {t('currency.iqd')}
            </p>
          </div>



          {step === 'choice' && (
            <div className="space-y-4">
              <p className={`text-center mb-6 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
              }`}>
                {t('debt.whatToDo')}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => handleChoice(true)}
                  disabled={isCheckingCredit}
                  className="p-4 sm:p-6 bg-green-50 border-2 border-green-200 rounded-xl hover:bg-green-100 hover:border-green-300 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex flex-col items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-full flex items-center justify-center group-hover:bg-green-600 transition-colors">
                      {isCheckingCredit ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Plus size={20} className="sm:w-6 sm:h-6 text-white" />
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-sm sm:text-base font-semibold text-green-800">
                        {isCheckingCredit ? t('debt.checking') : t('debt.increase')}
                      </p>
                      <p className="text-xs sm:text-sm text-green-600">
                        {isCheckingCredit ? t('debt.verifyingCredit') : t('debt.addToDebt')}
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleChoice(false)}
                  className="p-4 sm:p-6 bg-red-50 border-2 border-red-200 rounded-xl hover:bg-red-100 hover:border-red-300 transition-all group"
                >
                  <div className="flex flex-col items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500 rounded-full flex items-center justify-center group-hover:bg-red-600 transition-colors">
                      <Minus size={20} className="sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm sm:text-base font-semibold text-red-800">{t('debt.decrease')}</p>
                      <p className="text-xs sm:text-sm text-red-600">{t('debt.reduceDebt')}</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className={`p-4 rounded-lg ${
                localError 
                  ? theme === 'dark' 
                    ? 'bg-orange-900/20 border border-orange-700' 
                    : 'bg-orange-50 border border-orange-200'
                  : theme === 'dark'
                    ? 'bg-blue-900/20'
                    : 'bg-blue-50'
              }`}>
                <p className={`text-sm font-medium ${
                  localError 
                    ? theme === 'dark' ? 'text-orange-300' : 'text-orange-700'
                    : theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
                }`}>
                  {localError ? t('debt.overrideMode') + ' ' : ''}{isIncrease ? t('debt.increasing') : t('debt.decreasing')} {t('debt.debt')} {entityName}
                </p>
                {localError && (
                  <p className={`text-xs mt-1 ${
                    theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
                  }`}>
                    {t('debt.creditOverride')}
                  </p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  {t('debt.amountTo')} {isIncrease ? t('debt.add') : t('debt.subtract')} *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className={`w-full px-4 py-3 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    theme === 'dark' 
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  {t('debt.noteOptional')}
                </label>
                <input
                  type="text"
                  placeholder={t('debt.reasonPlaceholder')}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    theme === 'dark' 
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setStep('choice')
                    setLocalError(null)
                  }}
                  className={`flex-1 px-4 py-3 rounded-lg transition-colors font-medium ${
                    theme === 'dark'
                      ? 'text-slate-300 bg-slate-700 hover:bg-slate-600'
                      : 'text-slate-600 bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {t('buttons.back')}
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`flex-1 px-4 py-3 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    localError 
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : isIncrease 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {isLoading ? t('buttons.processing') : (localError ? t('debt.overrideIncrease') : (isIncrease ? t('debt.increaseDebt') : t('debt.decreaseDebt')))}
                </button>
              </div>
            </form>
          )}

          {step === 'override' && (
            <div className="space-y-4">
              {/* Simple Error Message */}
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <X size={20} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">{t('debt.cannotIncrease')}</h3>
                <p className="text-red-700">{localError || error}</p>
              </div>

              {/* Simple Override Option */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-center mb-4">
                  {t('debt.managerOverride')}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('form')}
                    className="flex-1 px-4 py-2 text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    {t('buttons.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleOverride}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    {isLoading ? t('buttons.processing') : t('debt.overrideContinue')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DebtModal
