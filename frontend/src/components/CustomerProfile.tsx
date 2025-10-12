import React, { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, User, Phone, MapPin, DollarSign, TrendingUp, AlertCircle, CheckCircle, Clock, Plus, Printer } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useLanguage } from '../contexts/LanguageContext'
import { api, type Debt } from '../api'
import ReputationTag from './ReputationTag'
import DebtModal from './DebtModal'

const CustomerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showDebtModal, setShowDebtModal] = useState(false)
  const queryClient = useQueryClient()
  const { theme } = useTheme()
  const { t } = useLanguage()

  // Function to get translated currency name
  const getCurrencyTranslation = useCallback((code: string) => {
    const currencyKey = code.toLowerCase()
    return t(`currency.${currencyKey}`) || code
  }, [t])


  // Fetch customer data
  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => (await api.get(`customers/${id}/`)).data,
    enabled: !!id
  })

  // Fetch customer debts
  const { data: debtsData } = useQuery({
    queryKey: ['customer-debts', id],
    queryFn: async () => (await api.get(`debts/?customer=${id}`)).data,
    enabled: !!id
  })


  const debts = debtsData?.results || []

  // Calculate statistics
  const totalDebt = debts.reduce((sum: number, debt: Debt) => sum + parseFloat(debt.amount || '0'), 0)
  const totalPaid = debts.filter((d: Debt) => parseFloat(d.amount || '0') < 0).reduce((sum: number, debt: Debt) => sum + Math.abs(parseFloat(debt.amount || '0')), 0)
  const activeDebts = debts.filter((d: Debt) => parseFloat(d.amount || '0') > 0)
  const overdueDebts = activeDebts.filter((d: Debt) => d.due_date && new Date(d.due_date) < new Date())

  // Mutations
  const adjustDebt = useMutation({
    mutationFn: async ({ amount, note, isIncrease, override }: any) => {
      const adjustmentAmount = isIncrease ? String(amount) : `-${amount}`
      const payload = { 
        customer: parseInt(id!), 
        company: null, 
        amount: adjustmentAmount, 
        note, 
        override: override || false 
      }
      return (await api.post('debts/', payload)).data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-debts', id] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    }
  })

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${customer.name} - ${t('customer.paymentHistory')}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
              .info { margin-bottom: 15px; }
              .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; }
              .stat-item { border: 1px solid #ddd; padding: 10px; border-radius: 5px; text-align: center; }
              .debt-item { border: 1px solid #ddd; margin: 10px 0; padding: 10px; border-radius: 5px; }
              .debt-amount { font-weight: bold; font-size: 1.1em; }
              .debt-positive { color: red; }
              .debt-negative { color: green; }
              .debt-date { color: #666; font-size: 0.9em; }
              .debt-note { margin: 5px 0; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${customer.name} - ${t('customer.customerPaymentHistory')}</h1>
              <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            </div>
            <div class="info">
              <p><strong>Phone:</strong> ${customer.phone}</p>
              <p><strong>Address:</strong> ${customer.address}</p>
              <p><strong>Reputation:</strong> ${customer.reputation} (${customer.reputation_score})</p>
              <p><strong>Created:</strong> ${new Date(customer.created_at).toLocaleDateString()}</p>
              <p><strong>Last Payment:</strong> ${customer.last_payment_date ? new Date(customer.last_payment_date).toLocaleDateString() : 'Never'}</p>
            </div>
            <div class="stats">
              <div class="stat-item">
                <strong>{t('customer.currentDebt')}</strong><br>
                ${totalDebt.toFixed(3)} IQD
              </div>
              <div class="stat-item">
                <strong>{t('customer.totalPaid')}</strong><br>
                ${totalPaid.toFixed(3)} IQD
              </div>
              <div class="stat-item">
                <strong>{t('customer.activeDebts')}</strong><br>
                ${activeDebts.length}
              </div>
              <div class="stat-item">
                <strong>{t('customer.overdue')}</strong><br>
                ${overdueDebts.length}
              </div>
            </div>
            <h2>${t('customer.paymentHistory')} (${debts.length} ${t('customer.transactions')})</h2>
            <div id="debt-history">
              ${debts.map((debt: Debt) => `
                <div class="debt-item">
                  <div class="debt-amount ${parseFloat(debt.amount || '0') > 0 ? 'debt-positive' : 'debt-negative'}">
                    ${parseFloat(debt.amount || '0') > 0 ? '+' : ''}${parseFloat(debt.amount || '0').toFixed(3)} IQD
                  </div>
                  <div class="debt-note">${debt.note || 'No description'}</div>
                  <div class="debt-date">${new Date(debt.created_at).toLocaleDateString()} at ${new Date(debt.created_at).toLocaleTimeString()}</div>
                  ${debt.due_date ? `<div class="debt-date">Due: ${new Date(debt.due_date).toLocaleDateString()}</div>` : ''}
                </div>
              `).join('')}
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <h2 className={`text-2xl font-bold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-slate-800'
        }`}>
          Customer Not Found
        </h2>
        <button
          onClick={() => navigate('/customers')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Customers
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/customers')}
          className={`p-2 rounded-lg transition-colors ${
            theme === 'dark' 
              ? 'hover:bg-slate-700' 
              : 'hover:bg-gray-100'
          }`}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className={`text-2xl sm:text-3xl font-bold truncate ${
            theme === 'dark' ? 'text-white' : 'text-slate-800'
          }`}>
            {customer.name}
          </h1>
          <p className={`text-sm sm:text-base ${
            theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
          }`}>
            {t('customer.profileHistory')}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              theme === 'dark'
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                : 'bg-gray-100 text-slate-700 hover:bg-gray-200'
            }`}
            title={t('customer.printHistory')}
          >
            <Printer size={18} />
            {t('customer.printHistory')}
          </button>
          <button
            onClick={() => setShowDebtModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus size={18} />
            {t('debt.addDebt')}
          </button>
        </div>
      </div>

      {/* Customer Info */}
      <div className={`rounded-xl p-6 shadow-sm border ${
        theme === 'dark' 
          ? 'bg-slate-800 border-slate-700' 
          : 'bg-white border-slate-200'
      }`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'
            }`}>
              <User size={24} className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} />
            </div>
            <div>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>
                {t('customer.name')}
              </p>
              <p className={`font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-slate-800'
              }`}>
                {customer.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              theme === 'dark' ? 'bg-green-900/30' : 'bg-green-100'
            }`}>
              <Phone size={24} className={theme === 'dark' ? 'text-green-400' : 'text-green-600'} />
            </div>
            <div>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>{t('customer.phone')}</p>
              <p className={`font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-slate-800'
              }`}>{customer.phone}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              theme === 'dark' ? 'bg-purple-900/30' : 'bg-purple-100'
            }`}>
              <MapPin size={24} className={theme === 'dark' ? 'text-purple-400' : 'text-purple-600'} />
            </div>
            <div>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>{t('customer.address')}</p>
              <p className={`font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-slate-800'
              }`}>{customer.address}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              theme === 'dark' ? 'bg-orange-900/30' : 'bg-orange-100'
            }`}>
              <TrendingUp size={24} className={theme === 'dark' ? 'text-orange-400' : 'text-orange-600'} />
            </div>
            <div>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>{t('customer.reputation')}</p>
              <ReputationTag reputation={customer.reputation} score={customer.reputation_score} />
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className={`mt-6 pt-6 border-t ${
          theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
        }`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>{t('customer.created')}</p>
              <p className={`font-medium ${
                theme === 'dark' ? 'text-white' : 'text-slate-800'
              }`}>{new Date(customer.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>{t('customer.lastPayment')}</p>
              <p className={`font-medium ${
                theme === 'dark' ? 'text-white' : 'text-slate-800'
              }`}>
                {customer.last_payment_date 
                  ? new Date(customer.last_payment_date).toLocaleDateString()
                  : t('customer.never')
                }
              </p>
            </div>
            <div>
              <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>{t('customer.paidInLast30Days')}</p>
              <p className={`font-medium ${
                theme === 'dark' ? 'text-white' : 'text-slate-800'
              }`}>{parseFloat(customer.total_paid_30_days || '0').toFixed(3)} {t('currency.iqd')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className={`rounded-xl p-6 shadow-sm border ${
          theme === 'dark' 
            ? 'bg-slate-800 border-slate-700' 
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>{t('customer.currentDebt')}</p>
              <p className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-red-400' : 'text-red-600'
              }`}>{totalDebt.toFixed(3)} IQD</p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              theme === 'dark' ? 'bg-red-900/30' : 'bg-red-100'
            }`}>
              <DollarSign size={24} className="text-red-600" />
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
              }`}>{t('customer.totalPaid')}</p>
              <p className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-green-400' : 'text-green-600'
              }`}>{totalPaid.toFixed(3)} IQD</p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              theme === 'dark' ? 'bg-green-900/30' : 'bg-green-100'
            }`}>
              <CheckCircle size={24} className="text-green-600" />
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
              }`}>{t('customer.activeDebts')}</p>
              <p className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
              }`}>{activeDebts.length}</p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              theme === 'dark' ? 'bg-orange-900/30' : 'bg-orange-100'
            }`}>
              <Clock size={24} className="text-orange-600" />
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
              }`}>{t('customer.overdue')}</p>
              <p className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-red-400' : 'text-red-600'
              }`}>{overdueDebts.length}</p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              theme === 'dark' ? 'bg-red-900/30' : 'bg-red-100'
            }`}>
              <AlertCircle size={24} className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Debt History */}
      <div className={`rounded-xl p-6 shadow-sm border ${
        theme === 'dark' 
          ? 'bg-slate-800 border-slate-700' 
          : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-slate-800'
          }`}>{t('customer.debtHistory')}</h3>
          <span className={`text-sm ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
          }`}>{debts.length} {t('customer.transactions')}</span>
        </div>

        {debts.length === 0 ? (
          <div className="text-center py-8">
            <DollarSign size={48} className={`mx-auto mb-4 ${
              theme === 'dark' ? 'text-slate-600' : 'text-slate-300'
            }`} />
            <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>{t('customer.noDebtHistory')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {debts.map((debt: Debt) => (
              <div key={debt.id} className={`flex items-center justify-between p-4 rounded-lg ${
                theme === 'dark' ? 'bg-slate-700' : 'bg-slate-50'
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    parseFloat(debt.amount || '0') > 0 
                      ? theme === 'dark' ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-600'
                      : theme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600'
                  }`}>
                    {parseFloat(debt.amount || '0') > 0 ? <DollarSign size={20} /> : <CheckCircle size={20} />}
                  </div>
                  <div>
                    <p className={`font-medium ${
                      theme === 'dark' ? 'text-white' : 'text-slate-800'
                    }`}>
                      {parseFloat(debt.amount || '0') > 0 ? t('debt.debtAdded') : t('debt.paymentMade')}
                    </p>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      {debt.note || t('debt.noDescription')}
                    </p>
                    <p className={`text-xs ${
                      theme === 'dark' ? 'text-slate-500' : 'text-slate-500'
                    }`}>
                      {new Date(debt.created_at).toLocaleDateString()} {t('common.at')} {new Date(debt.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${
                    parseFloat(debt.amount || '0') > 0 
                      ? theme === 'dark' ? 'text-red-400' : 'text-red-600'
                      : theme === 'dark' ? 'text-green-400' : 'text-green-600'
                  }`}>
                    {parseFloat(debt.amount || '0') > 0 ? '+' : ''}{parseFloat(debt.amount || '0').toFixed(3)} {getCurrencyTranslation(debt.currency_code || 'IQD')}
                  </p>
                  {debt.due_date && (
                    <p className={`text-xs ${
                      theme === 'dark' ? 'text-slate-500' : 'text-slate-500'
                    }`}>
                      {t('debt.due')}: {new Date(debt.due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


      {/* Modals */}
      {showDebtModal && (
        <DebtModal
          isOpen={showDebtModal}
          onClose={() => setShowDebtModal(false)}
          onAdjust={(amount: string, note: string, isIncrease: boolean, override?: boolean) => adjustDebt.mutate({ amount, note, isIncrease, override })}
          currentAmount={totalDebt.toFixed(3)}
          entityName={customer.name}
          error={(adjustDebt.error as any)?.response?.data?.amount?.[0] || (adjustDebt.error as any)?.response?.data?.detail || adjustDebt.error?.message}
          isLoading={adjustDebt.isPending}
          isSuccess={adjustDebt.isSuccess}
          customerId={customer.id}
        />
      )}
    </div>
  )
}

export default CustomerProfile
