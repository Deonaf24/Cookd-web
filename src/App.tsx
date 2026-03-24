import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Welcome from './pages/Welcome'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Browse from './pages/Browse'
import Dashboard from './pages/Dashboard'
import ChefProfile from './pages/ChefProfile'
import MealDetail from './pages/MealDetail'
import WeeklySelection from './pages/WeeklySelection'
import Account from './pages/Account'
import DietaryRestrictions from './pages/account/DietaryRestrictions'
import Notifications from './pages/account/Notifications'
import Payments from './pages/account/Payments'

import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Routes */}
          <Route path="/browse" element={<ProtectedRoute><Browse /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/chef/:id" element={<ProtectedRoute><ChefProfile /></ProtectedRoute>} />
          <Route path="/meal/:id" element={<ProtectedRoute><MealDetail /></ProtectedRoute>} />
          <Route path="/selection/:chefId" element={<ProtectedRoute><WeeklySelection /></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
          <Route path="/account/dietary" element={<ProtectedRoute><DietaryRestrictions /></ProtectedRoute>} />
          <Route path="/account/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/account/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
