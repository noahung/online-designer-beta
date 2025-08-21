import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/Layout'
import LoginForm from './components/LoginForm'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import Forms from './pages/Forms'
import Responses from './pages/Responses'
import Settings from './pages/Settings'
import FormBuilder from './pages/FormBuilder'
import FormEmbed from './pages/FormEmbed'

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
  const { user, userType, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  // If this is an admin-only route and user is a client, redirect to responses
  if (adminOnly && userType === 'client') {
    return <Navigate to="/responses" replace />
  }
  
  return <>{children}</>
}

function AppRoutes() {
  const { user, userType, loading } = useAuth()
  
  console.log('AppRoutes: State', { user: user?.email, userType, loading })
  
  if (loading) {
    console.log('AppRoutes: Showing loading screen')
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    )
  }
  
  if (!user) {
    console.log('AppRoutes: No user, showing login')
    return <LoginForm />
  }
  
  console.log('AppRoutes: User authenticated, showing routes')
  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/" element={<Layout />}>
        {/* Client gets redirected to responses if they try to access admin routes */}
        <Route index element={
          userType === 'client' ? <Navigate to="/responses" replace /> : <Dashboard />
        } />
        <Route path="clients" element={
          <ProtectedRoute adminOnly>
            <Clients />
          </ProtectedRoute>
        } />
        <Route path="forms" element={
          <ProtectedRoute adminOnly>
            <Forms />
          </ProtectedRoute>
        } />
        <Route path="forms/new" element={
          <ProtectedRoute adminOnly>
            <FormBuilder />
          </ProtectedRoute>
        } />
        <Route path="forms/edit/:id" element={
          <ProtectedRoute adminOnly>
            <FormBuilder />
          </ProtectedRoute>
        } />
        <Route path="responses" element={
          <ProtectedRoute>
            <Responses />
          </ProtectedRoute>
        } />
        <Route path="settings" element={
          <ProtectedRoute adminOnly>
            <Settings />
          </ProtectedRoute>
        } />
      </Route>
      {/* Public form embed route */}
      <Route path="form/:id" element={<FormEmbed />} />
    </Routes>
  )
}

function App() {
  // Use basename only in production for GitHub Pages
  const basename = import.meta.env.PROD ? '/online-designer-beta' : '';
  
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900">
        <div className="min-h-screen backdrop-blur-sm bg-black/20">
          <AuthProvider>
            <ToastProvider>
              <Router basename={basename}>
                <AppRoutes />
              </Router>
            </ToastProvider>
          </AuthProvider>
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default App