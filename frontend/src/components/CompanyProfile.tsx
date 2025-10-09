import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Building, Phone, MapPin, DollarSign, AlertCircle, CheckCircle, Clock, Plus, Printer } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useLanguage } from '../contexts/LanguageContext'
import { api, type Debt } from '../api'
import DebtModal from './DebtModal'

const CompanyProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showDebtModal, setShowDebtModal] = useState(false)
  const queryClient = useQueryClient()
  const { theme } = useTheme()
  const { t } = useLanguage()


  // Fetch company data
  const { data: company, isLoading, error } = useQuery({
    queryKey: ['company', id],
    queryFn: async () => (await api.get(`companies/${id}/`)).data,
    enabled: !!id
  })

  // Fetch company debts
  const { data: debtsData } = useQuery({
    queryKey: ['company-debts', id],
    queryFn: async () => (await api.get(`debts/?company=${id}`)).data,
    enabled: !!id
  })


  const debts = debtsData?.results || []

  // Calculate statistics
  const totalDebt = debts.reduce((sum: number, debt: Debt) => sum + parseFloat(debt.amount || '0'), 0)
  const totalPaid = debts.filter((d: Debt) => parseFloat(d.amount || '0') < 0).reduce((sum: number, debt: Debt) => sum + Math.abs(parseFloat(debt.amount || '0')), 0)
  const activeDebts = debts.filter((d: Debt) => parseFloat(d.amount || '0') > 0)
  const overdueDebts = activeDebts.filter((d: Debt) => d.due_date && new Date(d.due_date) < new Date())
  const dueSoonDebts = activeDebts.filter((d: Debt) => {
    if (!d.due_date) return false
    const daysUntilDue = Math.ceil((new Date(d.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return daysUntilDue >= 0 && daysUntilDue <= 7
  })

  // Mutations
  const adjustDebt = useMutation({
    mutationFn: async ({ amount, note, isIncrease, override }: any) => {
      const adjustmentAmount = isIncrease ? String(amount) : `-${amount}`
      const payload = { 
        company: parseInt(id!), 
        customer: null, 
        amount: adjustmentAmount, 
        note, 
        override: override || false 
      }
      return (await api.post('debts/', payload)).data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-debts', id] })
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    }
  })

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${company.name} - Payment History</title>
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
              <h1>${company.name} - Company Payment History</h1>
              <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            </div>
            <div class="info">
              <p><strong>Phone:</strong> ${company.phone}</p>
              <p><strong>Address:</strong> ${company.address}</p>
              <p><strong>Created:</strong> ${new Date(company.created_at).toLocaleDateString()}</p>
              <p><strong>Earliest Due Date:</strong> ${company.earliest_due_date ? new Date(company.earliest_due_date).toLocaleDateString() : 'No due date'}</p>
            </div>
            <div class="stats">
              <div class="stat-item">
                <strong>Current Debt</strong><br>
                ${totalDebt.toFixed(3)} IQD
              </div>
              <div class="stat-item">
                <strong>Total Paid</strong><br>
                ${totalPaid.toFixed(3)} IQD
              </div>
              <div class="stat-item">
                <strong>Due Soon</strong><br>
                ${dueSoonDebts.length}
              </div>
              <div class="stat-item">
                <strong>Overdue</strong><br>
                ${overdueDebts.length}
              </div>
            </div>
            <h2>Payment History (${debts.length} transactions)</h2>
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

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Company</h2>
        <p className="text-slate-600 mb-4">There was an error loading the company data.</p>
        <button
          onClick={() => navigate('/companies')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Companies
        </button>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Company Not Found</h2>
        <button
          onClick={() => navigate('/companies')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Companies
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/companies')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className={`text-2xl sm:text-3xl font-bold truncate ${
            theme === 'dark' ? 'text-white' : 'text-slate-800'
          }`}>{company.name}</h1>
          <p className={`text-sm sm:text-base ${
            theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
          }`}>{t('company.profileHistory')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gray-100 text-slate-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            title="Print Payment History"
          >
            <Printer size={18} />
            Print History
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

      {/* Company Info */}
      <div className={`rounded-xl p-6 shadow-sm border ${
        theme === 'dark' 
          ? 'bg-slate-800 border-slate-700' 
          : 'bg-white border-slate-200'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'
            }`}>
              <Building size={24} className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} />
            </div>
            <div>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>{t('company.name')}</p>
              <p className={`font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-slate-800'
              }`}>{company.name}</p>
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
              }`}>{t('company.phone')}</p>
              <p className={`font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-slate-800'
              }`}>{company.phone}</p>
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
              }`}>{t('company.address')}</p>
              <p className={`font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-slate-800'
              }`}>{company.address}</p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className={`mt-6 pt-6 border-t ${
          theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>{t('company.created')}</p>
              <p className={`font-medium ${
                theme === 'dark' ? 'text-white' : 'text-slate-800'
              }`}>{new Date(company.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>{t('company.earliestDueDate')}</p>
              <p className={`font-medium ${
                theme === 'dark' ? 'text-white' : 'text-slate-800'
              }`}>
                {company.earliest_due_date 
                  ? new Date(company.earliest_due_date).toLocaleDateString()
                  : t('company.noDueDate')
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`rounded-xl p-6 shadow-sm border ${
          theme === 'dark' 
            ? 'bg-slate-800 border-slate-700' 
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>Current Debt</p>
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
              }`}>Total Paid</p>
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
              }`}>Due Soon</p>
              <p className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
              }`}>{dueSoonDebts.length}</p>
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
              }`}>Overdue</p>
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
          }`}>Debt History</h3>
          <span className={`text-sm ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
          }`}>{debts.length} transactions</span>
        </div>

        {debts.length === 0 ? (
          <div className="text-center py-8">
            <DollarSign size={48} className={`mx-auto mb-4 ${
              theme === 'dark' ? 'text-slate-600' : 'text-slate-300'
            }`} />
            <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>No debt history yet</p>
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
                      ? 'bg-red-100 text-red-600' 
                      : 'bg-green-100 text-green-600'
                  }`}>
                    {parseFloat(debt.amount || '0') > 0 ? <DollarSign size={20} /> : <CheckCircle size={20} />}
                  </div>
                  <div>
                    <p className={`font-medium ${
                      theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                    }`}>
                      {parseFloat(debt.amount || '0') > 0 ? 'Debt Added' : 'Payment Made'}
                    </p>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      {debt.note || 'No description'}
                    </p>
                    <p className={`text-xs ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      {new Date(debt.created_at).toLocaleDateString()} at {new Date(debt.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${
                    parseFloat(debt.amount || '0') > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {parseFloat(debt.amount || '0') > 0 ? '+' : ''}{parseFloat(debt.amount || '0').toFixed(3)} IQD
                  </p>
                  {debt.due_date && (
                    <p className="text-xs text-slate-500">
                      Due: {new Date(debt.due_date).toLocaleDateString()}
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
          entityName={company.name}
          error={(adjustDebt.error as any)?.response?.data?.amount?.[0] || (adjustDebt.error as any)?.response?.data?.detail || adjustDebt.error?.message}
          isLoading={adjustDebt.isPending}
          isSuccess={adjustDebt.isSuccess}
        />
      )}
    </div>
  )
}

export default CompanyProfile
