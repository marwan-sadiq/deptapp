import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, X, Trash2 } from 'lucide-react'
import { api, type Debt } from '../api'

interface DebtManagerProps {
  entityId: number
  type: 'customer' | 'company'
  onAdd: (amount: string, note: string, dueDate?: string) => void
  onDelete: (id: number) => void
}

interface DueBadgeProps {
  dueDate: string
}

const DueBadge: React.FC<DueBadgeProps> = ({ dueDate }) => {
  const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const overdue = days < 0

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      overdue ? 'bg-red-100 text-red-700' : days <= 7 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
    }`}>
      {overdue ? `${Math.abs(days)}d overdue` : `${days}d left`}
    </span>
  )
}

const DebtManager: React.FC<DebtManagerProps> = ({ entityId, type, onAdd, onDelete }) => {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [adjustmentAmounts, setAdjustmentAmounts] = useState<{[key: number]: string}>({})

  const key = type === 'customer' ? ['customer-debts', entityId] : ['company-debts', entityId]
  const { data } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const url = type === 'customer' ? `customers/${entityId}/debts/` : `companies/${entityId}/debts/`
      return (await api.get(url)).data
    }
  })
  const debts: Debt[] = data || []

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount) return
    onAdd(amount, note, dueDate || undefined)
    setAmount('')
    setNote('')
    setDueDate('')
  }

  const adjustDebt = (debtId: number, adjustment: number) => {
    const debt = debts.find(d => d.id === debtId)
    if (debt) {
      const newAmount = (parseFloat(debt.amount) + adjustment).toFixed(2)
      onAdd(newAmount, `Adjusted by ${adjustment > 0 ? '+' : ''}${adjustment}`, debt.due_date || undefined)
    }
  }

  const adjustDebtByAmount = (debtId: number, isIncrease: boolean) => {
    const adjustmentAmount = adjustmentAmounts[debtId] || '0'
    const adjustment = parseFloat(adjustmentAmount) * (isIncrease ? 1 : -1)
    if (adjustment !== 0) {
      adjustDebt(debtId, adjustment)
      setAdjustmentAmounts(prev => ({ ...prev, [debtId]: '' }))
    }
  }

  const getDaysSinceCreated = (createdAt: string) => {
    const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
    return days
  }

  return (
    <div className="space-y-4">
      {/* Add New Debt Form */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Add New Debt</h4>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="number"
            step="0.01"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            placeholder="Note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Add Debt
          </button>
        </form>
      </div>

      {/* Debt List */}
      <div className="space-y-3">
        {debts.map((debt) => (
          <div key={debt.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 px-3 py-2 rounded-lg">
                  <span className="text-lg font-bold text-blue-900">{parseFloat(debt.amount).toFixed(3)} IQD</span>
                </div>
                <div className="flex flex-col">
                  {debt.note && <span className="text-sm text-slate-600">{debt.note}</span>}
                  <div className="flex items-center gap-2 mt-1">
                    {debt.due_date && <DueBadge dueDate={debt.due_date} />}
                    {debt.created_at && (
                      <span className="text-xs text-slate-500 bg-gray-100 px-2 py-1 rounded">
                        {getDaysSinceCreated(debt.created_at)}d ago
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onDelete(debt.id)}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <input
                type="number"
                step="0.01"
                placeholder="Enter amount"
                value={adjustmentAmounts[debt.id] || ''}
                onChange={(e) => setAdjustmentAmounts(prev => ({ ...prev, [debt.id]: e.target.value }))}
                className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={() => adjustDebtByAmount(debt.id, true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center gap-1"
              >
                <Plus size={16} />
                Increase
              </button>
              <button
                onClick={() => adjustDebtByAmount(debt.id, false)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm flex items-center gap-1"
              >
                <X size={16} />
                Decrease
              </button>
            </div>
          </div>
        ))}
        
        {debts.length === 0 && (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg p-8 text-center">
            <div className="text-slate-400 mb-2">
              <Plus size={32} className="mx-auto" />
            </div>
            <p className="text-slate-500 text-sm">No debts recorded</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default DebtManager
