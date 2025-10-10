import React from 'react'
import { Star, TrendingUp, AlertTriangle, XCircle, CheckCircle } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

interface ReputationTagProps {
  reputation: 'excellent' | 'good' | 'fair' | 'poor' | 'bad'
  score?: number
  showScore?: boolean
}

const ReputationTag: React.FC<ReputationTagProps> = ({ reputation, score, showScore = false }) => {
  const { t } = useLanguage()
  
  const getReputationConfig = () => {
    switch (reputation) {
      case 'excellent':
        return {
          label: t('filters.excellent'),
          icon: <Star size={14} />,
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-200',
          iconColor: 'text-green-600'
        }
      case 'good':
        return {
          label: t('filters.good'),
          icon: <CheckCircle size={14} />,
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-600'
        }
      case 'fair':
        return {
          label: t('filters.fair'),
          icon: <TrendingUp size={14} />,
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200',
          iconColor: 'text-yellow-600'
        }
      case 'poor':
        return {
          label: t('filters.poor'),
          icon: <AlertTriangle size={14} />,
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-800',
          borderColor: 'border-orange-200',
          iconColor: 'text-orange-600'
        }
      case 'bad':
        return {
          label: t('filters.bad'),
          icon: <XCircle size={14} />,
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600'
        }
      default:
        return {
          label: t('common.unknown'),
          icon: <AlertTriangle size={14} />,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200',
          iconColor: 'text-gray-600'
        }
    }
  }

  const config = getReputationConfig()

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs sm:text-sm font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor}`}>
      <span className={config.iconColor}>
        {config.icon}
      </span>
      <span className="hidden sm:inline">{config.label}</span>
      <span className="sm:hidden">{config.label.charAt(0).toUpperCase()}</span>
      {showScore && score !== undefined && (
        <span className="ml-1 opacity-75">({score})</span>
      )}
    </div>
  )
}

export default ReputationTag
