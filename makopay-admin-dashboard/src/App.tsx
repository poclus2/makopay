import { useState, useEffect } from 'react'
import LoginPage from './pages/LoginPage'
import DashboardLayout from './components/DashboardLayout'
import { AdminSupportProvider } from './contexts/AdminSupportContext'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user has a valid token
    const token = localStorage.getItem('admin_token')
    setIsAuthenticated(!!token)
    setIsLoading(false)

    // Listen for auth errors from api interceptor
    const handleAuthLogout = () => {
      setIsAuthenticated(false)
      localStorage.removeItem('admin_token')
    }

    window.addEventListener('auth:logout', handleAuthLogout)
    return () => window.removeEventListener('auth:logout', handleAuthLogout)
  }, [])

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    setIsAuthenticated(false)
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <AdminSupportProvider>
      <DashboardLayout onLogout={handleLogout} />
    </AdminSupportProvider>
  )
}

export default App
