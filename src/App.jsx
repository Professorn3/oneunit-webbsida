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
import AuthAction from './pages/AuthAction'
import Contact from './pages/Contact'
import Chat from './components/Chat'
import Merch from './pages/Merch'
import Rules from './pages/Rules'
import Ticket from './pages/Ticket'
import ViewModeSwitcher from './components/ViewModeSwitcher'
import PageTransition from './components/PageTransition'
import './App.css'
import ScrollToTop from './components/ScrollToTop'

function AppContent() {
  const location = useLocation()
  const { isAdmin, actualIsAdmin } = useAuth()
  
  const path = location.pathname.replace(/\/$/, '');
  const isLockedRoute = !['/login', '/register', '/auth-action'].includes(path);
  
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
            <Route path="/" element={<PageTransition><Home /></PageTransition>} />
            <Route path="/about" element={<PageTransition><About /></PageTransition>} />
            <Route path="/gallery" element={<PageTransition><Gallery /></PageTransition>} />
            <Route path="/news" element={<PageTransition><News /></PageTransition>} />
            <Route path="/meetups" element={<PageTransition><Meetups /></PageTransition>} />
            <Route path="/merch" element={<PageTransition><Merch /></PageTransition>} />
            <Route path="/apply" element={<PageTransition><Apply /></PageTransition>} />
            <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
            <Route path="/auth-action" element={<PageTransition><AuthAction /></PageTransition>} />
            <Route path="/register" element={<PageTransition><RegisterInvite /></PageTransition>} />
            <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
            <Route path="/ticket/:id" element={<PageTransition><Ticket /></PageTransition>} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <PageTransition><Dashboard /></PageTransition>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/rules" 
              element={
                <ProtectedRoute requiredRole="member">
                  <PageTransition><Rules /></PageTransition>
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
