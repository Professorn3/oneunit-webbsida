import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import About from './pages/About'
import Gallery from './pages/Gallery'
import News from './pages/News'
import Meetups from './pages/Meetups'
import Apply from './pages/Apply'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ComingSoon from './pages/ComingSoon'
import RegisterInvite from './pages/RegisterInvite'
import Chat from './components/Chat'
import Merch from './pages/Merch'
import Rules from './pages/Rules'
import ViewModeSwitcher from './components/ViewModeSwitcher'
import './App.css'
import ScrollToTop from './components/ScrollToTop'

function AppContent() {
  const location = useLocation()
  const { isAdmin, actualIsAdmin } = useAuth()
  
  const isLockedRoute = location.pathname !== '/login' && location.pathname !== '/register'
  
  // Låt faktiska admins navigera hela sajten utan att fastna i ComingSoon när de testar gäst-vy
  if (!isAdmin && !actualIsAdmin && isLockedRoute) {
    return <ComingSoon />
  }

  return (
    <>
      <ScrollToTop />
      <Navbar />
      <main>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/news" element={<News />} />
            <Route path="/meetups" element={<Meetups />} />
            <Route path="/merch" element={<Merch />} />
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
            <Route 
              path="/rules" 
              element={
                <ProtectedRoute requiredRole="member">
                  <Rules />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </AnimatePresence>
      </main>
      <Chat />
      <ViewModeSwitcher />
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
