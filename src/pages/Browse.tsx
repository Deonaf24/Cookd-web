import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import Layout from '../components/layout/Layout'
import { Search, Star, MapPin, ChefHat } from 'lucide-react'
import { motion } from 'framer-motion'
import { getPublicUrl, BUCKETS } from '../services/images'

interface Chef {
  id: string
  name: string
  specialty: string
  bio: string
  rating: number
  profile_image_name: string
  location: string
  profiles?: {
    profile_image_url: string | null
  }
}

const Browse: React.FC = () => {
  const [chefs, setChefs] = useState<Chef[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchChefs()
  }, [])

  const fetchChefs = async () => {
    const { data, error } = await supabase
      .from('chefs')
      .select(`
        *,
        profiles(profile_image_url)
      `)
    
    if (data) {
      setChefs(data as any)
    }
    setLoading(false)
  }

  const filteredChefs = chefs.filter(chef => 
    chef.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chef.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Layout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Discover Your Personal Chef</h1>
          <div style={{ position: 'relative', maxWidth: '600px' }}>
            <Search size={20} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="Search by name or cuisine..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '1.25rem 1.25rem 1.25rem 3.5rem',
                borderRadius: '16px',
                background: 'var(--background)',
                border: '1.5px solid #e2e8f0',
                color: 'var(--text-main)',
                fontSize: '1.1rem',
                outline: 'none',
                boxShadow: 'var(--shadow-sm)'
              }}
            />
          </div>
        </header>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem' }}>Loading chefs...</div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', 
            gap: '2rem' 
          }}>
            {filteredChefs.map((chef, index) => (
              <motion.div
                key={chef.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
              >
                <Link 
                  to={`/chef/${chef.id}`}
                  className="glass"
                  style={{
                    display: 'block',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'transform 0.3s ease'
                  }}
                >
                  <div style={{ 
                    height: '200px', 
                    background: (() => {
                      const imageUrl = chef.profiles?.profile_image_url || getPublicUrl(BUCKETS.PROFILES, chef.profile_image_name);
                      return imageUrl ? `url(${imageUrl}) center/cover` : 'linear-gradient(135deg, var(--primary), #ffc107)';
                    })(),
                    position: 'relative'
                  }}>
                    {!(chef.profiles?.profile_image_url || chef.profile_image_name) && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                        <ChefHat size={80} color="white" />
                      </div>
                    )}
                  </div>
                
                <div style={{ padding: '2.5rem 1.5rem 1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.4rem' }}>{chef.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent)' }}>
                      <Star size={18} fill="currentColor" />
                      <span style={{ fontWeight: 600 }}>{chef.rating || '5.0'}</span>
                    </div>
                  </div>
                  
                  <p style={{ color: 'var(--primary)', fontWeight: 500, marginBottom: '1rem' }}>{chef.specialty}</p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    <MapPin size={16} />
                    {chef.location || 'New York, NY'}
                  </div>
                  
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '2rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {chef.bio}
                  </p>
                  
                  <button className="btn-secondary" style={{ width: '100%' }}>View Profile & Menu</button>
                </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Browse
