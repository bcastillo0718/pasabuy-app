import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import logoIcon from '../logo-icon.png';

export default function ProfileSetup({ session, onComplete }) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSubmit = async () => {
    if (!phone || phone.length < 11) {
      setError('Please enter a valid 11-digit GCash number');
      return;
    }
    if (!phone.startsWith('09')) {
      setError('GCash number must start with 09');
      return;
    }
    setLoading(true);
    setError('');

    const { data, error } = await supabase
      .from('users')
      .insert({
        id: session.user.id,
        name: session.user.user_metadata.full_name,
        email: session.user.email,
        phone,
        photo_url: session.user.user_metadata.avatar_url,
        membership_status: 'inactive',
        strikes: 0,
        account_status: 'active'
      })
      .select()
      .single();

    if (error) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
      return;
    }
    onComplete(data);
  };

  const progress = Math.min((phone.length / 11) * 100, 100);
  const isValid = phone.length === 11 && phone.startsWith('09');

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #6B0000 0%, #8B0000 45%, #1A3B20 100%)',
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '480px',
      margin: '0 auto',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Glow */}
      <div style={{
        position: 'absolute', top: '-80px', right: '-80px',
        width: '300px', height: '300px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,229,102,0.12) 0%, transparent 65%)',
        pointerEvents: 'none'
      }}/>
      <div style={{
        position: 'absolute', bottom: '300px', left: '-60px',
        width: '200px', height: '200px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(46,158,79,0.15) 0%, transparent 65%)',
        pointerEvents: 'none'
      }}/>

      {/* Header */}
      <div style={{
        padding: '52px 24px 28px',
        animation: 'fadeUp 0.4s ease forwards'
      }}>
        {/* Brand */}
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: '10px', marginBottom: '32px'
        }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'var(--yellow)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img src={logoIcon} alt="PasaBuy"
              style={{ width: '26px', height: '26px', borderRadius: '6px' }}/>
          </div>
          <span style={{
            fontFamily: 'Raleway, sans-serif',
            color: 'var(--yellow)',
            fontSize: '18px', fontWeight: '800'
          }}>PasaBuy App</span>
        </div>

        {/* Step indicator */}
        <div style={{
          display: 'flex', gap: '6px', marginBottom: '20px'
        }}>
          {[0, 1].map(i => (
            <div key={i} style={{
              height: '3px', flex: 1, borderRadius: '4px',
              background: i === 0
                ? 'var(--yellow)'
                : 'rgba(255,255,255,0.15)'
            }}/>
          ))}
        </div>

        <p style={{
          color: 'rgba(255,255,255,0.45)',
          fontSize: '11px', fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '1.4px', marginBottom: '8px'
        }}>Step 1 of 2</p>
        <h1 style={{
          fontFamily: 'Raleway, sans-serif',
          color: 'white', fontSize: '30px',
          fontWeight: '800', lineHeight: '1.2',
          letterSpacing: '-0.3px'
        }}>Set up your<br/>profile ✨</h1>
      </div>

      {/* White card */}
      <div style={{
        flex: 1,
        background: 'white',
        borderRadius: '32px 32px 0 0',
        padding: '24px 24px 40px',
        boxShadow: '0 -8px 48px rgba(0,0,0,0.18)',
        animation: 'fadeUp 0.4s ease 0.12s both'
      }}>
        {/* Handle */}
        <div style={{
          width: '32px', height: '4px',
          background: '#EDE5E5', borderRadius: '4px',
          margin: '0 auto 24px'
        }}/>

        {/* User info row */}
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: '12px',
          background: '#FFF8F8',
          border: '1px solid rgba(139,0,0,0.08)',
          borderRadius: '16px',
          padding: '14px',
          marginBottom: '24px'
        }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img
              src={session.user.user_metadata.avatar_url}
              alt="Profile"
              style={{
                width: '48px', height: '48px',
                borderRadius: '50%',
                border: '2px solid var(--maroon)'
              }}
            />
            <div style={{
              position: 'absolute', bottom: 0, right: 0,
              width: '16px', height: '16px',
              background: '#22C55E',
              borderRadius: '50%',
              border: '2px solid white',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center',
              fontSize: '8px', color: 'white',
              fontWeight: '900'
            }}>✓</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontWeight: '700', fontSize: '14px',
              color: 'var(--text)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>{session.user.user_metadata.full_name}</p>
            <p style={{
              fontSize: '12px', color: 'var(--text-soft)',
              marginTop: '2px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>{session.user.email}</p>
          </div>
          <div style={{
            background: 'var(--maroon)',
            color: 'white',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '10px', fontWeight: '700',
            flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: '4px'
          }}>
            <img src="https://www.google.com/favicon.ico"
              alt="" style={{ width: '10px', height: '10px', filter: 'brightness(10)' }}/>
            Verified
          </div>
        </div>

        {/* GCash label */}
        <p style={{
          fontSize: '11px', fontWeight: '700',
          color: 'var(--text-soft)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '10px'
        }}>📱 GCash Number</p>

        {/* Phone input */}
        <div style={{
          borderRadius: '14px',
          border: `1.5px solid ${focused ? 'var(--maroon)' : '#EDE5E5'}`,
          display: 'flex', alignItems: 'center',
          background: focused ? '#FFF8F8' : '#FAFAFA',
          marginBottom: '8px',
          transition: 'all 0.2s ease',
          boxShadow: focused ? '0 0 0 3px rgba(139,0,0,0.08)' : 'none'
        }}>
          <div style={{
            padding: '13px 14px',
            fontSize: '20px',
            borderRight: `1.5px solid ${focused ? '#FFCDD2' : '#EDE5E5'}`,
            transition: 'border-color 0.2s'
          }}>🇵🇭</div>
          <input
            type="tel"
            placeholder="09XXXXXXXXX"
            value={phone}
            autoComplete="off"
            onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{
              flex: 1, padding: '13px 14px',
              fontSize: '18px', fontWeight: '700',
              letterSpacing: '2px',
              background: 'transparent',
              color: 'var(--text)'
            }}
          />
          {isValid && (
            <div style={{
              padding: '0 14px',
              color: '#22C55E',
              fontSize: '20px'
            }}>✓</div>
          )}
        </div>

        {/* Progress bar */}
        <div style={{
          height: '3px', background: '#F0E8E8',
          borderRadius: '4px', marginBottom: '20px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: isValid ? '#22C55E' : 'var(--maroon)',
            borderRadius: '4px',
            transition: 'width 0.3s ease, background 0.3s ease'
          }}/>
        </div>

        {/* Warning box */}
        <div style={{
          background: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: '12px',
          padding: '12px 14px',
          display: 'flex', gap: '10px',
          alignItems: 'flex-start',
          marginBottom: '20px'
        }}>
          <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>⚠️</span>
          <p style={{
            fontSize: '12px', color: '#92400E',
            lineHeight: '1.6', fontWeight: '500'
          }}>
            Use your <strong>real GCash number</strong> — your earnings will be
            transferred here after each completed transaction.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '12px',
            padding: '11px 14px',
            marginBottom: '16px',
            display: 'flex', gap: '8px', alignItems: 'center'
          }}>
            <span style={{ fontSize: '14px' }}>❌</span>
            <p style={{
              color: '#DC2626', fontSize: '13px', fontWeight: '600'
            }}>{error}</p>
          </div>
        )}

        {/* Button */}
        <button
          onClick={handleSubmit}
          disabled={loading || !isValid}
          style={{
            width: '100%', padding: '16px',
            borderRadius: '14px',
            background: (!isValid || loading) ? '#F0E8E8' : 'var(--maroon)',
            color: (!isValid || loading) ? '#C0A8A8' : 'white',
            fontSize: '15px', fontWeight: '800',
            letterSpacing: '0.2px',
            boxShadow: (!isValid || loading) ? 'none' : 'var(--shadow-maroon)',
            transition: 'all 0.2s ease'
          }}
        >
          {loading ? '⏳ Setting up your profile...' : 'Complete Setup →'}
        </button>
      </div>
    </div>
  );
}