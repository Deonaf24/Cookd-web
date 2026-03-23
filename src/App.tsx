import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Welcome from './pages/Welcome'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Browse from './pages/Browse'
import Dashboard from './pages/Dashboard'
import ChefProfile from './pages/ChefProfile'
import MealDetail from './pages/MealDetail'
import WeeklySelection from './pages/WeeklySelection'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/chef/:id" element={<ChefProfile />} />
        <Route path="/meal/:id" element={<MealDetail />} />
        <Route path="/selection/:chefId" element={<WeeklySelection />} />
      </Routes>
    </Router>
  )
}

export default App
