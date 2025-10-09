import React from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'

interface NavTabProps {
  to: string
  icon: React.ReactNode
  active: boolean
  children: React.ReactNode
}

const NavTab: React.FC<NavTabProps> = ({ to, icon, active, children }) => {
  const { theme } = useTheme()
  
  return (
    <Link to={to} className="flex-1">
      <button
        className={`w-full px-4 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
          active
            ? 'bg-blue-600 text-white shadow-md'
            : theme === 'dark'
              ? 'text-slate-300 hover:bg-slate-700 hover:text-white'
              : 'text-slate-600 hover:bg-gray-100'
        }`}
      >
        {icon}
        <span className="hidden sm:inline">{children}</span>
      </button>
    </Link>
  )
}

export default NavTab
