import React, { useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'
import { Plus, Edit2, Trash2, Check, X, UtensilsCrossed, TrendingUp, User } from 'lucide-react'
import { getPublicUrl, BUCKETS } from '../../services/images'

// --- Menu Management ---
export const MenuManagement: React.FC<{ chefId: string }> = ({ chefId }) => {
  const [meals, setMeals] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingMeal, setEditingMeal] = useState<any>(null)
  const [isAddingMeal, setIsAddingMeal] = useState(false)

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

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading menu data...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Plans Section */}
      <section className="glass" style={{ padding: '2rem', borderRadius: '24px' }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <TrendingUp size={24} color="var(--primary)" />
          Subscription Plans
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
          {plans.map(plan => (
            <div key={plan.id} style={{ padding: '1.5rem', background: 'var(--bg-soft)', borderRadius: '16px', border: '1px solid var(--primary-light)' }}>
              <p style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>{plan.meal_count} Meals / Week</p>
              <p style={{ color: 'var(--primary)', fontSize: '1.5rem', fontWeight: 800 }}>${plan.weekly_price}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>Mode: {plan.selection_mode}</p>
            </div>
          ))}
          <button style={{ padding: '1.5rem', border: '2px dashed var(--primary-light)', borderRadius: '16px', background: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Plus size={24} /> Add Plan
          </button>
        </div>
      </section>

      {/* Meals Section */}
      <section className="glass" style={{ padding: '2rem', borderRadius: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <UtensilsCrossed size={24} color="var(--primary)" />
            Meal Catalog
          </h3>
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={20} /> Add New Meal
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
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
                    <button style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}><Edit2 size={18} /></button>
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
    <section className="glass" style={{ padding: '2rem', borderRadius: '24px' }}>
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
    <section className="glass" style={{ padding: '2rem', borderRadius: '24px' }}>
      <h3 style={{ marginBottom: '2rem' }}>Active Subscribers</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
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
