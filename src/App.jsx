import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Gallery from './pages/Gallery'
import News from './pages/News'
import Apply from './pages/Apply'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ComingSoon from './pages/ComingSoon'
import RegisterInvite from './pages/RegisterInvite'
import './App.css'

function AppContent() {
  const location = useLocation()
  const { isAdmin } = useAuth()
  
  const isLockedRoute = location.pathname !== '/login' && location.pathname !== '/register'
  
  if (!isAdmin && isLockedRoute) {
    return <ComingSoon />
  }

  return (
    <>
      <Navbar />
      <main>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/news" element={<News />} />
            <Route path="/apply" element={<Apply />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<RegisterInvite />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="noise" aria-hidden="true" />
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
