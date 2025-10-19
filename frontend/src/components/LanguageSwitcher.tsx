import React, { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { useTheme } from '../contexts/ThemeContext'
import { Globe, ChevronDown } from 'lucide-react'

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage()
  const { theme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ku', name: 'کوردی', flag: '🇮🇶' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' }
  ]

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0]

  const handleLanguageChange = (langCode: string) => {
    console.log('LanguageSwitcher: Changing language to', langCode)
    setLanguage(langCode as any)
    setIsOpen(false)
    
    // Force a re-render for Samsung devices
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'))
    }, 100)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 sm:p-3 rounded-lg transition-all duration-200 hover:scale-105 flex items-center gap-1 sm:gap-2 ${
          theme === 'dark' 
            ? 'bg-slate-700 text-blue-400 hover:bg-slate-600' 
            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
        }`}
        title="Select Language"
      >
        <Globe size={18} className="sm:w-5 sm:h-5" />
        <span className="hidden sm:inline font-medium text-xs sm:text-sm">
          {currentLanguage.flag} {currentLanguage.name}
        </span>
        <ChevronDown size={14} className={`transition-transform sm:w-4 sm:h-4 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute top-full right-0 mt-2 w-40 sm:w-48 rounded-lg shadow-lg border z-50 ${
          theme === 'dark'
            ? 'bg-slate-800 border-slate-700'
            : 'bg-white border-slate-200'
        }`}>
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-opacity-50 transition-colors flex items-center gap-2 sm:gap-3 ${
                language === lang.code
                  ? theme === 'dark'
                    ? 'bg-blue-900 text-blue-300'
                    : 'bg-blue-100 text-blue-700'
                  : theme === 'dark'
                    ? 'text-slate-300 hover:bg-slate-700'
                    : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="text-base sm:text-lg">{lang.flag}</span>
              <span className="font-medium text-xs sm:text-sm">{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default LanguageSwitcher
