import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import logoIcon from '../logo-icon.png';
import { MapPin, ShoppingBag } from 'lucide-react';

export default function PostEntry({ user }) {
  const [location, setLocation] = useState('');
  const [whatCanBuy, setWhatCanBuy] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!location || !whatCanBuy) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');

    const { error } = await supabase
      .from('entries')
      .insert({
        buyer_id: user.id,
        location,
        what_can_buy: whatCanBuy,
        status: 'active'
      });

    if (error) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
      return;
    }

    navigate('/');
  };

const fields = [
    {
      icon: <MapPin size={16} strokeWidth={2}/>,
      label: 'Where are you going?',
      placeholder: 'e.g. 7/11 Katipunan, Jollibee SM North',
      value: location,
      onChange: setLocation,
      hint: "Be specific so pasabuyers know where you're headed"
    },
    {
      icon: <ShoppingBag size={16} strokeWidth={2}/>,
      label: 'What can you buy?',
      placeholder: 'e.g. Snacks, drinks, food, medicines',
      value: whatCanBuy,
      onChange: setWhatCanBuy,
      hint: 'Let pasabuyers know what types of items you can get'
    },
  ];

  const isValid = location && whatCanBuy;

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
        position: 'absolute', top: '-60px', right: '-60px',
        width: '240px', height: '240px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,229,102,0.1) 0%, transparent 65%)',
        pointerEvents: 'none'
      }}/>

      {/* Header */}
      <div style={{
        padding: '52px 24px 24px',
        animation: 'fadeUp 0.4s ease forwards'
      }}>
        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px'
        }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '100px',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex', alignItems: 'center', gap: '6px',
              border: '1px solid rgba(255,255,255,0.12)'
            }}
          >← Back</button>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <div style={{
              width: '30px', height: '30px',
              background: 'var(--yellow)',
              borderRadius: '9px',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img src={logoIcon} alt="PasaBuy"
                style={{ width: '22px', height: '22px', borderRadius: '6px' }}/>
            </div>
            <span style={{
              fontFamily: 'Raleway, sans-serif',
              color: 'var(--yellow)',
              fontSize: '17px', fontWeight: '800'
            }}>PasaBuy</span>
          </div>
        </div>

        <p style={{
          color: 'rgba(255,255,255,0.45)',
          fontSize: '11px', fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '1.4px', marginBottom: '8px'
        }}>New Entry</p>
        <h1 style={{
          fontFamily: 'Raleway, sans-serif',
          color: 'white', fontSize: '28px',
          fontWeight: '800', lineHeight: '1.2',
          letterSpacing: '-0.3px'
        }}>I'm going out! 🏃</h1>
        <p style={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: '13px', marginTop: '6px'
        }}>Let others know where you're headed</p>
      </div>

      {/* White card */}
      <div style={{
        flex: 1,
        background: 'white',
        borderRadius: '32px 32px 0 0',
        padding: '24px 24px 40px',
        boxShadow: '0 -8px 48px rgba(0,0,0,0.18)',
        animation: 'fadeUp 0.4s ease 0.12s both',
        overflowY: 'auto'
      }}>
        {/* Handle */}
        <div style={{
          width: '32px', height: '4px',
          background: '#EDE5E5', borderRadius: '4px',
          margin: '0 auto 24px'
        }}/>

        {/* Earnings banner */}
        <div style={{
          background: 'linear-gradient(135deg, #1A6B2F, #2E9E4F)',
          borderRadius: '16px',
          padding: '16px',
          display: 'flex', alignItems: 'center',
          gap: '14px', marginBottom: '24px'
        }}>
          <div style={{
            width: '42px', height: '42px',
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '20px',
            flexShrink: 0
          }}>💸</div>
          <div>
            <p style={{
              color: 'white', fontSize: '13px',
              fontWeight: '700', marginBottom: '2px'
            }}>Earn while you're out!</p>
            <p style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: '12px', lineHeight: '1.5'
            }}>You earn 15% commission on every accepted pasabuy request</p>
          </div>
        </div>

        {/* Fields */}
        {fields.map((field, idx) => (
          <div key={idx} style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'flex', alignItems: 'center',
              gap: '6px',
              fontSize: '11px', fontWeight: '700',
              color: 'var(--text-soft)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '8px'
            }}>
              <span style={{ color: 'var(--maroon)', display: 'flex', alignItems: 'center' }}>
                {field.icon}
              </span>
              {field.label}
            </label>
            <input
              type="text"
              placeholder={field.placeholder}
              value={field.value}
              autoComplete="off"
              onChange={e => field.onChange(e.target.value)}
              style={{
                width: '100%',
                padding: '13px 16px',
                borderRadius: '13px',
                border: '1.5px solid #EDE5E5',
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--text)',
                background: '#FAFAFA',
                transition: 'all 0.2s ease'
              }}
              onFocus={e => {
                e.target.style.borderColor = 'var(--maroon)';
                e.target.style.background = 'white';
                e.target.style.boxShadow = '0 0 0 3px rgba(139,0,0,0.06)';
              }}
              onBlur={e => {
                e.target.style.borderColor = '#EDE5E5';
                e.target.style.background = '#FAFAFA';
                e.target.style.boxShadow = 'none';
              }}
            />
            <p style={{
              fontSize: '11px', color: '#B0A0A0',
              marginTop: '5px', paddingLeft: '2px',
              lineHeight: '1.5'
            }}>{field.hint}</p>
          </div>
        ))}

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
            <p style={{ color: '#DC2626', fontSize: '13px', fontWeight: '600' }}>
              {error}
            </p>
          </div>
        )}

        {/* Warning */}
        <div style={{
          background: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: '12px',
          padding: '12px 14px',
          display: 'flex', gap: '10px',
          alignItems: 'flex-start',
          marginBottom: '24px'
        }}>
          <span style={{ fontSize: '15px', flexShrink: 0, marginTop: '1px' }}>⚠️</span>
          <p style={{
            fontSize: '12px', color: '#92400E',
            lineHeight: '1.6', fontWeight: '500'
          }}>
            Only post an entry if you're <strong>actually going out</strong>.
            Once you accept a request, you are responsible for buying and delivering the item.
          </p>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || !isValid}
          style={{
            width: '100%', padding: '16px',
            borderRadius: '14px',
            background: (loading || !isValid) ? '#F0E8E8' : 'var(--maroon)',
            color: (loading || !isValid) ? '#C0A8A8' : 'white',
            fontSize: '15px', fontWeight: '800',
            letterSpacing: '0.2px',
            boxShadow: (loading || !isValid) ? 'none' : 'var(--shadow-maroon)',
            transition: 'all 0.2s ease'
          }}
        >
          {loading ? '⏳ Posting...' : '🏃 Post Entry'}
        </button>
      </div>
    </div>
  );
}