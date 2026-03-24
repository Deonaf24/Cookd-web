import React from 'react'
import Layout from '../../components/layout/Layout'
import { ArrowLeft, BellRing } from 'lucide-react'
import { Link } from 'react-router-dom'

const Notifications: React.FC = () => {
  return (
    <Layout>
      <div className="container" style={{ padding: '2rem 0' }}>
        <Link to="/account" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)', textDecoration: 'none', marginBottom: '2rem' }}>
          <ArrowLeft size={20} />
          Back to Account
        </Link>
        
        <header style={{ marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Notification Settings</h1>
          <p style={{ color: 'var(--text-dim)' }}>Control how you receive updates about your meals and chef.</p>
        </header>

        <div className="glass" style={{ padding: '3rem', borderRadius: '32px', textAlign: 'center' }}>
          <BellRing size={64} color="var(--primary)" style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
          <h2 style={{ marginBottom: '1rem' }}>Smart Notifications Coming Soon</h2>
          <p style={{ color: 'var(--text-dim)', maxWidth: '500px', margin: '0 auto' }}>
            We're building an integrated notification system to keep you in the loop with 
            real-time delivery updates and menu launches.
          </p>
        </div>
      </div>
    </Layout>
  )
}

export default Notifications
