import React, { useState } from 'react'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { supabase } from '../services/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Lock, Loader2 } from 'lucide-react'

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (subscriptionId: string) => void
  plan: any
  chef: any
  diner: any
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onSuccess, plan, chef, diner }) => {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError(null)

    try {
      // 1. Call Supabase Edge Function to create subscription/payment intent
      const { data, error: funcError } = await supabase.functions.invoke('create-subscription', {
        body: {
          amount: Math.round(plan.weekly_price * 100), // Stripe expects cents
          currency: 'usd',
          chef_id: chef.id,
          diner_id: diner.id,
          diner_email: diner.email,
          plan_id: plan.id
        }
      })

      if (funcError) throw new Error(funcError.message)
      const { paymentIntent, subscriptionId } = data

      // 2. Confirm the payment on the client
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) throw new Error("Card element not found")

      const { paymentIntent: confirmedIntent, error: confirmError } = await stripe.confirmCardPayment(paymentIntent, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: diner.email,
            name: `${diner.first_name} ${diner.last_name}`
          }
        }
      })

      if (confirmError) {
        throw new Error(confirmError.message)
      }

      if (confirmedIntent.status === 'succeeded') {
        onSuccess(subscriptionId)
      } else {
        throw new Error("Payment failed with status: " + confirmedIntent.status)
      }

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="glass"
            style={{ 
              width: '90%', 
              maxWidth: '500px', 
              padding: '2.5rem', 
              borderRadius: '32px', 
              position: 'relative',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
            }}
          >
            <button onClick={onClose} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}>
              <X size={24} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Complete Subscription</h2>
              <p style={{ color: 'var(--text-dim)' }}>Subscribe to Chef {chef.name} • {plan.meal_count} meals/wk</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-main)' }}>Card Details</label>
                <div style={{ 
                  padding: '1.25rem', 
                  borderRadius: '16px', 
                  background: 'white', 
                  border: '1.5px solid #e2e8f0',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  <CardElement options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#1a202c',
                        '::placeholder': { color: '#a0aec0' },
                      },
                    },
                  }} />
                </div>
              </div>

              {error && (
                <div style={{ 
                  marginBottom: '1.5rem', 
                  padding: '1rem', 
                  borderRadius: '12px', 
                  background: '#fff5f5', 
                  color: '#c53030', 
                  fontSize: '0.9rem',
                  display: 'flex',
                  gap: '0.5rem'
                }}>
                  <Info size={18} />
                  <span>{error}</span>
                </div>
              )}

              <button 
                type="submit" 
                disabled={!stripe || loading}
                className="btn-primary"
                style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem', gap: '0.75rem' }}
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Lock size={20} />}
                {loading ? 'Processing...' : `Pay $${plan.weekly_price} & Subscribe`}
              </button>
              
              <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                Your card will be charged weekly. Cancel anytime from your dashboard.
              </p>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default CheckoutModal

// Icon helper since Info might be needed
const Info = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
)
