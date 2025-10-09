import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTheme } from '../contexts/ThemeContext'
import { useLanguage } from '../contexts/LanguageContext'
import { api } from '../api'
import { Save } from 'lucide-react'

const ShopMoneyInput: React.FC = () => {
  const [shopMoney, setShopMoney] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const qc = useQueryClient()
  const { theme } = useTheme()
  const { t } = useLanguage()

  // Query to get current shop money
  const { data: shopData } = useQuery({ 
    queryKey: ['shop-money'], 
    queryFn: async () => {
      try {
        return (await api.get('shop-money/')).data
      } catch (error) {
        // If endpoint fails, return default value
        return { current_money: '0.00' }
      }
    },
    retry: false,
    refetchOnWindowFocus: false
  })

  const updateShopMoney = useMutation({
    mutationFn: async (amount: string) => {
      return api.post('shop-money/', { current_money: amount })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shop-money'] })
      setIsEditing(false)
    }
  })

  const currentMoney = shopData?.current_money || '0.00'

  const handleSave = () => {
    if (shopMoney && parseFloat(shopMoney) >= 0) {
      updateShopMoney.mutate(shopMoney)
    }
  }

  const handleEdit = () => {
    setShopMoney(currentMoney)
    setIsEditing(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <button
          onClick={handleEdit}
          className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all duration-200 hover:scale-105 shadow-lg flex items-center gap-2"
        >
          <Save size={18} />
          {isEditing ? t('buttons.cancel') : t('shopMoney.edit')}
        </button>
      </div>

        {isEditing ? (
          <div className="space-y-6">
            <div>
              <label className={`block text-base font-semibold mb-3 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {t('shopMoney.currentAmount')}
              </label>
              <input
                type="number"
                step="0.01"
                value={shopMoney}
                onChange={(e) => setShopMoney(e.target.value)}
                className={`w-full px-6 py-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-xl font-medium ${
                  theme === 'dark' 
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'
                }`}
                placeholder="0.00"
                autoFocus
              />
            </div>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setIsEditing(false)}
                className={`px-6 py-3 text-base font-medium rounded-xl transition-all duration-200 ${
                  theme === 'dark'
                    ? 'text-slate-300 bg-slate-700 hover:bg-slate-600'
                    : 'text-slate-600 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {t('buttons.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={!shopMoney || parseFloat(shopMoney) < 0}
                className="px-6 py-3 text-base font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {t('shopMoney.save')}
              </button>
            </div>
          </div>
        ) : null}
    </div>
  )
}

export default ShopMoneyInput
