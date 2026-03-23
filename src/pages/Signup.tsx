import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { UserPlus, Mail, Lock, User, AlertCircle, ChefHat, UserCircle } from 'lucide-react'
import { motion } from 'framer-motion'

const Signup: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState<'diner' | 'chef'>('diner')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role: role
        }
      }
    })
    
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/login') // Or directly to dashboard if auto-sign-in is enabled
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass"
        style={{
          width: '100%',
          maxWidth: '500px',
          padding: '3rem',
          borderRadius: '24px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Join Cookd</h2>
          <p style={{ color: 'var(--text-dim)' }}>Start your personal chef experience today</p>
        </div>

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                placeholder="First Name"
                required
                className="form-input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                style={{ paddingLeft: '2.8rem' }}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                placeholder="Last Name"
                required
                className="form-input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                style={{ paddingLeft: '2.8rem' }}
              />
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="email"
              placeholder="Email address"
              required
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ paddingLeft: '2.8rem' }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="password"
              placeholder="Create password"
              required
              min={6}
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingLeft: '2.8rem' }}
            />
          </div>

          <div style={{ marginTop: '0.5rem' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginBottom: '0.75rem' }}>Tell us your role:</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => setRole('diner')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '1rem',
                  borderRadius: '12px',
                  background: role === 'diner' ? 'rgba(255, 107, 53, 0.1)' : 'rgba(0,0,0,0.02)',
                  border: role === 'diner' ? '1.5px solid var(--primary)' : '1px solid #e2e8f0',
                  color: role === 'diner' ? 'var(--primary)' : 'var(--text-dim)',
                  fontWeight: 700,
                  transition: 'all 0.2s ease'
                }}
              >
                <UserCircle size={20} />
                Diner
              </button>
              <button
                type="button"
                onClick={() => setRole('chef')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '1rem',
                  borderRadius: '12px',
                  background: role === 'chef' ? 'rgba(46, 196, 182, 0.1)' : 'rgba(0,0,0,0.02)',
                  border: role === 'chef' ? '1.5px solid var(--secondary)' : '1px solid #e2e8f0',
                  color: role === 'chef' ? 'var(--secondary)' : 'var(--text-dim)',
                  fontWeight: 700,
                  transition: 'all 0.2s ease'
                }}
              >
                <ChefHat size={20} />
                Chef
              </button>
            </div>
          </div>

          {error && (
            <div style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            {loading ? 'Creating account...' : (
              <>
                <UserPlus size={20} />
                Sign Up
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-dim)' }}>Already have an account? </span>
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign In</Link>
        </div>
      </motion.div>
    </div>
  )
}

export default Signup
