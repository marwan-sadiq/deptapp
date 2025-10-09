import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { api } from '../api'

interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  phone: string
  is_manager: boolean
  is_active: boolean
  created_at: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  updateProfile: (userData: Partial<User>) => Promise<{ success: boolean; error?: string }>
}


const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is authenticated on app start
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token')
    if (storedToken) {
      setToken(storedToken)
      // Set token in API headers
      api.defaults.headers.common['Authorization'] = `Token ${storedToken}`
      // Verify token is still valid
      checkAuthStatus()
    } else {
      setIsLoading(false)
    }
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await api.get('auth/status/')
      setUser(response.data.user)
      setIsLoading(false)
    } catch (error) {
      // Token is invalid, clear it
      localStorage.removeItem('auth_token')
      setToken(null)
      setUser(null)
      delete api.defaults.headers.common['Authorization']
      setIsLoading(false)
    }
  }

  const login = async (username: string, password: string) => {
    try {
      const response = await api.post('auth/login/', { username, password })
      const { user: userData, token: authToken } = response.data
      
      setUser(userData)
      setToken(authToken)
      localStorage.setItem('auth_token', authToken)
      api.defaults.headers.common['Authorization'] = `Token ${authToken}`
      
      return { success: true }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.non_field_errors?.[0] ||
                          'Login failed'
      return { success: false, error: errorMessage }
    }
  }


  const logout = () => {
    // Call logout endpoint
    if (token) {
      api.post('auth/logout/').catch(() => {
        // Ignore errors on logout
      })
    }
    
    // Clear local state
    setUser(null)
    setToken(null)
    localStorage.removeItem('auth_token')
    delete api.defaults.headers.common['Authorization']
  }

  const updateProfile = async (userData: Partial<User>) => {
    try {
      const response = await api.put('auth/profile/', userData)
      setUser(response.data.user)
      return { success: true }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.non_field_errors?.[0] ||
                          'Profile update failed'
      return { success: false, error: errorMessage }
    }
  }

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    logout,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
