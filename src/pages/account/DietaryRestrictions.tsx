import React, { useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'
import Layout from '../../components/layout/Layout'
import { useAuth } from '../../context/AuthContext'
import { ArrowLeft, Check, ShieldAlert, Save } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const AVAILABLE_RESTRICTIONS = [
  "Vegetarian",
  "Vegan",
  "Pescatarian",
  "Gluten-Free",
  "Dairy-Free",
  "Nut-Free",
  "Soy-Free",
  "Keto",
  "Paleo",
  "Low-Carb",
  "Halal",
  "Kosher"
]

const DietaryRestrictions: React.FC = () => {
  const { user, profile, loading: authLoading } = useAuth()
  const [selected, setSelected] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    if (profile?.dietary_restrictions) {
      setSelected(profile.dietary_restrictions)
    }
  }, [profile])

  const toggleRestriction = (restriction: string) => {
    setSelected(prev => 
      prev.includes(restriction) 
        ? prev.filter(r => r !== restriction)
        : [...prev, restriction]
    )
  }

  const handleSave = async () => {
    if (!user) return
    setIsSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ dietary_restrictions: selected })
        .eq('id', user.id)

      if (error) throw error
      setMessage({ type: 'success', text: 'Preferences saved successfully!' })
      
      // Clear success message after 3s
      setTimeout(() => setMessage(null), 3000)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save preferences.' })
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading) return <Layout><div style={{ textAlign: 'center', padding: '5rem' }}>Loading preferences...</div></Layout>

  return (
    <Layout>
      <div className="container" style={{ padding: '3rem 0', maxWidth: '800px' }}>
        <Link to="/account" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)', textDecoration: 'none', marginBottom: '2rem', fontWeight: 600 }}>
          <ArrowLeft size={20} />
          Back to Account
        </Link>
        
        <header style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ background: 'var(--primary-light)', padding: '0.75rem', borderRadius: '12px' }}>
              <ShieldAlert size={32} color="var(--primary)" />
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Dietary Restrictions</h1>
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '1.2rem' }}>
            Select all that apply. This helps us tailor your culinary experience.
          </p>
        </header>

        <div className="glass" style={{ padding: '2.5rem', borderRadius: '32px', marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {AVAILABLE_RESTRICTIONS.map((restriction) => {
              const isActive = selected.includes(restriction)
              return (
                <button
                  key={restriction}
                  onClick={() => toggleRestriction(restriction)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.25rem 1.75rem',
                    borderRadius: '20px',
                    background: isActive ? 'var(--primary)' : 'var(--bg-soft)',
                    color: isActive ? 'white' : 'var(--text-main)',
                    border: '2px solid',
                    borderColor: isActive ? 'var(--primary)' : 'rgba(0,0,0,0.06)',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    fontWeight: 700,
                    fontSize: '1rem',
                    textAlign: 'left',
                    boxShadow: isActive ? '0 8px 16px -4px rgba(255,107,53,0.3)' : 'none'
                  }}
                  className={!isActive ? 'clickable' : ''}
                >
                  {restriction}
                  <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        >
                          <Check size={18} strokeWidth={3} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </button>
              )
            })}
          </div>

          <div style={{ marginTop: '3rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ minHeight: '1.5rem' }}>
              <AnimatePresence>
                {message && (
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    style={{ 
                      color: message.type === 'success' ? '#059669' : '#dc2626',
                      fontWeight: 600,
                      fontSize: '0.95rem'
                    }}
                  >
                    {message.text}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            
            <button 
              className="btn-primary" 
              onClick={handleSave} 
              disabled={isSaving}
              style={{ padding: '0.8rem 2.5rem' }}
            >
              {isSaving ? (
                <div className="loading-spinner" style={{ width: '20px', height: '20px' }} />
              ) : (
                <>
                  <Save size={20} />
                  Save Preferences
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default DietaryRestrictions
