import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import Layout from '../components/layout/Layout'
import { ArrowLeft, Flame, Info, ChevronRight, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { getPublicUrl, BUCKETS } from '../services/images'

interface Meal {
  id: string
  name: string
  description: string
  calories: number
  protein_grams: number
  carbs_grams: number
  fat_grams: number
  allergens: string[]
  ingredients: string[]
  image_name: string
}

const MealDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [meal, setMeal] = useState<Meal | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchMeal()
    }
  }, [id])

  const fetchMeal = async () => {
    const { data } = await supabase
      .from('meals')
      .select('*')
      .eq('id', id)
      .single()
    
    if (data) setMeal(data)
    setLoading(false)
  }

  if (loading) return <Layout><div style={{ textAlign: 'center', padding: '5rem' }}>Loading meal details...</div></Layout>
  if (!meal) return <Layout><div style={{ textAlign: 'center', padding: '5rem' }}>Meal not found.</div></Layout>

  return (
    <Layout>
      <div className="container" style={{ paddingBottom: '5rem', paddingTop: '2rem' }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)', marginBottom: '2rem' }}
        >
          <ArrowLeft size={20} /> Back
        </button>

        <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
          <div>
            <div style={{ 
              height: 'auto',
              minHeight: '280px', 
              background: meal.image_name ? `url(${getPublicUrl(BUCKETS.MEALS, meal.image_name)}) center/cover` : 'var(--bg-soft)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '2rem',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {!meal.image_name && <Info size={48} color="var(--primary)" opacity={0.3} />}
            </div>
            
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{meal.name}</h1>
            <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '2rem' }}>
              {meal.description}
            </p>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {meal.allergens?.map(allergen => (
                <span key={allergen} style={{ background: 'rgba(245, 101, 101, 0.1)', color: 'var(--error)', padding: '0.5rem 1rem', borderRadius: '100px', fontSize: '0.9rem', fontWeight: 600 }}>
                  {allergen}
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="glass" style={{ padding: '2rem', borderRadius: '24px' }}>
              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Flame size={24} color="var(--primary)" />
                Nutrition Facts
              </h3>
              <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Calories</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>{meal.calories}</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Protein</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>{meal.protein_grams}g</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Carbs</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>{meal.carbs_grams}g</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Fat</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>{meal.fat_grams}g</p>
                </div>
              </div>
            </div>

            <div className="glass" style={{ padding: '2rem', borderRadius: '24px' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Key Ingredients</h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {meal.ingredients?.map(ingredient => (
                  <li key={ingredient} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }}></div>
                    <span style={{ color: 'var(--text-dim)' }}>{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ padding: '1.5rem', borderRadius: '24px', background: 'rgba(72, 187, 120, 0.05)', border: '1px solid rgba(72, 187, 120, 0.2)', display: 'flex', gap: '1rem' }}>
              <ShieldCheck color="var(--success)" size={24} style={{ flexShrink: 0 }} />
              <div>
                <p style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.9rem' }}>Quality Guaranteed</p>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '0.25rem' }}>All meals are prepared fresh and meet strict safety standards.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default MealDetail
