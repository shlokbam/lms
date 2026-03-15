import { createContext, useContext, useState, useCallback } from 'react'
import client from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('eagle_user')) } catch { return null }
  })

  const login = useCallback(async (email, password) => {
    const { data } = await client.post('/api/auth/login', { email, password })
    localStorage.setItem('eagle_token', data.access_token)
    localStorage.setItem('eagle_user', JSON.stringify(data))
    setUser(data)
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('eagle_token')
    localStorage.removeItem('eagle_user')
    setUser(null)
  }, [])

  const updateName = useCallback((name) => {
    setUser(prev => {
      const next = { ...prev, name }
      localStorage.setItem('eagle_user', JSON.stringify(next))
      return next
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, updateName }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
