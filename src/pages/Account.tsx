import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '../services/supabase'
import Layout from '../components/layout/Layout'
import { useAuth } from '../context/AuthContext'
import { 
  User, 
  Camera, 
  Pencil, 
  Check, 
  X, 
  ChevronRight, 
  ShieldAlert, 
  Bell, 
  CreditCard, 
  LogOut,
  ChefHat,
  MapPin,
  Utensils
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { getPublicUrl, BUCKETS } from '../services/images'

const Account: React.FC = () => {
  const { user, profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [chefDetails, setChefDetails] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)

  // Edit States
  const [editFirstName, setEditFirstName] = useState('')
  const [editLastName, setEditLastName] = useState('')
  const [editChefName, setEditChefName] = useState('')
  const [editChefSpecialty, setEditChefSpecialty] = useState('')
  const [editChefLocation, setEditChefLocation] = useState('')
  const [editChefBio, setEditChefBio] = useState('')

  useEffect(() => {
    if (user && profile) {
      setEditFirstName(profile.first_name || '')
      setEditLastName(profile.last_name || '')
      
      if (profile.role === 'chef') {
        fetchChefDetails()
      }
    }
  }, [user, profile])

  const fetchChefDetails = async () => {
    if (!user) return
    const { data } = await supabase
      .from('chefs')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (data) {
      setChefDetails(data)
      setEditChefName(data.name || '')
      setEditChefSpecialty(data.specialty || '')
      setEditChefLocation(data.location || '')
      setEditChefBio(data.bio || '')
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploadLoading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}.${fileExt}`
      const filePath = `${fileName}`

      // 1. Upload to storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKETS.PROFILES)
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // 2. Update profile record
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_image_url: filePath }) // We store the path and use getPublicUrl later
        .eq('id', user.id)

      if (updateError) throw updateError

      // Note: AuthContext should ideally refresh, or we can refresh local profile if needed
      window.location.reload() // Quick fix for demo, should be more reactive
    } catch (err: any) {
      alert("Error uploading image: " + err.message)
    } finally {
      setUploadLoading(false)
    }
  }

  const saveProfile = async () => {
    if (!user || !profile) return
    setIsSaving(true)

    try {
      // 1. Update Profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: editFirstName,
          last_name: editLastName
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      // 2. Update Chef if applicable
      if (profile.role === 'chef') {
        const { error: chefError } = await supabase
          .from('chefs')
          .update({
            name: editChefName,
            specialty: editChefSpecialty,
            location: editChefLocation,
            bio: editChefBio
          })
          .eq('id', user.id)
        
        if (chefError) throw chefError
      }

      setIsEditing(false)
      // Refresh logic here (or reload)
      window.location.reload()
    } catch (err: any) {
      alert("Error saving profile: " + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading) return <Layout><div style={{ textAlign: 'center', padding: '5rem' }}>Loading account...</div></Layout>
  if (!user) return <Layout><div style={{ textAlign: 'center', padding: '5rem' }}>Please log in to view your account.</div></Layout>

  const profileImageUrl = profile.profile_image_url ? getPublicUrl(BUCKETS.PROFILES, profile.profile_image_url) : null

  return (
    <Layout>
      <div className="container" style={{ padding: '3rem 0', maxWidth: '800px' }}>
        <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '0.5rem' }}>Account</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '1.2rem' }}>Personalize your Cookd experience</p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Profile Card */}
          <div className="glass" style={{ padding: '2.5rem', borderRadius: '32px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', textAlign: 'center' }}>
              
              {/* Avatar Section */}
              <div style={{ position: 'relative' }}>
                <div style={{ 
                  width: '120px', 
                  height: '120px', 
                  borderRadius: '50%', 
                  background: profileImageUrl ? `url(${profileImageUrl}) center/cover` : 'var(--bg-soft)',
                  border: isEditing ? '4px solid var(--primary)' : '4px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-lg)'
                }}>
                  {!profileImageUrl && <User size={50} color="var(--primary)" />}
                  {uploadLoading && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div className="loading-spinner" style={{ width: '30px', height: '30px' }} />
                    </div>
                  )}
                </div>
                {isEditing && (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    style={{ 
                      position: 'absolute', 
                      bottom: '5px', 
                      right: '5px', 
                      background: 'var(--primary)', 
                      color: 'white', 
                      border: 'none', 
                      width: '36px', 
                      height: '36px', 
                      borderRadius: '50%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: 'var(--shadow-md)'
                    }}
                  >
                    <Camera size={18} />
                  </button>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>

              {/* Identity Section */}
              <AnimatePresence mode="wait">
                {isEditing ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">First Name</label>
                        <input className="form-input" value={editFirstName} onChange={e => setEditFirstName(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Last Name</label>
                        <input className="form-input" value={editLastName} onChange={e => setEditLastName(e.target.value)} />
                      </div>
                    </div>
                    
                    {profile.role === 'chef' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                        <div className="form-group">
                          <label className="form-label">Chef / Business Name</label>
                          <input className="form-input" value={editChefName} onChange={e => setEditChefName(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Specialty</label>
                          <input className="form-input" value={editChefSpecialty} onChange={e => setEditChefSpecialty(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Location</label>
                          <input className="form-input" value={editChefLocation} onChange={e => setEditChefLocation(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Bio</label>
                          <textarea 
                            className="form-input" 
                            style={{ minHeight: '100px', resize: 'vertical' }}
                            value={editChefBio} 
                            onChange={e => setEditChefBio(e.target.value)} 
                          />
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                      <button className="btn-primary" style={{ flex: 1 }} onClick={saveProfile} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsEditing(false)}>
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>
                      {profile.first_name} {profile.last_name}
                    </h2>
                    <p style={{ color: 'var(--text-dim)', marginTop: '0.25rem' }}>{user.email}</p>
                    <div style={{ 
                      marginTop: '1rem', 
                      display: 'inline-flex', 
                      background: 'rgba(255,107,53,0.1)', 
                      color: 'var(--primary)', 
                      padding: '0.4rem 1rem', 
                      borderRadius: '100px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}>
                      {profile.role}
                    </div>

                    {profile.role === 'chef' && chefDetails && (
                      <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left', background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <ChefHat size={20} color="var(--primary)" />
                          <span style={{ fontWeight: 600 }}>{chefDetails.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <Utensils size={20} color="var(--primary)" />
                          <span style={{ color: 'var(--text-dim)' }}>{chefDetails.specialty}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <MapPin size={20} color="var(--primary)" />
                          <span style={{ color: 'var(--text-dim)' }}>{chefDetails.location}</span>
                        </div>
                        <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-dim)', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                          {chefDetails.bio}
                        </p>
                      </div>
                    )}

                    <button 
                      className="btn-secondary" 
                      style={{ marginTop: '2rem', padding: '0.5rem 2rem', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '2rem auto 0' }}
                      onClick={() => setIsEditing(true)}
                    >
                      <Pencil size={16} />
                      Edit Profile
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Preferences Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            <Link to="/account/dietary" className="glass clickable" style={{ padding: '1.5rem', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ background: 'var(--primary-light)', padding: '0.75rem', borderRadius: '12px' }}>
                <ShieldAlert size={24} color="var(--primary)" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700 }}>Dietary Restrictions</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Allergies & preferences</p>
              </div>
              <ChevronRight size={20} color="var(--text-dim)" />
            </Link>

            <Link to="/account/notifications" className="glass clickable" style={{ padding: '1.5rem', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ background: 'var(--primary-light)', padding: '0.75rem', borderRadius: '12px' }}>
                <Bell size={24} color="var(--primary)" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700 }}>Notifications</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Email & push alerts</p>
              </div>
              <ChevronRight size={20} color="var(--text-dim)" />
            </Link>

            <Link to="/account/payments" className="glass clickable" style={{ padding: '1.5rem', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ background: 'var(--primary-light)', padding: '0.75rem', borderRadius: '12px' }}>
                <CreditCard size={24} color="var(--primary)" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700 }}>Payment Methods</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Cards & billing</p>
              </div>
              <ChevronRight size={20} color="var(--text-dim)" />
            </Link>
          </div>

          {/* Logout Section */}
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '24px', border: '1px solid rgba(229, 62, 62, 0.2)' }}>
            <button 
              onClick={handleSignOut}
              style={{ 
                width: '100%', 
                background: 'none', 
                border: 'none', 
                color: '#e53e3e', 
                fontWeight: 700, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '0.75rem',
                cursor: 'pointer',
                fontSize: '1.1rem'
              }}
            >
              <LogOut size={20} />
              Sign Out from Cookd
            </button>
          </div>

        </div>
      </div>
    </Layout>
  )
}

export default Account
