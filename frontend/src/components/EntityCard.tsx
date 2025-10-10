import React, { useState, memo, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useLanguage } from '../contexts/LanguageContext'
import { type Customer, type Company } from '../api'
import DebtModal from './DebtModal'
import ReputationTag from './ReputationTag'

interface EntityCardProps {
  entity: Customer | Company
  onAdjustDebt: (amount: string, note: string, isIncrease: boolean, override?: boolean) => void
  type: 'customer' | 'company'
  onDeleteEntity?: () => void
  debtError?: string | null
  isDebtLoading?: boolean
  isDebtSuccess?: boolean
  onCheckCredit?: (customerId: number) => Promise<{canReceive: boolean, reason: string}>
}

const EntityCard: React.FC<EntityCardProps> = memo(({ 
  entity, 
  onAdjustDebt, 
  type,
  onDeleteEntity,
  debtError,
  isDebtLoading = false,
  isDebtSuccess = false,
  onCheckCredit,
}) => {
  const [showModal, setShowModal] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const navigate = useNavigate()
  const { theme } = useTheme()
  const { t } = useLanguage()

  const handleAdjustDebt = useCallback((amount: string, note: string, isIncrease: boolean, override?: boolean) => {
    onAdjustDebt(amount, note, isIncrease, override)
  }, [onAdjustDebt])

  const handleDeleteClick = useCallback(() => {
    setShowDeleteConfirmation(true)
  }, [])

  const confirmDelete = useCallback(() => {
    if (onDeleteEntity) {
      onDeleteEntity()
    }
    setShowDeleteConfirmation(false)
  }, [onDeleteEntity])

  const cancelDelete = useCallback(() => {
    setShowDeleteConfirmation(false)
  }, [])

  // Memoize complex calculations to prevent unnecessary re-renders
  const { isOverdue, shouldShowOverdueWarning, daysToPay, isUrgent } = useMemo(() => {
    const isOverdue = entity.earliest_due_date && 
      Math.ceil((new Date(entity.earliest_due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) < 0
    
    // Only show overdue warning if customer has payment history and hasn't paid in 30+ days
    const hasPaymentHistory = type === 'customer' && 'last_payment_date' in entity && (entity as Customer).last_payment_date
    const daysSinceLastPayment = hasPaymentHistory && (entity as Customer).last_payment_date
      ? Math.floor((Date.now() - new Date((entity as Customer).last_payment_date!).getTime()) / (1000 * 60 * 60 * 24))
      : 999
    
    // For new customers (created within last 30 days), don't show overdue warning
    const isNewCustomer = type === 'customer' && entity.created_at && 
      Math.floor((Date.now() - new Date(entity.created_at).getTime()) / (1000 * 60 * 60 * 24)) < 30
    
    const shouldShowOverdueWarning = isOverdue && hasPaymentHistory && daysSinceLastPayment > 30 && !isNewCustomer

    // Calculate days to pay for display
    const daysToPay = entity.earliest_due_date 
      ? Math.ceil((new Date(entity.earliest_due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 0
    const isUrgent = daysToPay >= 0 && daysToPay <= 3

    return { isOverdue, shouldShowOverdueWarning, daysToPay, isUrgent }
  }, [entity.earliest_due_date, entity.created_at, type, entity])

  // Memoize formatted dates to prevent recalculation
  const formattedDates = useMemo(() => {
    const createdDate = entity.created_at 
      ? new Date(entity.created_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit' 
        })
      : ''
    
    const lastPaymentDate = type === 'customer' && 'last_payment_date' in entity && (entity as Customer).last_payment_date
      ? new Date((entity as Customer).last_payment_date!).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit' 
        })
      : ''

    return { createdDate, lastPaymentDate }
  }, [entity.created_at, type, entity])

  return (
    <>
      <div className={`rounded-lg p-3 shadow-md border hover:shadow-lg transition-all duration-300 hover:scale-[1.01] animate-slide-up ${
        shouldShowOverdueWarning 
          ? theme === 'dark'
            ? 'border-red-500 bg-red-900/20'
            : 'border-red-300 bg-red-50'
          : theme === 'dark'
            ? 'border-slate-700 bg-slate-800'
            : 'border-slate-200 bg-white'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-display font-bold text-lg shadow-md flex-shrink-0 ${
              theme === 'dark' 
                ? 'bg-blue-700 text-white' 
                : 'bg-blue-700 text-white border-2 border-blue-300'
            }`}>
              {entity.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 
                  className={`text-lg font-display font-semibold cursor-pointer hover:text-blue-600 transition-colors break-words ${
                    theme === 'dark' ? 'text-white' : 'text-slate-800'
                  }`}
                  onClick={() => navigate(`/${type === 'customer' ? 'customers' : 'companies'}/${entity.id}`)}
                  title={`View ${entity.name} profile`}
                >
                  {entity.name}
                </h3>
                {type === 'customer' && 'reputation' in entity && (
                  <ReputationTag 
                    reputation={entity.reputation} 
                    score={entity.reputation_score}
                    showScore={true}
                  />
                )}
                {shouldShowOverdueWarning && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                    🔒 {t('debt.locked')}
                  </span>
                )}
              </div>
              <div className={`text-xs space-y-0.5 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {entity.phone && (
                  <p className="flex items-center gap-2">
                    <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>📞</span>
                    <span className="break-all">{entity.phone}</span>
                  </p>
                )}
                {entity.address && (
                  <p className="flex items-center gap-2">
                    <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>📍</span>
                    <span className="break-all">{entity.address}</span>
                  </p>
                )}
                {entity.earliest_due_date && (
                  <p className="flex items-center gap-2">
                    {isOverdue ? (
                      <>
                        <span className="text-red-500">⚠️</span>
                        <span className="text-red-600 font-medium">
                          {Math.abs(daysToPay)} {t('time.daysOverdue')}
                        </span>
                      </>
                    ) : isUrgent ? (
                      <>
                        <span className="text-orange-500">⏰</span>
                        <span className="text-orange-600 font-medium">
                          {daysToPay} {t('time.daysLeft')}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>⏰</span>
                        <span>
                          {daysToPay} {t('time.daysLeft')}
                        </span>
                      </>
                    )}
                  </p>
                )}
                {entity.created_at && (
                  <p className="flex items-center gap-2">
                    <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>📅</span>
                    <span>
                      {t('time.created')} {formattedDates.createdDate}
                    </span>
                  </p>
                )}
                {type === 'customer' && 'total_paid_30_days' in entity && parseFloat(entity.total_paid_30_days) > 0 && (
                  <p className="flex items-center gap-2">
                    <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>💰</span>
                    <span className="break-words">
                      {t('customer.paidInLast30Days')} {parseFloat(entity.total_paid_30_days).toFixed(3)} {t('currency.iqd')}
                    </span>
                  </p>
                )}
                {type === 'customer' && 'last_payment_date' in entity && entity.last_payment_date && (
                  <p className="flex items-center gap-2">
                    <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>⏰</span>
                    <span>
                      {t('time.lastPayment')}: {formattedDates.lastPaymentDate}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className={`px-4 py-2 rounded-lg ${
              theme === 'dark' ? 'bg-slate-700' : 'bg-slate-50'
            }`}>
              <p className={`text-lg font-bold ${
                theme === 'dark' ? 'text-white' : 'text-slate-800'
              }`}>
                {parseFloat(entity.total_debt || '0').toFixed(3)} {t('currency.iqd')}
              </p>
              <p className={`text-xs ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}>
                {t('customer.currentDebt')}
              </p>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              <button
                onClick={() => setShowModal(true)}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                {t('debt.adjustDebt')}
              </button>
              {onDeleteEntity && (
                <button
                  onClick={handleDeleteClick}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                >
                  {t('buttons.delete')}
                </button>
              )}
            </div>
          </div>
        </div>

      </div>

      <DebtModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAdjust={handleAdjustDebt}
        currentAmount={parseFloat(entity.total_debt || '0').toFixed(2)}
        entityName={entity.name}
        error={debtError}
        isLoading={isDebtLoading}
        isSuccess={isDebtSuccess}
        customerId={type === 'customer' ? entity.id : undefined}
        onCheckCredit={onCheckCredit}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl shadow-2xl max-w-md w-full ${
            theme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
          }`}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-red-600 text-xl">⚠️</span>
                </div>
                <h3 className={`text-lg font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-slate-800'
                }`}>
                  {t('buttons.delete')} {entity.name}?
                </h3>
              </div>
              
              <div className={`p-4 rounded-lg mb-6 ${
                theme === 'dark' ? 'bg-slate-700' : 'bg-slate-50'
              }`}>
                <p className={`text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  {t('customer.currentDebt')}:
                </p>
                <p className={`text-lg font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-slate-800'
                }`}>
                  {parseFloat(entity.total_debt || '0').toFixed(3)} {t('currency.iqd')}
                </p>
              </div>
              
              <p className={`text-sm mb-6 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
              }`}>
                {t('common.cannotBeUndone')}
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={cancelDelete}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {t('buttons.cancel')}
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  {t('buttons.delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
})

EntityCard.displayName = 'EntityCard'

export default EntityCard
