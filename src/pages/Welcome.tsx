import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UtensilsCrossed } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

const Welcome: React.FC = () => {
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard')
    }
  }, [user, loading, navigate])
  return (
    <div className="welcome-container" style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(rgba(255,107,53,0.05), rgba(255,107,53,0.1)), url("https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-1.2.1&auto=format&fit=crop&w=2850&q=80")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="glass mobile-p-1"
        style={{
          padding: '4rem 3rem',
          borderRadius: 'var(--radius-lg)',
          maxWidth: '700px',
          width: '100%',
          border: '1px solid rgba(255,255,255,0.6)',
          boxShadow: '0 30px 60px -12px rgba(0,0,0,0.15)'
        }}
      >
        <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'center' }}>
          <img src="/logo.png" alt="Cookd Logo" style={{ height: '70px', width: 'auto' }} />
        </div>
        
        <h1 style={{ fontSize: '4.5rem', fontWeight: 900, marginBottom: '1rem', lineHeight: 1, letterSpacing: '-0.05em', color: 'var(--text-main)' }}>
          Dine <span style={{ color: 'var(--primary)' }}>Different.</span>
        </h1>
        
        <p style={{ fontSize: '1.4rem', color: 'var(--text-dim)', marginBottom: '3.5rem', fontWeight: 500, lineHeight: 1.4 }}>
          The world's finest private chefs, <br />
          delivered to your doorstep.
        </p>
        
        <div className="mobile-stack" style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center' }}>
          <Link to="/signup" className="btn-primary">
            Get Started
          </Link>
          <Link to="/login" className="btn-secondary">
            Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default Welcome
