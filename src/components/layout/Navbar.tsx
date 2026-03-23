import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UtensilsCrossed, Search, User, LogOut, LayoutDashboard, Database, ShoppingBag, Users } from 'lucide-react'
import { supabase } from '../../services/supabase'

const Navbar: React.FC = () => {
  const navigate = useNavigate()
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    const getRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        setRole(data?.role || 'diner')
      }
    }
    getRole()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <nav className="glass" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      padding: '1rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTop: 'none',
      borderLeft: 'none',
      borderRight: 'none',
      borderRadius: '0 0 24px 24px'
    }}>
      <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <img src="/logo.png" alt="Cookd" style={{ height: '32px', width: 'auto' }} />
        <span className="mobile-hide" style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--primary)', letterSpacing: '-0.02em' }}>Cookd</span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(1rem, 3vw, 2rem)' }}>
        {role === 'chef' ? (
          <>
            <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, color: 'var(--text-dim)' }}>
              <LayoutDashboard size={20} />
              <span className="mobile-hide">Dashboard</span>
            </Link>
            <Link to="/dashboard?tab=menu" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, color: 'var(--text-dim)' }}>
              <Database size={20} />
              <span className="mobile-hide">Menu</span>
            </Link>
            <Link to="/dashboard?tab=orders" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, color: 'var(--text-dim)' }}>
              <ShoppingBag size={20} />
              <span className="mobile-hide">Orders</span>
            </Link>
            <Link to="/dashboard?tab=subscribers" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, color: 'var(--text-dim)' }}>
              <Users size={20} />
              <span className="mobile-hide">Subscribers</span>
            </Link>
          </>
        ) : (
          <>
            <Link to="/browse" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, color: 'var(--text-dim)' }}>
              <Search size={20} />
              <span className="mobile-hide">Browse</span>
            </Link>
            <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, color: 'var(--text-dim)' }}>
              <LayoutDashboard size={20} />
              <span className="mobile-hide">Dashboard</span>
            </Link>
          </>
        )}
        
        <div style={{ height: '24px', width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>

        <button onClick={handleSignOut} style={{ color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <LogOut size={24} />
          <span className="mobile-hide" style={{ fontSize: '0.9rem', fontWeight: 600 }}>Sign Out</span>
        </button>
      </div>
    </nav>
  )
}

export default Navbar
