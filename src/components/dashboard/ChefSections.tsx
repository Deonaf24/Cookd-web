import React, { useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'
import { Plus, Edit2, Trash2, Check, X, UtensilsCrossed, TrendingUp, User, Camera } from 'lucide-react'
import { getPublicUrl, BUCKETS } from '../../services/images'

// --- Menu Management ---
export const MenuManagement: React.FC<{ chefId: string }> = ({ chefId }) => {
  const [meals, setMeals] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddingMeal, setIsAddingMeal] = useState(false)
  const [isAddingPlan, setIsAddingPlan] = useState(false)
  const [editingMealId, setEditingMealId] = useState<string | null>(null)
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [newMeal, setNewMeal] = useState({ 
    name: '', 
    description: '', 
    calories: '', 
    protein_grams: '', 
    carbs_grams: '', 
    fat_grams: '',
    allergens: '',
    ingredients: ''
  })
  const [newPlan, setNewPlan] = useState({ 
    meal_count: '', 
    weekly_price: '', 
    selection_mode: 'free_choice',
    batch_size: 2
  })
  const [mealImage, setMealImage] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    fetchMenuData()
  }, [chefId])

  const fetchMenuData = async () => {
    setLoading(true)
    const { data: mealData } = await supabase
      .from('meals')
      .select('*')
      .eq('chef_id', chefId)
    
    const { data: planData } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('chef_id', chefId)
      .order('meal_count', { ascending: true })

    if (mealData) setMeals(mealData)
    if (planData) setPlans(planData)
    setLoading(false)
  }

  const handleSaveMeal = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)
    
    let imagePath = null
    if (mealImage) {
      const fileExt = mealImage.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const { data, error: uploadError } = await supabase.storage
        .from(BUCKETS.MEALS)
        .upload(fileName, mealImage)
      
      if (!uploadError) {
        imagePath = fileName
      }
    }

    const mealData = { 
      name: newMeal.name,
      description: newMeal.description,
      calories: parseInt(newMeal.calories) || 0,
      protein_grams: parseInt(newMeal.protein_grams) || 0,
      carbs_grams: parseInt(newMeal.carbs_grams) || 0,
      fat_grams: parseInt(newMeal.fat_grams) || 0,
      allergens: newMeal.allergens.split(',').map(s => s.trim()).filter(s => s),
      ingredients: newMeal.ingredients.split(',').map(s => s.trim()).filter(s => s),
      chef_id: chefId,
      image_name: imagePath || (editingMealId ? meals.find(m => m.id === editingMealId)?.image_name : null),
      is_available: true 
    }

    const { error } = editingMealId 
      ? await supabase.from('meals').update(mealData).eq('id', editingMealId)
      : await supabase.from('meals').insert([mealData])
    
    if (!error) {
      setIsAddingMeal(false)
      setEditingMealId(null)
      setMealImage(null)
      setNewMeal({ name: '', description: '', calories: '', protein_grams: '', carbs_grams: '', fat_grams: '', allergens: '', ingredients: '' })
      fetchMenuData()
    }
    setIsUploading(false)
  }

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    const planData = { 
      meal_count: parseInt(newPlan.meal_count) || 0,
      weekly_price: parseFloat(newPlan.weekly_price) || 0,
      selection_mode: newPlan.selection_mode,
      batch_size: newPlan.selection_mode === 'batch_choice' ? newPlan.batch_size : 1,
      chef_id: chefId 
    }

    const { error } = editingPlanId
      ? await supabase.from('subscription_plans').update(planData).eq('id', editingPlanId)
      : await supabase.from('subscription_plans').insert([planData])

    if (!error) {
      setIsAddingPlan(false)
      setEditingPlanId(null)
      setNewPlan({ meal_count: '', weekly_price: '', selection_mode: 'free_choice', batch_size: 2 })
      fetchMenuData()
    }
  }

  const startEditMeal = (meal: any) => {
    setNewMeal({
      name: meal.name,
      description: meal.description || '',
      calories: meal.calories.toString(),
      protein_grams: meal.protein_grams.toString(),
      carbs_grams: (meal.carbs_grams || 0).toString(),
      fat_grams: (meal.fat_grams || 0).toString(),
      allergens: (meal.allergens || []).join(', '),
      ingredients: (meal.ingredients || []).join(', ')
    })
    setEditingMealId(meal.id)
    setIsAddingMeal(true)
    window.scrollTo({ top: 400, behavior: 'smooth' })
  }

  const startEditPlan = (plan: any) => {
    setNewPlan({
      meal_count: plan.meal_count.toString(),
      weekly_price: plan.weekly_price.toString(),
      selection_mode: plan.selection_mode,
      batch_size: plan.batch_size || 2
    })
    setEditingPlanId(plan.id)
    setIsAddingPlan(true)
  }

  const toggleAvailability = async (mealId: string, currentStatus: boolean) => {
    await supabase
      .from('meals')
      .update({ is_available: !currentStatus })
      .eq('id', mealId)
    fetchMenuData()
  }

  const deleteMeal = async (mealId: string) => {
    if (confirm('Are you sure you want to delete this meal?')) {
      await supabase.from('meals').delete().eq('id', mealId)
      fetchMenuData()
    }
  }

  const deletePlan = async (planId: string) => {
    if (confirm('Are you sure you want to delete this subscription plan? Tiers already purchased by active subscribers will not be affected.')) {
      await supabase.from('subscription_plans').delete().eq('id', planId)
      fetchMenuData()
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading menu data...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Plans Section */}
      <section className="glass mobile-p-1" style={{ padding: '2rem', borderRadius: '24px' }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <TrendingUp size={24} color="var(--primary)" />
          Subscription Plans
        </h3>
        <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
          {plans.map(plan => (
            <div key={plan.id} style={{ padding: '1.5rem', background: 'var(--bg-soft)', borderRadius: '16px', border: '1px solid var(--primary-light)' }}>
              <p style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>{plan.meal_count} Meals / Week</p>
              <p style={{ color: 'var(--primary)', fontSize: '1.5rem', fontWeight: 800 }}>${plan.weekly_price}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>Mode: {plan.selection_mode}</p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button onClick={() => startEditPlan(plan)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}><Edit2 size={18} /></button>
                <button onClick={() => deletePlan(plan.id)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
          
          {isAddingPlan ? (
            <form onSubmit={handleSavePlan} style={{ gridColumn: '1 / -1' }} className="glass">
              <div style={{ padding: '2rem', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid var(--primary-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontWeight: 800 }}>{editingPlanId ? 'Edit Subscription Plan' : 'New Subscription Plan'}</h4>
                  <button type="button" onClick={() => { setIsAddingPlan(false); setEditingPlanId(null); }} style={{ color: 'var(--text-dim)' }}><X size={20} /></button>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="mobile-stack">
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Meals per Week</label>
                    <input type="number" placeholder="e.g. 5" className="form-input" value={newPlan.meal_count} onChange={e => setNewPlan({...newPlan, meal_count: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Weekly Price ($)</label>
                    <input type="number" placeholder="e.g. 150" className="form-input" value={newPlan.weekly_price} onChange={e => setNewPlan({...newPlan, weekly_price: e.target.value})} required />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Selection Mode</label>
                  <select 
                    className="form-input" 
                    value={newPlan.selection_mode} 
                    onChange={e => setNewPlan({...newPlan, selection_mode: e.target.value})}
                    style={{ width: '100%', paddingRight: '2rem' }}
                  >
                    <option value="single_choice">Single Choice (Diner picks one meal type)</option>
                    <option value="free_choice">Free Choice (Diner picks any combination)</option>
                    <option value="batch_choice">Batch Choice (Diner picks in increments)</option>
                  </select>
                </div>

                {newPlan.selection_mode === 'batch_choice' && (
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Batch Size (2-10)</label>
                    <input type="number" min="2" max="10" className="form-input" value={newPlan.batch_size} onChange={e => setNewPlan({...newPlan, batch_size: parseInt(e.target.value)})} required />
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }}>{editingPlanId ? 'Update Plan' : 'Save Plan'}</button>
                  {editingPlanId && (
                    <button type="button" className="btn-secondary" style={{ color: 'var(--error)' }} onClick={() => deletePlan(editingPlanId)}>Delete Plan</button>
                  )}
                  <button type="button" onClick={() => { setIsAddingPlan(false); setEditingPlanId(null); }} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                </div>
              </div>
            </form>
          ) : (
            <button 
              onClick={() => { setIsAddingPlan(true); setEditingPlanId(null); setNewPlan({ meal_count: '', weekly_price: '', selection_mode: 'free_choice', batch_size: 2 }); }}
              style={{ padding: '1.5rem', border: '2px dashed var(--primary-light)', borderRadius: '16px', background: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <Plus size={24} /> Add Plan
            </button>
          )}
        </div>
      </section>

      {/* Meals Section */}
      <section className="glass mobile-p-1" style={{ padding: '2rem', borderRadius: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <UtensilsCrossed size={24} color="var(--primary)" />
            Meal Catalog
          </h3>
          <button onClick={() => { setIsAddingMeal(true); setEditingMealId(null); setNewMeal({ name: '', description: '', calories: '', protein_grams: '', carbs_grams: '', fat_grams: '', allergens: '', ingredients: '' }); }} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={20} /> Add New Meal
          </button>
        </div>

        {isAddingMeal && (
          <form onSubmit={handleSaveMeal} className="glass" style={{ padding: '2.5rem', borderRadius: '32px', marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '2rem', border: '1px solid var(--primary-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{editingMealId ? 'Edit Meal Item' : 'Create New Meal Item'}</h4>
              <button type="button" onClick={() => { setIsAddingMeal(false); setEditingMealId(null); }} style={{ color: 'var(--text-dim)' }}><X size={24} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }} className="mobile-stack">
              {/* Image Section */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem', background: 'var(--bg-soft)', borderRadius: '24px', border: '2px dashed var(--primary-light)', height: '100%', justifyContent: 'center' }}>
                {mealImage ? (
                  <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '200px' }}>
                    <img src={URL.createObjectURL(mealImage)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }} />
                    <button type="button" onClick={() => setMealImage(null)} style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--error)', color: 'white', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                      <X size={16} />
                    </button>
                  </div>
                ) : editingMealId && meals.find(m => m.id === editingMealId)?.image_name ? (
                  <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '200px' }}>
                    <img src={getPublicUrl(BUCKETS.MEALS, meals.find(m => m.id === editingMealId)!.image_name!)} alt="Current" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }} />
                    <label style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'var(--primary)', color: 'white', padding: '0.5rem 1rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                      Change Photo
                      <input type="file" accept="image/*" hidden onChange={e => setMealImage(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                ) : (
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <Camera size={48} color="var(--primary)" opacity={0.5} />
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontWeight: 700, color: 'var(--text-main)' }}>Upload Photo</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>High-res JPG/PNG</p>
                    </div>
                    <input type="file" accept="image/*" hidden onChange={e => setMealImage(e.target.files?.[0] || null)} />
                  </label>
                )}
              </div>

              {/* Basic Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Meal Name</label>
                  <input placeholder="e.g. Lemon Herb Salmon" className="form-input" value={newMeal.name} onChange={e => setNewMeal({...newMeal, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Brief Description</label>
                  <textarea placeholder="Describe the flavors and preparation..." className="form-input" style={{ minHeight: '100px' }} value={newMeal.description} onChange={e => setNewMeal({...newMeal, description: e.target.value})} required />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }} className="mobile-grid-2">
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Calories</label>
                <input type="number" placeholder="500" className="form-input" value={newMeal.calories} onChange={e => setNewMeal({...newMeal, calories: e.target.value})} required />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Protein (g)</label>
                <input type="number" placeholder="30" className="form-input" value={newMeal.protein_grams} onChange={e => setNewMeal({...newMeal, protein_grams: e.target.value})} required />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Carbs (g)</label>
                <input type="number" placeholder="40" className="form-input" value={newMeal.carbs_grams} onChange={e => setNewMeal({...newMeal, carbs_grams: e.target.value})} required />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Fat (g)</label>
                <input type="number" placeholder="15" className="form-input" value={newMeal.fat_grams} onChange={e => setNewMeal({...newMeal, fat_grams: e.target.value})} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="mobile-stack">
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Key Ingredients</label>
                <input placeholder="Garlic, Onion, Salmon..." className="form-input" value={newMeal.ingredients} onChange={e => setNewMeal({...newMeal, ingredients: e.target.value})} />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Allergens</label>
                <input placeholder="Gluten, Dairy, Nuts..." className="form-input" value={newMeal.allergens} onChange={e => setNewMeal({...newMeal, allergens: e.target.value})} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn-primary" style={{ flex: 2, padding: '1rem' }} disabled={isUploading}>
                {isUploading ? <div className="loading-spinner" style={{ width: '20px', height: '20px' }} /> : (editingMealId ? 'Update Meal' : 'Add to Chef Catalog')}
              </button>
              <button type="button" onClick={() => { setIsAddingMeal(false); setEditingMealId(null); setMealImage(null); }} className="btn-secondary" style={{ flex: 1 }} disabled={isUploading}>Cancel</button>
            </div>
          </form>
        )}

        <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {meals.map(meal => (
            <div key={meal.id} className="glass" style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)' }}>
              <div style={{ 
                height: '160px', 
                background: meal.image_name ? `url(${getPublicUrl(BUCKETS.MEALS, meal.image_name)}) center/cover` : 'var(--bg-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                {!meal.image_name && <UtensilsCrossed size={40} color="var(--primary)" opacity={0.2} />}
                <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => toggleAvailability(meal.id, meal.is_available)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: meal.is_available ? 'var(--success)' : 'var(--text-dim)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {meal.is_available ? <Check size={18} /> : <X size={18} />}
                  </button>
                </div>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{meal.name}</h4>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', lineHeight: '1.4', height: '2.8rem', overflow: 'hidden' }}>{meal.description}</p>
                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>{meal.calories} kcal</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => startEditMeal(meal)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}><Edit2 size={18} /></button>
                    <button onClick={() => deleteMeal(meal.id)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}><Trash2 size={18} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

// --- Order Management ---
export const OrderManagement: React.FC<{ chefId: string }> = ({ chefId }) => {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [chefId])

  const fetchOrders = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('weekly_orders')
      .select('*, weekly_order_items(id, quantity, meals(name)), subscriptions!inner(diner_id, profiles(first_name, last_name))')
      .eq('subscriptions.chef_id', chefId)
      .order('delivery_date', { ascending: false })
    
    if (data) setOrders(data as any)
    setLoading(false)
  }

  const updateStatus = async (orderId: string, newStatus: string) => {
    await supabase.from('weekly_orders').update({ status: newStatus }).eq('id', orderId)
    fetchOrders()
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading orders...</div>

  return (
    <section className="glass mobile-p-1" style={{ padding: '2rem', borderRadius: '24px' }}>
      <h3 style={{ marginBottom: '2rem' }}>Order Management</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--text-dim)', borderBottom: '1px solid var(--bg-soft)' }}>
              <th style={{ padding: '1rem' }}>Customer</th>
              <th style={{ padding: '1rem' }}>Delivery Date</th>
              <th style={{ padding: '1rem' }}>Items</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id} style={{ borderBottom: '1px solid var(--bg-soft)' }}>
                <td style={{ padding: '1rem', fontWeight: 600 }}>
                  {order.subscriptions.profiles.first_name} {order.subscriptions.profiles.last_name}
                </td>
                <td style={{ padding: '1rem' }}>{new Date(order.delivery_date).toLocaleDateString()}</td>
                <td style={{ padding: '1rem' }}>
                  {order.weekly_order_items.map((item: any) => (
                    <div key={item.id} style={{ fontSize: '0.85rem' }}>{item.quantity}x {item.meals?.name}</div>
                  ))}
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '100px', 
                    fontSize: '0.8rem', 
                    fontWeight: 600,
                    background: order.status === 'delivered' ? 'var(--success-light)' : 'var(--primary-light)',
                    color: order.status === 'delivered' ? 'var(--success)' : 'var(--primary)'
                  }}>
                    {order.status}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <select 
                    value={order.status} 
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    style={{ padding: '0.4rem', borderRadius: '8px', border: '1px solid var(--bg-soft)', background: 'white' }}
                  >
                    <option value="pending">Pending</option>
                    <option value="prepping">Prepping</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>No orders found.</p>}
      </div>
    </section>
  )
}

// --- Subscriber Management ---
export const SubscriberManagement: React.FC<{ chefId: string }> = ({ chefId }) => {
  const [subscribers, setSubscribers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubscribers()
  }, [chefId])

  const fetchSubscribers = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('subscriptions')
      .select('*, profiles(first_name, last_name, profile_image_url), subscription_plans(meal_count)')
      .eq('chef_id', chefId)
      .eq('status', 'active')
    
    if (data) setSubscribers(data as any)
    setLoading(false)
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading subscribers...</div>

  return (
    <section className="glass mobile-p-1" style={{ padding: '2rem', borderRadius: '24px' }}>
      <h3 style={{ marginBottom: '2rem' }}>Active Subscribers</h3>
      <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {subscribers.map(sub => (
          <div key={sub.id} className="glass" style={{ padding: '1.5rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              background: sub.profiles.profile_image_url ? `url(${sub.profiles.profile_image_url}) center/cover` : 'var(--bg-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {!sub.profiles.profile_image_url && <User size={30} color="var(--primary)" />}
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>{sub.profiles.first_name} {sub.profiles.last_name}</p>
              <p style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem' }}>{sub.subscription_plans.meal_count} Meals / Week</p>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Subscribed since {new Date(sub.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
        {subscribers.length === 0 && <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)', gridColumn: '1 / -1' }}>No active subscribers yet.</p>}
      </div>
    </section>
  )
}
