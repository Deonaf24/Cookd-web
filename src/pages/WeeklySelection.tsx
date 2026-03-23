import React, { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import Layout from '../components/layout/Layout'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, ChevronLeft, Minus, Plus, UtensilsCrossed, Info } from 'lucide-react'
import { getPublicUrl, BUCKETS } from '../services/images'

const WeeklySelection: React.FC = () => {
  const { chefId } = useParams()
  const [searchParams] = useSearchParams()
  const subscriptionId = searchParams.get('subscriptionId')
  const navigate = useNavigate()

  const [chef, setChef] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [meals, setMeals] = useState<any[]>([])
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    fetchSelectionData()
  }, [chefId, subscriptionId])

  const fetchSelectionData = async () => {
    if (!chefId || !subscriptionId) return

    const [chefRes, subRes, mealsRes] = await Promise.all([
      supabase.from('chefs').select('*').eq('id', chefId).single(),
      supabase.from('subscriptions').select('*, subscription_plans(*)').eq('id', subscriptionId).single(),
      supabase.from('meals').select('*').eq('chef_id', chefId).eq('is_available', true)
    ])

    setChef(chefRes.data)
    setSubscription(subRes.data)
    setMeals(mealsRes.data || [])
    setLoading(false)
  }

  const requiredMeals = subscription?.subscription_plans?.meal_count || 0
  const selectionMode = subscription?.subscription_plans?.selection_mode || 'free_choice'
  const batchSize = Math.max(1, subscription?.subscription_plans?.batch_size || 1)
  const totalSelected = Object.values(selectedQuantities).reduce((a, b) => a + b, 0)

  const isValid = () => {
    if (selectionMode === 'single_choice') {
      return totalSelected === requiredMeals && Object.keys(selectedQuantities).length === 1
    }
    if (selectionMode === 'batch_choice') {
      return totalSelected === requiredMeals && Object.values(selectedQuantities).every(q => q % batchSize === 0)
    }
    return totalSelected === requiredMeals
  }

  const handleUpdateQuantity = (mealId: string, delta: number) => {
    const current = selectedQuantities[mealId] || 0
    const step = selectionMode === 'batch_choice' ? batchSize : 1
    const next = Math.max(0, current + (delta * step))

    if (totalSelected + (next - current) <= requiredMeals) {
      if (selectionMode === 'single_choice') {
        setSelectedQuantities({ [mealId]: requiredMeals })
      } else {
        setSelectedQuantities(prev => ({
          ...prev,
          [mealId]: next
        }))
      }
    }
  }

  const handleSubmit = async () => {
    if (!isValid() || submitting) return
    setSubmitting(true)

    try {
      const nextSunday = new Date()
      nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()) % 7)
      const dateStr = nextSunday.toISOString().split('T')[0]

      const { data: order, error: orderErr } = await supabase
        .from('weekly_orders')
        .insert({
          subscription_id: subscriptionId,
          delivery_date: dateStr,
          status: 'pending'
        })
        .select()
        .single()

      if (orderErr) throw orderErr

      const items = Object.entries(selectedQuantities)
        .filter(([_, qty]) => qty > 0)
        .map(([mealId, qty]) => ({
          weekly_order_id: order.id,
          meal_id: mealId,
          quantity: qty
        }))

      const { error: itemsErr } = await supabase
        .from('weekly_order_items')
        .insert(items)

      if (itemsErr) throw itemsErr

      setConfirmed(true)
    } catch (err) {
      alert('Failed to save selection. Please try again.')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Layout><div style={{ textAlign: 'center', padding: '5rem' }}>Loading menu...</div></Layout>

  if (confirmed) {
    return (
      <Layout>
        <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <CheckCircle size={80} color="var(--success)" style={{ marginBottom: '2rem' }} />
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Meals Locked In!</h1>
            <p style={{ color: 'var(--text-dim)', fontSize: '1.2rem', marginBottom: '3rem' }}>
              Your {requiredMeals} meals for next week have been confirmed with Chef {chef?.name}.
            </p>
            <button className="btn-primary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
          </motion.div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <header style={{ marginBottom: '2rem' }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)', cursor: 'pointer', marginBottom: '1rem' }}
          >
            <ChevronLeft size={20} /> Back to Dashboard
          </button>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Pick Your Meals</h1>
          <p style={{ color: 'var(--text-dim)' }}>
            Choose {requiredMeals} meals from Chef {chef?.name}'s menu.
          </p>
        </header>

        <div style={{ position: 'sticky', top: '100px', zIndex: 10, marginBottom: '2rem' }}>
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1.5px solid var(--primary-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UtensilsCrossed size={24} color="var(--primary)" />
              </div>
              <div>
                <p style={{ fontWeight: 800, fontSize: '1.2rem' }}>{totalSelected} / {requiredMeals}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Portions Selected</p>
              </div>
            </div>
            <button 
              className="btn-primary" 
              disabled={!isValid() || submitting}
              onClick={handleSubmit}
              style={{ padding: '0.75rem 2rem' }}
            >
              {submitting ? 'Locking in...' : 'Lock in Meals'}
            </button>
          </div>
          {!isValid() && totalSelected === requiredMeals && (
            <div style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', background: 'var(--error-light)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--error)', fontSize: '0.85rem' }}>
              <Info size={16} />
              {selectionMode === 'single_choice' ? 'Please pick exactly 1 meal type for all portions.' : `Please select meals in batches of ${batchSize}.`}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '4rem' }}>
          {meals.map(meal => (
            <motion.div 
              key={meal.id} 
              className="glass"
              style={{ 
                padding: '1.25rem', 
                borderRadius: '24px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1.5rem',
                border: selectedQuantities[meal.id] > 0 ? '1.5px solid var(--primary)' : '1px solid transparent'
              }}
            >
              <div style={{ 
                width: '100px', 
                height: '100px', 
                borderRadius: '16px', 
                background: meal.image_name ? `url(${getPublicUrl(BUCKETS.MEALS, meal.image_name)}) center/cover` : 'var(--bg-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {!meal.image_name && <UtensilsCrossed size={32} color="var(--primary)" opacity={0.3} />}
              </div>
              
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>{meal.name}</h3>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{meal.calories} kcal • {meal.protein_grams}g protein</p>
                <button 
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', padding: 0 }}
                  onClick={() => {/* View detail modal can go here */}}
                >
                  View Nutrition Details
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-soft)', padding: '0.5rem', borderRadius: '16px' }}>
                <button 
                  onClick={() => handleUpdateQuantity(meal.id, -1)}
                  style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-dim)' }}
                  disabled={!selectedQuantities[meal.id]}
                >
                  <Minus size={20} />
                </button>
                <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: 800, fontSize: '1.2rem' }}>
                  {selectedQuantities[meal.id] || 0}
                </span>
                <button 
                  onClick={() => handleUpdateQuantity(meal.id, 1)}
                  style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'var(--primary)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
                  disabled={totalSelected >= requiredMeals}
                >
                  <Plus size={20} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Layout>
  )
}

export default WeeklySelection
