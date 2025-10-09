import React from 'react'
import { useNavigate } from 'react-router-dom'
import { type Customer, type Company } from '../api'
import { useTheme } from '../contexts/ThemeContext'
import { useLanguage } from '../contexts/LanguageContext'

interface TopDebtorsProps {
  title: string
  items: (Customer | Company)[]
  type: string
}

const TopDebtors: React.FC<TopDebtorsProps> = ({ title, items, type }) => {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const { t } = useLanguage()
  const sorted = [...items]
    .sort((a, b) => parseFloat(b.total_debt || '0') - parseFloat(a.total_debt || '0'))
    .slice(0, 5)

  return (
    <div className={`rounded-2xl p-6 shadow-lg border ${
      theme === 'dark' 
        ? 'bg-slate-800 border-slate-700' 
        : 'bg-gradient-to-br from-white to-slate-50 border-slate-200'
    }`}>
      <h3 className={`text-xl font-display font-bold mb-6 ${
        theme === 'dark' ? 'text-white' : 'text-slate-800'
      }`}>{title}</h3>
      <div className="space-y-3">
        {sorted.length === 0 ? (
          <p className={`text-center py-8 ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>{t('status.noData')}</p>
        ) : (
          sorted.map((item) => {
            const isOverdue = item.earliest_due_date && 
              Math.ceil((new Date(item.earliest_due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) < 0
            
            return (
             <div 
               key={item.id} 
               onClick={() => navigate(`/${type === 'customer' ? 'customers' : 'companies'}/${item.id}`)}
               className={`flex justify-between items-center p-4 rounded-xl shadow-sm cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${
                 isOverdue 
                   ? theme === 'dark'
                     ? 'bg-red-900/20 border border-red-700 hover:bg-red-900/30'
                     : 'bg-red-50 border border-red-200 hover:bg-red-100'
                   : theme === 'dark'
                     ? 'bg-slate-700 hover:bg-slate-600'
                     : 'bg-white border border-slate-200 hover:bg-slate-50'
               }`}
             >
               <div>
                 <p className={`font-semibold text-lg ${
                   theme === 'dark' ? 'text-white' : 'text-slate-800'
                 }`}>{item.name}</p>
                 <p className={`text-sm ${
                   theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                 }`}>{item.phone}</p>
                {item.earliest_due_date && (
                  <p className="text-xs mt-1">
                    {(() => {
                      const daysToPay = Math.ceil((new Date(item.earliest_due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                      const isOverdue = daysToPay < 0
                      const isUrgent = daysToPay >= 0 && daysToPay <= 3
                      
                      // Only show overdue warning if customer has payment history (last_payment_date exists)
                      // and hasn't paid in the last 30 days
                      const hasPaymentHistory = type === 'customer' && 'last_payment_date' in item && item.last_payment_date
                      const daysSinceLastPayment = hasPaymentHistory && item.last_payment_date
                        ? Math.floor((Date.now() - new Date(item.last_payment_date).getTime()) / (1000 * 60 * 60 * 24))
                        : 999
                      
                      // For new customers (created within last 30 days), don't show overdue warning
                      const isNewCustomer = type === 'customer' && item.created_at && 
                        Math.floor((Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24)) < 30
                      
                      const shouldShowOverdueWarning = isOverdue && hasPaymentHistory && daysSinceLastPayment > 30 && !isNewCustomer
                      
                      if (shouldShowOverdueWarning) {
                        return (
                          <span className="text-red-600 font-medium">
                            ⚠️ {Math.abs(daysToPay)} {t('time.daysOverdue')}
                          </span>
                        )
                      } else if (isUrgent) {
                        return (
                          <span className="text-orange-600 font-medium">
                            ⏰ {daysToPay} {t('time.daysLeft')}
                          </span>
                        )
                      } else if (isOverdue) {
                        // Show overdue but without warning icon for new customers
                        return (
                          <span className="text-slate-500">
                            ⏰ {Math.abs(daysToPay)} {t('time.daysOverdue')}
                          </span>
                        )
                      } else {
                        return (
                          <span className="text-slate-500">
                            ⏰ {daysToPay} {t('time.daysLeft')}
                          </span>
                        )
                      }
                    })()}
                  </p>
                )}
                 {item.created_at && (
                   <p className={`text-xs mt-1 ${
                     theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                   }`}>
                     📅 {t('time.created')} {new Date(item.created_at).toLocaleDateString()}
                   </p>
                 )}
               </div>
               <span className={`font-bold text-xl ${
                 theme === 'dark' ? 'text-blue-400' : 'text-blue-700'
               }`}>
                 {parseFloat(item.total_debt || '0').toFixed(3)} {t('currency.iqd')}
               </span>
            </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default TopDebtors
