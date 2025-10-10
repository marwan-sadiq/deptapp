import React from 'react'
import { useTheme } from '../contexts/ThemeContext'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  color: string
  icon?: React.ReactNode
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, color, icon }) => {
  const { theme } = useTheme()
  
  const colors = {
    blue: {
      bg: theme === 'dark' ? 'bg-blue-900/20' : 'bg-gradient-to-br from-blue-50 to-blue-100',
      border: theme === 'dark' ? 'border-blue-700' : 'border-blue-200',
      text: theme === 'dark' ? 'text-blue-300' : 'text-blue-600',
      value: theme === 'dark' ? 'text-blue-100' : 'text-blue-900',
      icon: theme === 'dark' ? 'text-blue-500' : 'text-blue-600',
      iconBg: theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'
    },
    green: {
      bg: theme === 'dark' ? 'bg-green-900/20' : 'bg-gradient-to-br from-green-50 to-green-100',
      border: theme === 'dark' ? 'border-green-700' : 'border-green-200',
      text: theme === 'dark' ? 'text-green-300' : 'text-green-600',
      value: theme === 'dark' ? 'text-green-100' : 'text-green-900',
      icon: theme === 'dark' ? 'text-green-500' : 'text-green-600',
      iconBg: theme === 'dark' ? 'bg-green-500/20' : 'bg-green-100'
    },
    purple: {
      bg: theme === 'dark' ? 'bg-purple-900/20' : 'bg-gradient-to-br from-purple-50 to-purple-100',
      border: theme === 'dark' ? 'border-purple-700' : 'border-purple-200',
      text: theme === 'dark' ? 'text-purple-300' : 'text-purple-600',
      value: theme === 'dark' ? 'text-purple-100' : 'text-purple-900',
      icon: theme === 'dark' ? 'text-purple-500' : 'text-purple-600',
      iconBg: theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-100'
    },
    orange: {
      bg: theme === 'dark' ? 'bg-orange-900/20' : 'bg-gradient-to-br from-orange-50 to-orange-100',
      border: theme === 'dark' ? 'border-orange-700' : 'border-orange-200',
      text: theme === 'dark' ? 'text-orange-300' : 'text-orange-600',
      value: theme === 'dark' ? 'text-orange-100' : 'text-orange-900',
      icon: theme === 'dark' ? 'text-orange-500' : 'text-orange-600',
      iconBg: theme === 'dark' ? 'bg-orange-500/20' : 'bg-orange-100'
    },
    red: {
      bg: theme === 'dark' ? 'bg-red-900/20' : 'bg-gradient-to-br from-red-50 to-red-100',
      border: theme === 'dark' ? 'border-red-700' : 'border-red-200',
      text: theme === 'dark' ? 'text-red-300' : 'text-red-600',
      value: theme === 'dark' ? 'text-red-100' : 'text-red-900',
      icon: theme === 'dark' ? 'text-red-500' : 'text-red-600',
      iconBg: theme === 'dark' ? 'bg-red-500/20' : 'bg-red-100'
    }
  }

  const colorScheme = colors[color as keyof typeof colors] || colors.blue

  return (
    <div className={`${colorScheme.bg} ${colorScheme.border} border rounded-xl p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] animate-slide-up shadow-sm`}>
      <div className="flex items-center gap-4">
        {icon && (
          <div className={`${colorScheme.icon} ${colorScheme.iconBg} flex-shrink-0 p-3 rounded-xl shadow-sm`}>
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-sans font-semibold ${colorScheme.text} uppercase tracking-wider mb-2`}>
            {title}
          </p>
          <p className={`text-3xl font-display font-bold ${colorScheme.value} mb-2`}>
            {value}
          </p>
          {subtitle && (
            <p className={`text-sm font-sans ${colorScheme.text} opacity-90 truncate`}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default StatCard
