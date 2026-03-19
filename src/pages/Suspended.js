import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import logoIcon from '../logo-icon.png';

export default function Suspended({ user }) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [existingAppeal, setExistingAppeal] = useState(null);
  const [checkingAppeal, setCheckingAppeal] = useState(true);

  useEffect(() => {
    const checkAppeal = async () => {
      const { data } = await supabase
        .from('appeals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      setExistingAppeal(data);
      setCheckingAppeal(false);
    };
    checkAppeal();
  }, [user.id]);

  const handleAppeal = async () => {
    if (!reason.trim()) return;
    setSubmitting(true);

    const { error } = await supabase.from('appeals').insert({
      user_id: user.id,
      reason: reason.trim(),
      status: 'pending'
    });

    if (error) {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #6B0000 0%, #8B0000 45%, #1A3B20 100%)',
      display: 'flex', flexDirection: 'column',
      maxWidth: '480px', margin: '0 auto',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Glow */}
      <div style={{
        position: 'absolute', top: '-80px', right: '-80px',
        width: '300px', height: '300px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,229,102,0.1) 0%, transparent 65%)',
        pointerEvents: 'none'
      }}/>

      {/* Header */}
      <div style={{
        padding: '52px 24px 28px',
        animation: 'fadeUp 0.4s ease forwards'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: '8px', marginBottom: '32px'
        }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'var(--yellow)', borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <img src={logoIcon} alt="PasaBuy"
              style={{ width: '26px', height: '26px', borderRadius: '6px' }}/>
          </div>
          <span style={{
            fontFamily: 'Raleway, sans-serif',
            color: 'var(--yellow)', fontSize: '18px', fontWeight: '800'
          }}>PasaBuy</span>
        </div>

        <div style={{
          width: '64px', height: '64px',
          background: 'rgba(220,38,38,0.2)',
          borderRadius: '20px',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px', marginBottom: '16px'
        }}>🚫</div>

        <h1 style={{
          fontFamily: 'Raleway, sans-serif',
          color: 'white', fontSize: '26px',
          fontWeight: '800', lineHeight: '1.2',
          letterSpacing: '-0.3px', marginBottom: '8px'
        }}>Account Suspended</h1>
        <p style={{
          color: 'rgba(255,255,255,0.55)',
          fontSize: '13px', lineHeight: '1.6'
        }}>
          Your account has been suspended due to your violation of PasaBuy App's Community Rules.
          You may submit an appeal below and we will review your case.
        </p>
      </div>

      {/* White card */}
      <div style={{
        flex: 1, background: 'white',
        borderRadius: '32px 32px 0 0',
        padding: '24px 24px 40px',
        boxShadow: '0 -8px 48px rgba(0,0,0,0.18)',
        animation: 'fadeUp 0.4s ease 0.12s both'
      }}>
        <div style={{
          width: '32px', height: '4px',
          background: '#EDE5E5', borderRadius: '4px',
          margin: '0 auto 24px'
        }}/>

        {checkingAppeal ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#B0A0A0', fontSize: '14px' }}>Loading...</p>
          </div>
        ) : existingAppeal?.status === 'rejected' ? (
          <div style={{ textAlign: 'center', padding: '32px 24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
            <h3 style={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: '18px', fontWeight: '800',
              color: 'var(--text)', marginBottom: '8px'
            }}>Appeal Rejected</h3>
            <p style={{
              color: 'var(--text-soft)', fontSize: '13px',
              lineHeight: '1.6', marginBottom: '24px'
            }}>
              Unfortunately your appeal has been rejected.
              If you believe this is a mistake, please contact the admin by sending an email to pasabuy.app.earn@gmail.com.
            </p>
            <button
              onClick={handleLogout}
              style={{
                width: '100%', padding: '14px',
                borderRadius: '14px',
                background: '#FEF2F2', color: '#DC2626',
                border: '1px solid #FECACA',
                fontSize: '14px', fontWeight: '700'
              }}
            >Log Out</button>
          </div>
        ) : existingAppeal?.status === 'approved' ? (
          <div style={{ textAlign: 'center', padding: '32px 24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
            <h3 style={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: '18px', fontWeight: '800',
              color: 'var(--text)', marginBottom: '8px'
            }}>Appeal Approved!</h3>
            <p style={{
              color: 'var(--text-soft)', fontSize: '13px',
              lineHeight: '1.6', marginBottom: '24px'
            }}>
              Your appeal has been approved and your account has been reactivated.
              Please log out and log back in to continue using PasaBuy App.
            </p>
            <button
              onClick={handleLogout}
              style={{
                width: '100%', padding: '14px',
                borderRadius: '14px',
                background: 'var(--maroon)', color: 'white',
                fontSize: '14px', fontWeight: '800',
                boxShadow: 'var(--shadow-maroon)',
                marginBottom: '12px'
              }}
            >Log Out & Log Back In</button>
          </div>
        ) : existingAppeal?.status === 'pending' || submitted ? (
          <div style={{ textAlign: 'center', padding: '32px 24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
            <h3 style={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: '18px', fontWeight: '800',
              color: 'var(--text)', marginBottom: '8px'
            }}>Appeal Submitted!</h3>
            <p style={{
              color: 'var(--text-soft)', fontSize: '13px',
              lineHeight: '1.6', marginBottom: '24px'
            }}>
              We have received your appeal and will review it within 24 hours.
              Please wait for our response.
            </p>
            <button
              onClick={handleLogout}
              style={{
                width: '100%', padding: '14px',
                borderRadius: '14px',
                background: '#FEF2F2', color: '#DC2626',
                border: '1px solid #FECACA',
                fontSize: '14px', fontWeight: '700'
              }}
            >Log Out</button>
          </div>
        ) : (
          <>
            {/* User info */}
            <div style={{
              display: 'flex', alignItems: 'center',
              gap: '12px', background: '#FFF8F8',
              border: '1px solid rgba(139,0,0,0.08)',
              borderRadius: '16px', padding: '14px',
              marginBottom: '24px'
            }}>
              <img src={user.photo_url} alt=""
                style={{
                  width: '48px', height: '48px',
                  borderRadius: '50%',
                  border: '2px solid #FECACA',
                  opacity: 0.7
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontWeight: '700', fontSize: '14px',
                  color: 'var(--text)',
                  whiteSpace: 'nowrap', overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>{user.name}</p>
                <p style={{
                  fontSize: '12px', color: '#DC2626',
                  marginTop: '2px', fontWeight: '600'
                }}>🚫 Account Suspended</p>
              </div>
              <div style={{
                background: '#FEF2F2', color: '#DC2626',
                padding: '4px 10px', borderRadius: '20px',
                fontSize: '10px', fontWeight: '700',
                flexShrink: 0
              }}>{user.strikes}/3 Strikes</div>
            </div>

            {/* Appeal form */}
            <label style={{
              display: 'block', fontSize: '11px', fontWeight: '700',
              color: 'var(--text-soft)', textTransform: 'uppercase',
              letterSpacing: '1px', marginBottom: '8px'
            }}>Your Appeal</label>
            <textarea
              placeholder="Explain your situation and why you think your account should be reactivated..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={5}
              style={{
                width: '100%', padding: '13px',
                borderRadius: '13px', border: '1.5px solid #EDE5E5',
                fontSize: '14px', fontWeight: '500',
                marginBottom: '16px', background: '#FAFAFA',
                resize: 'none', fontFamily: 'inherit', lineHeight: '1.6'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--maroon)'}
              onBlur={e => e.target.style.borderColor = '#EDE5E5'}
            />

            {error && (
              <div style={{
                background: '#FEF2F2', border: '1px solid #FECACA',
                borderRadius: '12px', padding: '11px 14px',
                marginBottom: '16px',
                display: 'flex', gap: '8px', alignItems: 'center'
              }}>
                <span>❌</span>
                <p style={{ color: '#DC2626', fontSize: '13px', fontWeight: '600' }}>{error}</p>
              </div>
            )}

            <button
              onClick={handleAppeal}
              disabled={submitting || !reason.trim()}
              style={{
                width: '100%', padding: '15px',
                borderRadius: '14px',
                background: (!reason.trim() || submitting) ? '#F0E8E8' : 'var(--maroon)',
                color: (!reason.trim() || submitting) ? '#C0A8A8' : 'white',
                fontSize: '14px', fontWeight: '800',
                boxShadow: (!reason.trim() || submitting) ? 'none' : 'var(--shadow-maroon)',
                marginBottom: '12px'
              }}
            >{submitting ? '⏳ Submitting...' : 'Submit Appeal'}</button>

            <button
              onClick={handleLogout}
              style={{
                width: '100%', padding: '13px',
                borderRadius: '14px',
                background: '#FEF2F2', color: '#DC2626',
                border: '1px solid #FECACA',
                fontSize: '13px', fontWeight: '700'
              }}
            >Log Out</button>
          </>
        )}
      </div>
    </div>
  );
}