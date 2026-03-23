import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { UserPlus, Mail, Lock, User, AlertCircle, ChefHat, UserCircle, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'

const Signup: React.FC = () => {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState<'diner' | 'chef'>('diner')
  
  // Chef-specific fields
  const [businessName, setBusinessName] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [location, setLocation] = useState('')
  const [bio, setBio] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault()
    if (role === 'chef') {
      setStep(2)
    } else {
      handleFinalSignup()
    }
  }

  const handleFinalSignup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setLoading(true)
    setError(null)
    
    // 1. SIGNUP (Auth)
    const { data: authData, error: signupError } = await supabase.auth.signUp({
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
    
    if (signupError) {
      setError(signupError.message)
      setLoading(false)
      return
    }

    // 2. INITIALIZE CHEF PROFILE (If Chef)
    if (role === 'chef' && authData.user) {
      const { error: chefError } = await supabase
        .from('chefs')
        .insert({
          id: authData.user.id,
          name: businessName || `${firstName} ${lastName}`,
          specialty: specialty || 'Private Chef',
          bio: bio || 'Welcome to my kitchen!',
          location: location || 'New York, NY',
          rating: 5.0
        })
      
      if (chefError) {
        console.error('Error creating chef record:', chefError)
        // We don't block navigation here as the Dashboard fallback will catch it,
        // but it's good to log.
      }
    }
    
    navigate('/login') // Redirect to login after successful signup
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
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass mobile-p-1"
        style={{
          width: '100%',
          maxWidth: '500px',
          padding: '3rem',
          borderRadius: 'var(--radius-lg)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            {step === 1 ? 'Join Cookd' : 'Chef Professional Profile'}
          </h2>
          <p style={{ color: 'var(--text-dim)' }}>
            {step === 1 
              ? 'Start your personal chef experience today' 
              : 'Tell us about your culinary expertise'}
          </p>
        </div>

        <form onSubmit={step === 1 ? handleNextStep : handleFinalSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {step === 1 ? (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
            >
              <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
            >
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Professional/Business Name</label>
                <input
                  type="text"
                  placeholder="e.g. Chef John Smith Kitchen"
                  className="form-input"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>

              <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Cuisine Specialty</label>
                  <input
                    type="text"
                    placeholder="e.g. Italian"
                    className="form-input"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Location</label>
                  <input
                    type="text"
                    placeholder="e.g. New York, NY"
                    className="form-input"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Professional Bio</label>
                <textarea
                  placeholder="Tell your potential diners about yourself..."
                  className="form-input"
                  style={{ minHeight: '120px', resize: 'vertical' }}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>

              <button 
                type="button" 
                onClick={() => setStep(1)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.9rem', width: 'fit-content' }}
              >
                ← Back to basic info
              </button>
            </motion.div>
          )}

          {error && (
            <div style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            {loading ? 'Processing...' : (
              <>
                {step === 1 && role === 'chef' ? (
                  <>Next: Profile Setup <ChevronRight size={20} /></>
                ) : (
                  <><UserPlus size={20} /> {step === 1 ? 'Sign Up' : 'Complete Registration'}</>
                )}
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
