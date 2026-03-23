import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import Layout from '../components/layout/Layout'
import { Star, MapPin, ChefHat, Check, Info, UtensilsCrossed } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getPublicUrl, BUCKETS } from '../services/images'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import CheckoutModal from '../components/CheckoutModal'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

interface Plan {
  id: number
  meal_count: number
  weekly_price: number
  selection_mode: string
  batch_size: number
}

interface Meal {
  id: string
  name: string
  description: string
  calories: number
  image_name: string
  is_available: boolean
}

interface Chef {
  id: string
  name: string
  specialty: string
  bio: string
  rating: number
  location: string
  profile_image_name: string
  profiles?: {
    profile_image_url: string | null
  }
}

const ChefProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [chef, setChef] = useState<Chef | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [meals, setMeals] = useState<Meal[]>([])
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [currentSubscription, setCurrentSubscription] = useState<any>(null)
  const [isManaging, setIsManaging] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchChefData()
    }
  }, [id])

  const fetchChefData = async () => {
    setLoading(true)
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setUserProfile({ ...profile, email: user.email })
    }
    
    // Fetch Chef
    const { data: chefData } = await supabase
      .from('chefs')
      .select('*, profiles(profile_image_url)')
      .eq('id', id)
      .single()
    
    // Fetch Plans
    const { data: plansData } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('chef_id', id)
    
    // Fetch Meals
    const { data: mealsData } = await supabase
      .from('meals')
      .select('*')
      .eq('chef_id', id)
      .eq('is_available', true)
    
    // Fetch Subscription if logged in
    if (user && id) {
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*, subscription_plans(*)')
        .eq('diner_id', user.id)
        .eq('chef_id', id)
        .eq('status', 'active')
        .single()
      
      if (subData) {
        setCurrentSubscription(subData)
        // Auto-select the current plan if subscribed
        const activePlan = plansData?.find(p => p.id === subData.plan_id)
        if (activePlan) setSelectedPlan(activePlan)
      }
    }
    
    if (chefData) setChef(chefData)
    if (plansData) setPlans(plansData)
    if (mealsData) setMeals(mealsData)
    
    setLoading(false)
  }

  const handleCancelSubscription = async () => {
    if (!currentSubscription) return
    const confirm = window.confirm("Are you sure you want to cancel your subscription to Chef " + chef?.name + "? You'll lose access to weekly meal selections.")
    if (!confirm) return

    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('id', currentSubscription.id)
    
    if (error) {
      alert("Error cancelling subscription: " + error.message)
    } else {
      setCurrentSubscription(null)
      setIsManaging(false)
      alert("Subscription cancelled successfully.")
    }
  }

  const handleSubscribe = () => {
    if (!selectedPlan) return
    if (!userProfile) {
      alert("Please log in to subscribe.")
      return
    }
    setIsCheckoutOpen(true)
  }

  const handlePaymentSuccess = async (subscriptionId: string) => {
    setIsCheckoutOpen(false)
    // The subscription row is already inserted by the Edge Function or we should do it here if it's not.
    // Looking at create-subscription/index.ts, it DOES NOT insert into the 'subscriptions' table.
    // It only creates the Stripe subscription.
    // So we MUST insert it here after successful payment confirmation.
    
    try {
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          diner_id: userProfile.id,
          chef_id: id,
          plan_id: selectedPlan?.id,
          status: 'active',
          stripe_subscription_id: subscriptionId
        })
      
      if (error) throw error

      await fetchChefData()
      alert("Successfully subscribed! Your chef has been notified.")
    } catch (err: any) {
      alert("Payment was successful but we couldn't activate your subscription in our database: " + err.message)
    }
  }

  if (loading) return <Layout><div style={{ textAlign: 'center', padding: '5rem' }}>Loading chef profile...</div></Layout>
  if (!chef) return <Layout><div style={{ textAlign: 'center', padding: '5rem' }}>Chef not found.</div></Layout>

  return (
    <Layout>
      <div className="container" style={{ paddingBottom: '5rem', paddingTop: '2rem' }}>
        <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '3rem' }}>
          
          {/* Main Content */}
          <div>
            <header style={{ marginBottom: '2.5rem' }}>
              <div className="mobile-stack" style={{ 
                height: 'auto',
                minHeight: '250px', 
                background: (() => {
                  const imageUrl = chef.profiles?.profile_image_url || getPublicUrl(BUCKETS.PROFILES, chef.profile_image_name);
                  return imageUrl ? `url(${imageUrl}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--accent))';
                })(),
                borderRadius: 'var(--radius-lg)',
                marginBottom: '2rem',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-lg)'
              }}>
                {!(chef.profiles?.profile_image_url || chef.profile_image_name) && <ChefHat size={100} color="rgba(255,255,255,0.2)" />}
                <div style={{ 
                  position: 'absolute', 
                  bottom: '2rem', 
                  left: '2rem',
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '1.5rem'
                }}>
                  <div className="glass" style={{ padding: '0.5rem 1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Star size={20} fill="var(--accent)" color="var(--accent)" />
                    <span style={{ fontWeight: 700, fontSize: '1.2rem' }}>{chef.rating || '5.0'}</span>
                  </div>
                </div>
              </div>
              
              <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{chef.name}</h1>
              <p style={{ color: 'var(--primary)', fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>{chef.specialty}</p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: 'var(--text-dim)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={20} />
                  <span>{chef.location || 'New York, NY'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ChefHat size={20} />
                  <span>Certified Private Chef</span>
                </div>
              </div>
            </header>

            <section style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>About the Chef</h2>
              <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', lineHeight: '1.6' }}>
                {chef.bio}
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '2rem' }}>Weekly Menu</h2>
              <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {meals.map((meal) => (
                  <Link to={`/meal/${meal.id}`} key={meal.id}>
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className="glass" 
                      style={{ borderRadius: '20px', overflow: 'hidden', display: 'flex', height: '140px' }}
                    >
                      <div style={{ 
                        width: '140px', 
                        background: meal.image_name ? `url(${getPublicUrl(BUCKETS.MEALS, meal.image_name)}) center/cover` : 'var(--bg-soft)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}>
                        {!meal.image_name && <UtensilsCrossed size={40} color="var(--primary)" />}
                      </div>
                      <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{meal.name}</h4>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginBottom: '0.75rem' }}>{meal.calories} cal</p>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--success)', background: 'rgba(72, 187, 120, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '6px', alignSelf: 'flex-start' }}>Available</span>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar / Plans */}
          <aside>
            <div className="glass" style={{ position: 'sticky', top: '100px', padding: '2rem', borderRadius: '32px' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>
                {currentSubscription ? 'Your Subscription' : 'Choose Your Plan'}
              </h3>
              
              {currentSubscription && (
                <div style={{ 
                  background: 'rgba(72, 187, 120, 0.1)', 
                  border: '1.5px solid var(--success)', 
                  borderRadius: '16px', 
                  padding: '1rem', 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  color: 'var(--success)'
                }}>
                  <Check size={20} />
                  <div>
                    <p style={{ fontWeight: 800, fontSize: '0.9rem' }}>Currently Subscribed</p>
                    <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>Renews weekly</p>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                {plans.map((plan) => {
                  const isActive = currentSubscription?.plan_id === plan.id
                  return (
                    <div 
                      key={plan.id}
                      onClick={() => !currentSubscription && setSelectedPlan(plan)}
                      style={{
                        padding: '1.25rem',
                        borderRadius: '16px',
                        background: (selectedPlan?.id === plan.id || isActive) ? 'var(--primary-light)' : 'var(--background)',
                        border: (selectedPlan?.id === plan.id || isActive) ? '2px solid var(--primary)' : '1px solid #e2e8f0',
                        cursor: currentSubscription ? 'default' : 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: (selectedPlan?.id === plan.id || isActive) ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 700 }}>{plan.meal_count} Meals / Week</span>
                        {(selectedPlan?.id === plan.id || isActive) && <Check size={20} color="var(--primary)" />}
                      </div>
                      <p style={{ fontSize: '1.2rem', fontWeight: 800 }}>${plan.weekly_price}<span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text-dim)' }}>/wk</span></p>
                      
                      {isActive && (
                        <span style={{ 
                          position: 'absolute', 
                          top: '-10px', 
                          right: '10px', 
                          background: 'var(--success)', 
                          color: 'white', 
                          fontSize: '0.65rem', 
                          fontWeight: 800, 
                          padding: '2px 8px', 
                          borderRadius: '100px',
                          textTransform: 'uppercase'
                        }}>
                          Active Plan
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              {currentSubscription ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {isManaging ? (
                    <>
                      <button 
                        className="btn-primary" 
                        style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem', background: '#e53e3e', borderColor: '#e53e3e' }}
                        onClick={handleCancelSubscription}
                      >
                        Confirm Cancellation
                      </button>
                      <button 
                        className="btn-secondary" 
                        style={{ width: '100%', padding: '1rem' }}
                        onClick={() => setIsManaging(false)}
                      >
                        Nevermind, Go Back
                      </button>
                    </>
                  ) : (
                    <button 
                      className="btn-secondary" 
                      style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                      onClick={() => setIsManaging(true)}
                    >
                      Manage Subscription
                    </button>
                  )}
                </div>
              ) : (
                <button 
                  className="btn-primary" 
                  style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  disabled={!selectedPlan}
                  onClick={handleSubscribe}
                >
                  {selectedPlan ? `Subscribe - $${selectedPlan.weekly_price}/wk` : 'Select a Plan'}
                </button>
              )}
              
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                <Info size={16} style={{ flexShrink: 0 }} />
                <p>
                  {currentSubscription 
                    ? "You can manage your portions and delivery details from your dashboard each week."
                    : "Subscriptions renew automatically every week. Cancel anytime from your dashboard."
                  }
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
      
      {selectedPlan && userProfile && (
        <Elements stripe={stripePromise}>
          <CheckoutModal 
            isOpen={isCheckoutOpen}
            onClose={() => setIsCheckoutOpen(false)}
            onSuccess={handlePaymentSuccess}
            plan={selectedPlan}
            chef={chef}
            diner={userProfile}
          />
        </Elements>
      )}
    </Layout>
  )
}

export default ChefProfile
