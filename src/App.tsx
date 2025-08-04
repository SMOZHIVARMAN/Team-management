import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout/Layout'
import Login from './components/Auth/Login'
import Signup from './components/Auth/Signup'
import Dashboard from './pages/Dashboard'
import Todo from './pages/Todo'
import Calendar from './pages/Calendar'
import Projects from './pages/Projects'
import Chat from './pages/Chat'
import Notifications from './pages/Notifications'
import Activity from './pages/Activity'
import Friends from './pages/Friends'
import Profile from './pages/Profile'

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />
}

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  return user ? <Navigate to="/dashboard" replace /> : <>{children}</>
}

const AppContent: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid #374151',
            fontSize: '14px',
          },
        }}
      />
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route 
          path="/" 
          element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="todo" element={<Todo />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="projects" element={<Projects />} />
          <Route path="chat" element={<Chat />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="activity" element={<Activity />} />
          <Route path="friends" element={<Friends />} />
          <Route path="profile" element={<Profile />} />
          <Route index element={<Navigate to="/dashboard" replace />} />
        </Route>

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  )
}

export default App