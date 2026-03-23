import React, { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import Layout from '../components/layout/Layout'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, ChevronRight, User, TrendingUp, Users, Package, Settings, Plus, Bell, Info, Search } from 'lucide-react'
import { useSearchParams, Link } from 'react-router-dom'
import { MenuManagement, OrderManagement, SubscriberManagement } from '../components/dashboard/ChefSections'
import { getPublicUrl, BUCKETS } from '../services/images'

// --- Diner Dashboard Component ---
const DinerDashboard: React.FC<{ profile: any }> = ({ profile }) => {
  const [activeSubs, setActiveSubs] = useState<any[]>([])
  const [pendingSelections, setPendingSelections] = useState<any[]>([])
  const [recentMeals, setRecentMeals] = useState<any[]>([])
  const [discoveryChefs, setDiscoveryChefs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDinerData()
  }, [])

  const fetchDinerData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 1. Fetch active subscriptions with chef details
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('*, chefs(*, profiles(profile_image_url)), subscription_plans(*)')
      .eq('diner_id', user.id)
      .eq('status', 'active')
    
    // 2. Determine pending selections for next Sunday
    const nextSunday = getNextSunday()
    const dateStr = nextSunday.toISOString().split('T')[0]
    
    if (subs) {
      setActiveSubs(subs)
      const subIds = subs.map(s => s.id)
      
      const { data: existingOrders } = await supabase
        .from('weekly_orders')
        .select('subscription_id')
        .in('subscription_id', subIds)
        .eq('delivery_date', dateStr)
      
      const orderedSubIds = new Set(existingOrders?.map(o => o.subscription_id) || [])
      const pending = subs.filter(s => !orderedSubIds.has(s.id))
      setPendingSelections(pending)
    }

    // 3. Fetch recent delivered orders with meal images
    const { data: history } = await supabase
      .from('weekly_orders')
      .select('*, weekly_order_items(quantity, meals(*)), subscriptions!inner(chefs(*, profiles(profile_image_url)))')
      .eq('subscriptions.diner_id', user.id)
      .eq('status', 'delivered')
      .order('delivery_date', { ascending: false })
      .limit(5)
    
    setRecentMeals(history || [])

    // 4. Fetch Discovery Chefs (not subscribed to)
    if (subs) {
      const subscribedChefIds = subs.map(s => s.chef_id)
      const { data: chefs } = await supabase
        .from('chefs')
        .select('*, profiles(profile_image_url), subscription_plans(*)')
        .not('id', 'in', `(${subscribedChefIds.join(',') || '00000000-0000-0000-0000-000000000000'})`)
        .limit(4)
      setDiscoveryChefs(chefs || [])
    } else {
      const { data: chefs } = await supabase
        .from('chefs')
        .select('*, profiles(profile_image_url), subscription_plans(*)')
        .limit(4)
      setDiscoveryChefs(chefs || [])
    }
    
    setLoading(false)
  }

  const getNextSunday = () => {
    const d = new Date()
    d.setDate(d.getDate() + (7 - d.getDay()) % 7)
    return d
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '5rem' }}>Loading your kitchen...</div>

  const totalMeals = activeSubs.reduce((acc, sub) => acc + (sub.subscription_plans?.meal_count || 0), 0)
  const nextSunday = getNextSunday()

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '5rem' }}>
      {/* Hero Greeting Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass mobile-stack mobile-p-1"
        style={{ 
          padding: '3rem', 
          borderRadius: 'var(--radius-lg)', 
          marginBottom: '3rem',
          background: 'linear-gradient(135deg, rgba(255,107,53,0.05) 0%, rgba(255,255,255,0.8) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
          gap: '2rem'
        }}
      >
        <div>
          <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
            {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening'}, <span style={{ color: 'var(--primary)' }}>{profile?.first_name || 'Owen'}!</span>
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '1.25rem', fontWeight: 500 }}>
            {activeSubs.length > 0 ? "Ready for another week of world-class dining? 👨‍🍳" : "Let's find your perfect chef 🍳"}
          </p>
        </div>
        <div style={{ 
          width: '100px', 
          height: '100px', 
          borderRadius: '50%', 
          border: '4px solid white',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          flexShrink: 0,
          background: profile?.profile_image_url ? `url(${profile.profile_image_url.startsWith('http') ? profile.profile_image_url : getPublicUrl(BUCKETS.PROFILES, profile.profile_image_url)}) center/cover` : 'var(--bg-soft)'
        }}>
          {!profile?.profile_image_url && <User size={48} color="var(--primary)" style={{ margin: '26px' }} />}
        </div>
      </motion.div>

      {/* KPI Stats Row */}
      <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
        {[
          { label: 'Active Chefs', value: activeSubs.length, icon: Users, color: 'var(--primary)' },
          { label: 'Meals Per Week', value: totalMeals, icon: Package, color: 'var(--secondary)' },
          { label: 'Next Delivery', value: nextSunday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), icon: Calendar, color: '#3b82f6' }
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1 }}
            className="glass"
            style={{ padding: '1.5rem', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '1.25rem' }}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${kpi.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <kpi.icon size={24} color={kpi.color} />
            </div>
            <div>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1 }}>{kpi.value}</p>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', fontWeight: 600 }}>{kpi.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Action Required Section */}
      <AnimatePresence>
        {pendingSelections.map((sub, i) => (
          <motion.div 
            key={sub.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: i * 0.1 }}
            style={{ 
              background: 'linear-gradient(135deg, var(--primary) 0%, #ff9500 100%)',
              padding: '2rem',
              borderRadius: '24px',
              color: 'white',
              marginBottom: '3rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              boxShadow: '0 10px 30px rgba(255, 107, 53, 0.3)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Bell size={24} color="white" />
              <h3 style={{ margin: 0, fontWeight: 800 }}>Action Required</h3>
            </div>
            <p style={{ opacity: 0.9, fontSize: '1.15rem', fontWeight: 500 }}>
              Chef {sub.chefs?.name} is ready for your {sub.subscription_plans?.meal_count} meal choices for next Sunday!
            </p>
            <Link 
              to={`/selection/${sub.chefs?.id}?subscriptionId=${sub.id}`} 
              className="btn-primary" 
              style={{ background: 'white', color: 'var(--primary)', width: 'fit-content', fontWeight: 800, padding: '0.8rem 2rem' }}
            >
              Pick Meals
            </Link>
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: activeSubs.length > 0 ? '1fr 1fr' : '1fr', gap: '2.5rem', marginBottom: '4rem' }}>
        {/* Empty State / Get Started handled if activeSubs.length === 0 below discovery */}
        
        {/* Your Chefs Section */}
        {activeSubs.length > 0 && (
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Your Chefs</h3>
              <Link to="/browse" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem' }}>Manage Subscriptions</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {activeSubs.map(sub => {
                  const chefImage = sub.chefs?.profiles?.profile_image_url || getPublicUrl(BUCKETS.PROFILES, sub.chefs?.profile_image_name)
                  return (
                    <Link 
                      key={sub.id} 
                      to={`/chef/${sub.chefs?.id}`}
                      className="glass"
                      style={{ 
                        padding: '1.25rem', 
                        borderRadius: '24px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '1.25rem', 
                        textDecoration: 'none', 
                        color: 'inherit',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.transform = 'translateY(-4px)'
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'var(--shadow-premium)'
                      }}
                    >
                      <div style={{ 
                        width: '64px', 
                        height: '64px', 
                        borderRadius: '18px', 
                        background: chefImage ? `url(${chefImage}) center/cover` : 'var(--bg-soft)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {!chefImage && <User size={24} color="var(--primary)" opacity={0.3} />}
                      </div>
                      <div>
                        <p style={{ fontWeight: 800, fontSize: '1.1rem' }}>Chef {sub.chefs?.name}</p>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', fontWeight: 500 }}>{sub.subscription_plans?.meal_count} meals / week</p>
                      </div>
                      <ChevronRight size={20} style={{ marginLeft: 'auto', color: 'var(--text-dim)' }} />
                    </Link>
                  )
                })}
            </div>
          </section>
        )}

        {/* Recent Meals Section */}
        {activeSubs.length > 0 && (
          <section>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Recent Meals</h3>
            <div className="glass" style={{ padding: '2rem', borderRadius: '32px' }}>
              {recentMeals.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {recentMeals.map((order: any) => (
                    <div key={order.id} style={{ display: 'flex', gap: '1.25rem', paddingBottom: '1.5rem', borderBottom: '1.5px solid rgba(0,0,0,0.03)' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>{new Date(order.delivery_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</p>
                        <p style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 700 }}>{order.subscriptions?.chefs?.name}</p>
                        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {order.weekly_order_items.map((item: any) => (
                            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <div style={{ 
                                width: '40px', 
                                height: '40px', 
                                borderRadius: '12px', 
                                background: item.meals?.image_name ? `url(${getPublicUrl(BUCKETS.MEALS, item.meals.image_name)}) center/cover` : 'var(--bg-soft)',
                                flexShrink: 0,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                              }} />
                              <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 500 }}>
                                <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{item.quantity}x</span> {item.meals?.name}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ alignSelf: 'flex-start' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.4rem 0.8rem', borderRadius: '100px', background: '#dcfce7', color: 'var(--success)' }}>
                          DELIVERED
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <Package size={48} color="var(--primary)" opacity={0.1} style={{ marginBottom: '1.5rem' }} />
                  <p style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.5rem' }}>No orders yet</p>
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', lineHeight: 1.5 }}>Your culinary journey starts here. Your history will appear after your first delivery.</p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Discovery / Explore Section */}
      <section style={{ marginBottom: '5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.5rem' }}>Explore New Flavors</h3>
            <p style={{ color: 'var(--text-dim)', fontWeight: 500 }}>Find more talented chefs to complement your palate.</p>
          </div>
          <Link to="/browse" className="btn-secondary" style={{ padding: '0.75rem 1.5rem', borderRadius: '12px' }}>
            View All <ChevronRight size={18} />
          </Link>
        </div>
        
        <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
          {discoveryChefs.map(chef => {
            const chefImage = chef.profiles?.profile_image_url || getPublicUrl(BUCKETS.PROFILES, chef.profile_image_name)
            return (
              <Link 
                key={chef.id} 
                to={`/chef/${chef.id}`}
                className="glass"
                style={{ 
                  borderRadius: '24px', 
                  overflow: 'hidden', 
                  textDecoration: 'none', 
                  color: 'inherit',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div style={{ height: '140px', background: chefImage ? `url(${chefImage}) center/cover` : 'var(--bg-soft)' }} />
                <div style={{ padding: '1.25rem' }}>
                  <p style={{ fontWeight: 800, marginBottom: '0.25rem' }}>{chef.name}</p>
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', fontWeight: 600 }}>Starting from ${chef.subscription_plans?.[0]?.weekly_price || 0}/wk</p>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

    </div>
  )
}

// --- Profile Settings Component (Chef) ---
const ProfileSettings: React.FC<{ profile: any }> = ({ profile }) => {
  const [chefData, setChefData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchChefData()
  }, [])

  const fetchChefData = async () => {
    const { data } = await supabase
      .from('chefs')
      .select('*')
      .eq('id', profile.id)
      .single()
    setChefData(data)
    setLoading(false)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase
      .from('chefs')
      .update({
        name: chefData.name,
        specialty: chefData.specialty,
        bio: chefData.bio,
        location: chefData.location
      })
      .eq('id', profile.id)
    
    if (error) {
      setMessage('Error updating profile: ' + error.message)
    } else {
      setMessage('Profile updated successfully!')
      setTimeout(() => setMessage(''), 3000)
    }
    setSaving(false)
  }

  if (loading) return <div>Loading settings...</div>

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass mobile-p-1" 
      style={{ padding: '2.5rem', borderRadius: 'var(--radius-lg)', maxWidth: '800px' }}
    >
      <h2 style={{ marginBottom: '2rem', fontSize: '2rem' }}>Professional Profile</h2>
      <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Professional Name</label>
          <input 
            className="form-input"
            value={chefData?.name || ''} 
            onChange={e => setChefData({...chefData, name: e.target.value})}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="mobile-stack">
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Cuisine Specialty</label>
            <input 
              className="form-input"
              value={chefData?.specialty || ''} 
              onChange={e => setChefData({...chefData, specialty: e.target.value})}
              placeholder="e.g. Italian & Mediterranean"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Location</label>
            <input 
              className="form-input"
              value={chefData?.location || ''} 
              onChange={e => setChefData({...chefData, location: e.target.value})}
            />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Professional Bio</label>
          <textarea 
            className="form-input"
            style={{ minHeight: '120px', resize: 'vertical' }}
            value={chefData?.bio || ''} 
            onChange={e => setChefData({...chefData, bio: e.target.value})}
          />
        </div>
        
        {message && <p style={{ color: message.includes('Error') ? 'var(--error)' : 'var(--success)', fontWeight: 600, fontSize: '0.9rem' }}>{message}</p>}
        
        <button type="submit" disabled={saving} className="btn-primary" style={{ width: 'fit-content', marginTop: '1rem' }}>
          {saving ? 'Saving...' : 'Save Profile Changes'}
        </button>
      </form>
    </motion.section>
  )
}

// --- Chef Dashboard Component ---
const ChefDashboard: React.FC<{ profile: any }> = ({ profile }) => {
  const [searchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'overview'
  
  const [metrics, setMetrics] = useState({
    subscribers: 0,
    revenue: 0,
    activeMeals: 0,
    pendingPortions: 0,
    meals: [] as any[]
  })

  useEffect(() => {
    fetchChefMetrics()
  }, [])

  const fetchChefMetrics = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 0. CHECK IF CHEF INITIALIZED IN 'chefs' TABLE
    const { data: chefCheck } = await supabase
      .from('chefs')
      .select('id')
      .eq('id', user.id)
      .single()
    
    if (!chefCheck) {
      // Auto-initialize chef record
      await supabase
        .from('chefs')
        .insert({
          id: user.id,
          name: `${profile.first_name} ${profile.last_name}`,
          specialty: 'Private Chef',
          bio: 'Welcome! I am passionate about creating memorable dining experiences.',
          rating: 5.0,
          location: 'New York, NY'
        })
    }

    // Active Subscribers & Revenue
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('*, subscription_plans(weekly_price)')
      .eq('chef_id', user.id)
      .eq('status', 'active')
    
    // Active Meals (Fetch actual data for preview)
    const { data: meals, count: mealCount } = await supabase
      .from('meals')
      .select('*', { count: 'exact' })
      .eq('chef_id', user.id)
      .eq('is_available', true)
      .limit(3) // Only for preview

    // Pending Portions from Weekly Orders
    const { data: pendingOrders } = await supabase
      .from('weekly_orders')
      .select('*, weekly_order_items(quantity), subscriptions!inner(chef_id)')
      .eq('subscriptions.chef_id', user.id)
      .eq('status', 'pending')

    const totalRevenue = subs?.reduce((acc, sub: any) => acc + (sub.subscription_plans?.weekly_price || 0), 0) || 0
    const totalPortions = pendingOrders?.reduce((acc, order: any) => {
      return acc + (order.weekly_order_items?.reduce((oAcc: number, item: any) => oAcc + item.quantity, 0) || 0)
    }, 0) || 0

    setMetrics({
      subscribers: subs?.length || 0,
      revenue: totalRevenue,
      activeMeals: mealCount || 0,
      pendingPortions: totalPortions,
      meals: meals || []
    })
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'menu':
        return <MenuManagement chefId={profile?.id} />
      case 'orders':
        return <OrderManagement chefId={profile?.id} />
      case 'subscribers':
        return <SubscriberManagement chefId={profile?.id} />
      case 'settings':
        return <ProfileSettings profile={profile} />
      default:
        return (
          <>
            <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
              {[
                { label: 'Active Subscribers', value: metrics.subscribers, icon: Users, color: '#3b82f6' },
                { label: 'Weekly Revenue', value: `$${metrics.revenue}`, icon: TrendingUp, color: '#10b981' },
                { label: 'Pending Portions', value: metrics.pendingPortions, icon: Package, color: '#f59e0b' },
                { label: 'Active Meals', value: metrics.activeMeals, icon: Calendar, color: '#8b5cf6' }
              ].map((kpi, i) => (
                <motion.div 
                  key={kpi.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass mobile-p-1" 
                  style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}
                >
                  <kpi.icon size={24} color={kpi.color} style={{ marginBottom: '1rem' }} />
                  <p style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>{kpi.value}</p>
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>{kpi.label}</p>
                </motion.div>
              ))}
            </div>

            <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
              <section className="glass mobile-p-1" style={{ padding: '2rem', borderRadius: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Package size={24} color="var(--primary)" />
                    Menu Management
                  </h3>
                  <Link to="/dashboard?tab=menu" style={{ color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}>
                    View Full Menu <ChevronRight size={18} />
                  </Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {metrics.meals.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {metrics.meals.map((meal: any) => (
                        <div key={meal.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--bg-soft)', borderRadius: '16px' }}>
                          <div style={{ 
                            width: '50px', 
                            height: '50px', 
                            borderRadius: '12px', 
                            background: meal.image_name ? `url(${getPublicUrl(BUCKETS.MEALS, meal.image_name)}) center/cover` : 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {!meal.image_name && <Package size={20} color="var(--primary)" opacity={0.3} />}
                          </div>
                          <div>
                            <p style={{ fontWeight: 600 }}>{meal.name}</p>
                            <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>{meal.calories} kcal • {meal.protein_grams}g protein</p>
                          </div>
                          <div style={{ marginLeft: 'auto', padding: '0.25rem 0.75rem', borderRadius: '100px', background: 'var(--success-light)', color: 'var(--success)', fontSize: '0.75rem', fontWeight: 700 }}>
                            Active
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '3rem', background: 'var(--bg-soft)', borderRadius: '16px' }}>
                      You haven't added any meals yet.
                    </p>
                  )}
                </div>
              </section>

              <section className="glass" style={{ padding: '2rem', borderRadius: '24px' }}>
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Settings size={24} color="var(--secondary)" />
                  Quick Actions
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    { label: 'Subscriber List', icon: Users, tab: 'subscribers' },
                    { label: 'Order History', icon: Clock, tab: 'orders' },
                    { label: 'Profile Settings', icon: User, tab: 'settings' }
                  ].map(action => (
                    <Link 
                      key={action.label}
                      to={`/dashboard?tab=${action.tab}`}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '1rem', 
                        padding: '1rem', 
                        background: 'var(--bg-soft)', 
                        border: 'none', 
                        borderRadius: '16px',
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'left',
                        transition: 'background 0.2s ease',
                        textDecoration: 'none',
                        color: 'inherit'
                      }}
                    >
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <action.icon size={20} color="var(--primary)" />
                      </div>
                      <span style={{ fontWeight: 600 }}>{action.label}</span>
                      <ChevronRight size={16} style={{ marginLeft: 'auto', color: 'var(--text-dim)' }} />
                    </Link>
                  ))}
                </div>
              </section>
            </div>
          </>
        )
    }
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '5rem' }}>
      <header className="mobile-stack" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Chef {profile?.first_name || 'Panel'}</h1>
          <p style={{ color: 'var(--text-dim)' }}>
            {activeTab === 'overview' && 'Manage your kitchen, menu, and subscribers in one place.'}
            {activeTab === 'menu' && 'Manage your subscription plans and meal catalog.'}
            {activeTab === 'orders' && 'Fulfill your weekly meal orders.'}
            {activeTab === 'subscribers' && 'View and manage your active subscribers.'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {activeTab === 'menu' && (
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}>
              <Plus size={20} /> New Meal
            </button>
          )}
          <div className="glass" style={{ 
            width: '60px', 
            height: '60px', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
            background: profile?.profile_image_url ? `url(${profile.profile_image_url.startsWith('http') ? profile.profile_image_url : getPublicUrl(BUCKETS.PROFILES, profile.profile_image_url)}) center/cover` : 'var(--bg-soft)'
          }}>
            {!profile?.profile_image_url && <User size={32} color="var(--primary)" />}
          </div>
        </div>
      </header>

      {renderContent()}
    </div>
  )
}

import { useAuth } from '../context/AuthContext'

const Dashboard: React.FC = () => {
  const { profile } = useAuth()

  // Note: loading state and auth check is handled by ProtectedRoute in App.tsx
  // If we reach this point, profile is already being fetched/available in context
  
  if (!profile) return <Layout><div style={{ textAlign: 'center', padding: '5rem' }}>Loading profile...</div></Layout>

  return (
    <Layout>
      {profile.role === 'chef' ? (
        <ChefDashboard profile={profile} />
      ) : (
        <DinerDashboard profile={profile} />
      )}
    </Layout>
  )
}

export default Dashboard
