import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Membership({ user, onActivated }) {
  const [step, setStep] = useState('info'); // info, payment, pending
  const [gcashRef, setGcashRef] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmitPayment = async () => {
    if (!gcashRef || gcashRef.length < 5) {
      setError('Please enter a valid GCash reference number');
      return;
    }
    if (!amount || parseFloat(amount) < 30) {
      setError('Amount must be at least ₱30');
      return;
    }

    setLoading(true);
    setError('');

    const { error } = await supabase
      .from('membership_payments')
      .insert({
        user_id: user.id,
        gcash_reference: gcashRef,
        amount: parseFloat(amount),
        status: 'pending',
        type: user.membership_status === 'expired' ? 'renewal' : 'new'
      });

    if (error) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
      return;
    }

    setLoading(false);
    setStep('pending');
  };

  // Info screen
  if (step === 'info') return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--maroon)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '24px'
    }}>
      <div style={{ fontSize: '48px', marginBottom: '8px' }}>🛒</div>
      <h1 style={{
        color: 'var(--yellow)',
        fontSize: '32px',
        fontWeight: '800',
        marginBottom: '32px'
      }}>PasaBuy App</h1>

      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '40px 32px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: 'var(--shadow-lg)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
        <h2 style={{
          fontSize: '22px',
          fontWeight: '700',
          color: 'var(--maroon)',
          marginBottom: '8px'
        }}>Account Not Yet Activated</h2>
        <p style={{
          color: 'var(--gray)',
          fontSize: '14px',
          marginBottom: '32px',
          lineHeight: '1.6'
        }}>
          Avail your monthly membership to start using PasaBuy and connect with fellow UP students!
        </p>

        {/* Membership benefits */}
        {[
          '✅ Post pasabuy entries',
          '✅ Request items from buyers',
          '✅ In-app messaging',
          '✅ Secure transactions',
          '✅ Campus-wide access'
        ].map((benefit, i) => (
          <div key={i} style={{
            textAlign: 'left',
            padding: '8px 0',
            fontSize: '14px',
            color: 'var(--gray-dark)',
            borderBottom: i < 4 ? '1px solid #f0f0f0' : 'none'
          }}>
            {benefit}
          </div>
        ))}

        <div style={{
          background: 'var(--yellow)',
          borderRadius: '12px',
          padding: '16px',
          margin: '24px 0',
        }}>
          <p style={{
            fontSize: '14px',
            color: 'var(--gray-dark)'
          }}>Monthly Membership Fee</p>
          <p style={{
            fontSize: '36px',
            fontWeight: '800',
            color: 'var(--maroon)'
          }}>₱30</p>
          <p style={{
            fontSize: '12px',
            color: 'var(--gray)'
          }}>per month</p>
        </div>

        <button
          onClick={() => setStep('payment')}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '12px',
            background: 'var(--maroon)',
            color: 'white',
            fontSize: '16px',
            fontWeight: '700'
          }}
        >
          Avail Membership - ₱30/month
        </button>

        <button
          onClick={() => supabase.auth.signOut()}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '12px',
            background: 'transparent',
            color: 'var(--gray)',
            fontSize: '14px',
            marginTop: '12px'
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );

  // Payment screen
  if (step === 'payment') return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--maroon)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '24px'
    }}>
      <div style={{ fontSize: '48px', marginBottom: '8px' }}>🛒</div>
      <h1 style={{
        color: 'var(--yellow)',
        fontSize: '32px',
        fontWeight: '800',
        marginBottom: '32px'
      }}>PasaBuy</h1>

      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '40px 32px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <button
          onClick={() => setStep('info')}
          style={{
            background: 'none',
            color: 'var(--gray)',
            fontSize: '14px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          ← Back
        </button>

        <h2 style={{
          fontSize: '22px',
          fontWeight: '700',
          color: 'var(--maroon)',
          marginBottom: '8px'
        }}>Payment Instructions</h2>
        <p style={{
          color: 'var(--gray)',
          fontSize: '14px',
          marginBottom: '24px'
        }}>Follow these steps to activate your account</p>

        {/* Steps */}
        {[
          { step: '1', text: 'Open your GCash app' },
          { step: '2', text: 'Send ₱30 to 09065935527' },
          { step: '3', text: `Use your email as reference: ${user.email}` },
          { step: '4', text: 'Enter the reference number below' }
        ].map((item, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'var(--maroon)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: '700',
              flexShrink: 0
            }}>{item.step}</div>
            <p style={{
              fontSize: '14px',
              color: 'var(--gray-dark)',
              lineHeight: '1.6',
              paddingTop: '4px'
            }}>{item.text}</p>
          </div>
        ))}

        {/* GCash number highlight */}
        <div style={{
          background: 'var(--yellow)',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          <p style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '4px' }}>
            GCash Number
          </p>
          <p style={{
            fontSize: '24px',
            fontWeight: '800',
            color: 'var(--maroon)',
            letterSpacing: '2px'
          }}>
            0906-593-5527
          </p>
        </div>

        {/* Reference number input */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--gray-dark)',
            marginBottom: '8px'
          }}>GCash Reference Number</label>
          <input
            type="text"
            placeholder="e.g. 1234567890"
            value={gcashRef}
            onChange={e => setGcashRef(e.target.value)}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              border: '2px solid #e0e0e0',
              fontSize: '16px'
            }}
            onFocus={e => e.target.style.borderColor = 'var(--maroon)'}
            onBlur={e => e.target.style.borderColor = '#e0e0e0'}
          />
        </div>

        {/* Amount input */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--gray-dark)',
            marginBottom: '8px'
          }}>Amount Paid (₱)</label>
          <input
            type="number"
            placeholder="30"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              border: '2px solid #e0e0e0',
              fontSize: '16px'
            }}
            onFocus={e => e.target.style.borderColor = 'var(--maroon)'}
            onBlur={e => e.target.style.borderColor = '#e0e0e0'}
          />
        </div>

        {error && (
          <p style={{
            color: 'red',
            fontSize: '13px',
            marginBottom: '16px',
            textAlign: 'center'
          }}>{error}</p>
        )}

        <button
          onClick={handleSubmitPayment}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '12px',
            background: loading ? 'var(--gray)' : 'var(--green)',
            color: 'white',
            fontSize: '16px',
            fontWeight: '700'
          }}
        >
          {loading ? 'Submitting...' : "I've Paid - Submit for Verification"}
        </button>

        <p style={{
          fontSize: '12px',
          color: 'var(--gray)',
          textAlign: 'center',
          marginTop: '16px',
          lineHeight: '1.6'
        }}>
          Verification is done between 8AM - 10PM daily. 
          Your account will be activated within 30 minutes.
        </p>
      </div>
    </div>
  );

  // Pending screen
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--maroon)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '24px'
    }}>
      <div style={{ fontSize: '48px', marginBottom: '8px' }}>🛒</div>
      <h1 style={{
        color: 'var(--yellow)',
        fontSize: '32px',
        fontWeight: '800',
        marginBottom: '32px'
      }}>PasaBuy App</h1>

      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '40px 32px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: 'var(--shadow-lg)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>⏳</div>
        <h2 style={{
          fontSize: '22px',
          fontWeight: '700',
          color: 'var(--maroon)',
          marginBottom: '8px'
        }}>Payment Submitted!</h2>
        <p style={{
          color: 'var(--gray)',
          fontSize: '14px',
          lineHeight: '1.6',
          marginBottom: '24px'
        }}>
          Your membership payment is being verified by the admin. 
          Please wait for approval. This is usually done within 
          30 minutes between 8AM - 10PM.
        </p>

        <div style={{
          background: 'var(--yellow)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <p style={{
            fontSize: '13px',
            color: 'var(--gray-dark)',
            lineHeight: '1.6'
          }}>
            📱 You will be notified once your account is activated. 
            Please check back later!
          </p>
        </div>

        <button
          onClick={() => supabase.auth.signOut()}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '12px',
            background: 'transparent',
            border: '2px solid #e0e0e0',
            color: 'var(--gray)',
            fontSize: '14px'
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}