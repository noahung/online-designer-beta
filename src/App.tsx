import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import Layout from './components/Layout'
import LoginForm from './components/LoginForm'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import Forms from './pages/Forms'
import Responses from './pages/Responses'
import Settings from './pages/Settings'
import FormBuilder from './pages/FormBuilder'
import FormEmbed from './pages/FormEmbed'
import ClientResponses from './pages/ClientResponses'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  
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
  
  return <>{children}</>
}

function AppRoutes() {
  const { user, loading } = useAuth()
  
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
    return <LoginForm />
  }
  
  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/" element={<Layout />}>
        {/* Admin routes - temporarily showing all routes since we removed client system */}
        <Route index element={<Dashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="forms" element={<Forms />} />
        <Route path="forms/new" element={<FormBuilder />} />
        <Route path="forms/edit/:id" element={<FormBuilder />} />
        <Route path="responses" element={<Responses />} />
        <Route path="settings" element={<Settings />} />
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
  )
}

export default App