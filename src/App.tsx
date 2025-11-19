import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { useTheme } from './contexts/ThemeContext'
import { initPerformanceOptimizations } from './lib/performance'
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
import APIEndpoint from './pages/APIEndpoint'
import FormResponses from './pages/FormResponses'

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
  const { user, userType, loading } = useAuth()
  const { theme } = useTheme()
  
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-[#111111]`}>
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
              theme === 'light' ? 'border-gray-600' : 'border-white'
            }`}></div>
          </div>
          <p className={theme === 'light' ? 'text-gray-600' : 'text-white/70'}>Loading...</p>
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
  const { theme } = useTheme()
  
  console.log('AppRoutes: Simple state check', { user: user?.email, userType, loading })
  
  // Check if this is a public form embed route first
  const currentPath = window.location.pathname
  // Use custom domain detection - if on custom domain, no basename needed
  const isCustomDomain = window.location.hostname !== 'noahung.github.io'
  const basename = import.meta.env.PROD && !isCustomDomain ? '/online-designer-beta' : ''
  const pathWithoutBasename = basename ? currentPath.replace(basename, '') : currentPath
  
  // Check for API endpoint routes (public, no auth required)
  if (pathWithoutBasename.startsWith('/api/')) {
    console.log('AppRoutes: API endpoint route detected', { currentPath, pathWithoutBasename })
    return (
      <Routes>
        <Route path="api/forms" element={<APIEndpoint />} />
      </Routes>
    )
  }
  
  if (pathWithoutBasename.startsWith('/form/')) {
    console.log('AppRoutes: Public form embed route detected', { currentPath, pathWithoutBasename })
    return (
      <Routes>
        <Route path="form/:id" element={<FormEmbed />} />
      </Routes>
    )
  }
  
  if (loading) {
    console.log('AppRoutes: Still loading')
    return (
      <div className={`min-h-screen flex items-center justify-center bg-[#111111]`}>
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
              theme === 'light' ? 'border-gray-600' : 'border-white'
            }`}></div>
          </div>
          <p className={theme === 'light' ? 'text-gray-600' : 'text-white/70'}>Loading...</p>
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
        <Route path="forms/:formId/responses" element={
          <ProtectedRoute adminOnly>
            <FormResponses />
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
    </Routes>
  )
}

function AppContent() {
  const { theme } = useTheme()
  
  // Use custom domain detection - if on custom domain, no basename needed
  const isCustomDomain = window.location.hostname !== 'noahung.github.io'
  const basename = import.meta.env.PROD && !isCustomDomain ? '/online-designer-beta' : '';
  
  return (
    <div className={`min-h-screen bg-[#111111]`}>
      <div className={`min-h-screen backdrop-blur-sm ${
        theme === 'light' ? 'bg-white/30' : 'bg-black/20'
      }`}>
        <AuthProvider>
          <ToastProvider>
            <Router basename={basename}>
              <AppRoutes />
            </Router>
          </ToastProvider>
        </AuthProvider>
      </div>
    </div>
  )
}

function App() {
  useEffect(() => {
    // Initialize performance optimizations
    initPerformanceOptimizations();
  }, []);

  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  )
}

export default App