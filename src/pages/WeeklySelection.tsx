import React, { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import Layout from '../components/layout/Layout'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, ChevronLeft, Minus, Plus, UtensilsCrossed, Info, X, Flame, ShieldCheck, ChevronRight } from 'lucide-react'
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
  const [selectedMealForNutrition, setSelectedMealForNutrition] = useState<any>(null)

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
                border: selectedQuantities[meal.id] > 0 ? '1.5px solid var(--primary)' : '1px solid transparent',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedMealForNutrition(meal)}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem' }}>
                  Tap for Details <ChevronRight size={16} />
                </div>
              </div>

              <div 
                style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-soft)', padding: '0.5rem', borderRadius: '16px' }}
                onClick={(e) => e.stopPropagation()}
              >
                {selectionMode === 'single_choice' ? (
                  <button 
                    onClick={() => setSelectedQuantities({ [meal.id]: requiredMeals })}
                    className={selectedQuantities[meal.id] > 0 ? 'btn-primary' : 'btn-secondary'}
                    style={{ 
                      padding: '0.75rem 1.5rem', 
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      minWidth: '130px',
                      justifyContent: 'center'
                    }}
                  >
                    {selectedQuantities[meal.id] > 0 ? (
                      <>
                        <CheckCircle size={18} /> Selected
                      </>
                    ) : (
                      'Select Meal'
                    )}
                  </button>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedMealForNutrition && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMealForNutrition(null)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="glass"
              style={{ 
                position: 'relative', 
                width: '100%', 
                maxWidth: '700px', 
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '0', 
                borderRadius: '32px',
                background: 'white',
                boxShadow: '0 32px 64px -16px rgba(0,0,0,0.3)' 
              }}
            >
              <button 
                onClick={() => setSelectedMealForNutrition(null)}
                style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 10, background: 'rgba(255,255,255,0.9)', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              >
                <X size={24} />
              </button>

              <div style={{ 
                height: '300px', 
                background: selectedMealForNutrition.image_name ? `url(${getPublicUrl(BUCKETS.MEALS, selectedMealForNutrition.image_name)}) center/cover` : 'var(--bg-soft)',
                width: '100%'
              }} />

              <div style={{ padding: '2.5rem' }}>
                <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '0.75rem' }}>{selectedMealForNutrition.name}</h2>
                <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', lineHeight: '1.7', marginBottom: '2.5rem' }}>
                  {selectedMealForNutrition.description}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }} className="mobile-stack">
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <Flame size={20} color="var(--primary)" />
                      Nutrition Facts
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={{ padding: '1rem', background: 'var(--bg-soft)', borderRadius: '16px' }}>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.2rem' }}>Calories</p>
                        <p style={{ fontSize: '1.2rem', fontWeight: 900 }}>{selectedMealForNutrition.calories}</p>
                      </div>
                      <div style={{ padding: '1rem', background: 'var(--bg-soft)', borderRadius: '16px' }}>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.2rem' }}>Protein</p>
                        <p style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--primary)' }}>{selectedMealForNutrition.protein_grams}g</p>
                      </div>
                      <div style={{ padding: '1rem', background: 'var(--bg-soft)', borderRadius: '16px' }}>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.2rem' }}>Carbs</p>
                        <p style={{ fontSize: '1.2rem', fontWeight: 900 }}>{selectedMealForNutrition.carbs_grams}g</p>
                      </div>
                      <div style={{ padding: '1rem', background: 'var(--bg-soft)', borderRadius: '16px' }}>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.2rem' }}>Fats</p>
                        <p style={{ fontSize: '1.2rem', fontWeight: 900 }}>{selectedMealForNutrition.fat_grams}g</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.5rem' }}>Key Ingredients</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                      {selectedMealForNutrition.ingredients?.map((ing: string) => (
                        <span key={ing} style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', borderRadius: '10px', background: 'var(--bg-soft)', color: 'var(--text-main)', fontWeight: 500 }}>
                          {ing}
                        </span>
                      ))}
                    </div>

                    {selectedMealForNutrition.allergens?.length > 0 && (
                      <div style={{ marginTop: '2rem' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.8rem', color: 'var(--error)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          ⚠️ Contains
                        </h3>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {selectedMealForNutrition.allergens.map((allergen: string) => (
                            <span key={allergen} style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', fontWeight: 700 }}>
                              {allergen}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: '3rem', paddingTop: '2.5rem', borderTop: '1px solid var(--primary-light)', display: 'flex', justifyContent: 'center' }}>
                  <button 
                    className="btn-primary" 
                    style={{ padding: '1rem 3rem', fontSize: '1.1rem', borderRadius: '20px' }}
                    onClick={() => {
                      if (selectionMode === 'single_choice') {
                        setSelectedQuantities({ [selectedMealForNutrition.id]: requiredMeals });
                      } else if (totalSelected < requiredMeals) {
                        handleUpdateQuantity(selectedMealForNutrition.id, 1);
                      }
                      setSelectedMealForNutrition(null);
                    }}
                  >
                    {selectedQuantities[selectedMealForNutrition.id] > 0 ? 'Excellent Choice' : 'Add to Selection'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  )
}

export default WeeklySelection
