import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import logoIcon from '../logo-icon.png';

export default function Profile({ user, onUpdate }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ asBuyer: 0, asPasabuyer: 0, completed: 0 });
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState(user.phone || '');
  const [saving, setSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

// eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [buyerRes, pasabuyerRes] = await Promise.all([
      supabase
        .from('requests')
        .select('id, status, entries(buyer_id)')
        .eq('entries.buyer_id', user.id),
      supabase
        .from('requests')
        .select('id, status')
        .eq('pasabuyer_id', user.id)
    ]);

    const buyerRequests = buyerRes.data?.filter(r => r.entries) || [];
    const pasabuyerRequests = pasabuyerRes.data || [];
    const completed = pasabuyerRequests.filter(r => r.status === 'completed').length;

// Calculate total earnings from completed buyer requests
const { data: earningsData } = await supabase
  .from('requests')
  .select('commission, entries(buyer_id)')
  .eq('status', 'completed')
  .eq('entries.buyer_id', user.id);

const totalEarnings = earningsData
  ?.filter(r => r.entries)
  ?.reduce((sum, r) => sum + (r.commission || 0), 0) || 0;

setStats({
  asBuyer: buyerRequests.length,
  asPasabuyer: pasabuyerRequests.length,
  completed,
  earnings: totalEarnings
});
  };

  const handleSavePhone = async () => {
    if (!phone || phone.length < 11 || !phone.startsWith('09')) return;
    setSaving(true);
    const { data } = await supabase
      .from('users')
      .update({ phone })
      .eq('id', user.id)
      .select()
      .single();
    if (data) onUpdate(data);
    setSaving(false);
    setEditing(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #6B0000 0%, #8B0000 45%, #1A3B20 100%)',
      display: 'flex', flexDirection: 'column',
      maxWidth: '480px', margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{
        padding: '52px 24px 80px',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: '240px', height: '240px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,229,102,0.12) 0%, transparent 65%)',
          pointerEvents: 'none'
        }}/>

        <div style={{
          display: 'flex', alignItems: 'center',
          gap: '10px', marginBottom: '28px'
        }}>
          <img src={logoIcon} alt="PasaBuy"
            style={{ width: '32px', height: '32px', borderRadius: '10px' }}/>
          <span style={{
            fontFamily: 'Raleway, sans-serif',
            color: 'var(--yellow)', fontSize: '18px', fontWeight: '800'
          }}>PasaBuy</span>
        </div>

        {/* Avatar */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img
              src={user.photo_url}
              alt="Profile"
              style={{
                width: '88px', height: '88px',
                borderRadius: '50%',
                border: '3px solid var(--yellow)',
                boxShadow: 'var(--shadow-yellow)'
              }}
            />
            <div style={{
              position: 'absolute', bottom: 2, right: 2,
              width: '22px', height: '22px',
              background: '#22C55E',
              borderRadius: '50%',
              border: '2.5px solid white',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px', color: 'white', fontWeight: '900'
            }}>✓</div>
          </div>
          <h2 style={{
            fontFamily: 'Raleway, sans-serif',
            color: 'white', fontSize: '22px',
            fontWeight: '800', marginTop: '12px'
          }}>{user.name}</h2>
          <p style={{
            color: 'rgba(255,255,255,0.55)',
            fontSize: '13px', marginTop: '4px'
          }}>{user.email}</p>
        </div>
      </div>

      {/* White card */}
      <div style={{
        flex: 1, background: 'white',
        borderRadius: '32px 32px 0 0',
        marginTop: '-40px',
        padding: '28px 24px 100px',
        boxShadow: '0 -4px 48px rgba(0,0,0,0.2)'
      }}>
        <div style={{
          width: '36px', height: '4px',
          background: '#EDE5E5', borderRadius: '4px',
          margin: '0 auto 24px'
        }}/>

        {/* Stats row */}
        <div style={{
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '10px',
  marginBottom: '24px'
}}>
  {[
    { label: 'As Buyer', value: stats.asBuyer, icon: '🏃' },
    { label: 'As Pasabuyer', value: stats.asPasabuyer, icon: '🛍️' },
    { label: 'Completed', value: stats.completed, icon: '✅' },
    { label: 'Total Earned', value: `₱${stats.earnings || 0}`, icon: '💸' }
  ].map((stat, i) => (
    <div key={i} style={{
      background: i === 3 ? 'linear-gradient(135deg, #1A6B2F, #2E9E4F)' : '#FFF8F8',
      borderRadius: '16px', padding: '14px',
      textAlign: 'center',
      border: i === 3 ? 'none' : '1.5px solid #F0E8E8'
    }}>
      <div style={{ fontSize: '22px', marginBottom: '6px' }}>{stat.icon}</div>
      <p style={{
        fontFamily: 'Raleway, sans-serif',
        fontSize: i === 3 ? '18px' : '22px',
        fontWeight: '800',
        color: i === 3 ? 'white' : 'var(--maroon)'
      }}>{stat.value}</p>
      <p style={{
        fontSize: '10px',
        color: i === 3 ? 'rgba(255,255,255,0.7)' : '#B0A0A0',
        fontWeight: '700', marginTop: '2px'
      }}>{stat.label}</p>
    </div>
  ))}
</div>

        {/* Contact number */}
        <div style={{
          background: '#FAFAFA',
          borderRadius: '18px',
          padding: '16px 18px',
          marginBottom: '12px',
          border: '1.5px solid #F0E8E8'
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: editing ? '12px' : '0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>📱</span>
              <div>
                <p style={{
                  fontSize: '11px', color: '#B0A0A0',
                  fontWeight: '700', textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>GCash Number</p>
                {!editing && (
                  <p style={{
                    fontSize: '15px', fontWeight: '700',
                    color: 'var(--text)', marginTop: '2px'
                  }}>{user.phone}</p>
                )}
              </div>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                style={{
                  background: '#FFF0F0',
                  color: 'var(--maroon)',
                  padding: '6px 14px',
                  borderRadius: '100px',
                  fontSize: '12px', fontWeight: '700',
                  border: '1.5px solid #FECACA'
                }}
              >Edit</button>
            )}
          </div>

          {editing && (
            <div>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                autoComplete="off"
                style={{
                  width: '100%', padding: '12px 14px',
                  borderRadius: '12px',
                  border: '2px solid var(--maroon)',
                  fontSize: '16px', fontWeight: '700',
                  letterSpacing: '1px', marginBottom: '10px',
                  background: 'white'
                }}
              />
              <p style={{
  fontSize: '11px', color: '#B0A0A0',
  marginTop: '1px', lineHeight: '1.5', marginBottom: '10px'
}}>
  This is where your earnings will be transferred after each completed transaction.
</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => { setEditing(false); setPhone(user.phone); }}
                  style={{
                    flex: 1, padding: '10px',
                    borderRadius: '10px', background: 'white',
                    border: '1.5px solid #EDE5E5',
                    fontSize: '13px', fontWeight: '700', color: '#888'
                  }}
                >Cancel</button>
                <button
                  onClick={handleSavePhone}
                  disabled={saving || phone.length < 11}
                  style={{
                    flex: 2, padding: '10px',
                    borderRadius: '10px',
                    background: phone.length < 11 ? '#F0E8E8' : 'var(--maroon)',
                    color: phone.length < 11 ? '#C0A8A8' : 'white',
                    fontSize: '13px', fontWeight: '800'
                  }}
                >{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          )}
        </div>

        {/* Account info */}
        <div style={{
          background: '#FAFAFA', borderRadius: '18px',
          padding: '16px 18px', marginBottom: '12px',
          border: '1.5px solid #F0E8E8'
        }}>
          {[
            { icon: '📧', label: 'Email', value: user.email },
            { icon: '🎓', label: 'Account Type', value: 'Regular User' },
            { icon: '📅', label: 'Member Since', value: new Date(user.created_at).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' }) }
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center',
              gap: '12px',
              paddingBottom: i < 2 ? '12px' : '0',
              marginBottom: i < 2 ? '12px' : '0',
              borderBottom: i < 2 ? '1px solid #F0E8E8' : 'none'
            }}>
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              <div>
                <p style={{
                  fontSize: '11px', color: '#B0A0A0',
                  fontWeight: '700', textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>{item.label}</p>
                <p style={{
                  fontSize: '14px', fontWeight: '600',
                  color: 'var(--text)', marginTop: '2px'
                }}>{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* My Entries button */}
        <button
          onClick={() => navigate('/')}
          style={{
            width: '100%', padding: '14px',
            borderRadius: '14px',
            background: '#F8F4F4',
            color: 'var(--text)',
            border: '1.5px solid #EDE5E5',
            fontSize: '14px', fontWeight: '700',
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}
        >
          <span>🏠 Go to Home Feed</span>
          <span style={{ color: '#B0A0A0' }}>→</span>
        </button>

        <button
          onClick={() => navigate('/my-requests')}
          style={{
            width: '100%', padding: '14px',
            borderRadius: '14px',
            background: '#F8F4F4',
            color: 'var(--text)',
            border: '1.5px solid #EDE5E5',
            fontSize: '14px', fontWeight: '700',
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px'
          }}
        >
          <span>📋 My Requests</span>
          <span style={{ color: '#B0A0A0' }}>→</span>
        </button>

        {/* Logout */}
        {!showLogoutConfirm ? (
          <button
            onClick={() => setShowLogoutConfirm(true)}
            style={{
              width: '100%', padding: '14px',
              borderRadius: '14px',
              background: '#FEF2F2',
              color: '#DC2626',
              border: '1.5px solid #FECACA',
              fontSize: '14px', fontWeight: '700'
            }}
          >🚪 Log Out</button>
        ) : (
          <div style={{
            background: '#FEF2F2',
            border: '1.5px solid #FECACA',
            borderRadius: '16px', padding: '16px'
          }}>
            <p style={{
              fontSize: '14px', fontWeight: '700',
              color: '#DC2626', marginBottom: '12px',
              textAlign: 'center'
            }}>Are you sure you want to log out?</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  flex: 1, padding: '11px',
                  borderRadius: '10px', background: 'white',
                  border: '1.5px solid #EDE5E5',
                  fontSize: '13px', fontWeight: '700', color: '#888'
                }}
              >Cancel</button>
              <button
                onClick={handleLogout}
                style={{
                  flex: 2, padding: '11px',
                  borderRadius: '10px',
                  background: '#DC2626', color: 'white',
                  fontSize: '13px', fontWeight: '800'
                }}
              >Yes, Log Out</button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%',
        transform: 'translateX(-50%)',
        width: '100%', maxWidth: '480px',
        background: 'white', borderTop: '1px solid #F0E8E8',
        display: 'flex', justifyContent: 'space-around',
        padding: '10px 0 20px', zIndex: 100,
        boxShadow: '0 -4px 24px rgba(0,0,0,0.08)'
      }}>
        {[
          { icon: '🏠', label: 'Home', path: '/' },
          { icon: '📋', label: 'Requests', path: '/my-requests' },
          { icon: '👤', label: 'Profile', path: '/profile' }
        ].map(item => {
          const active = window.location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                background: 'none', display: 'flex',
                flexDirection: 'column', alignItems: 'center',
                gap: '3px', padding: '6px 20px', borderRadius: '12px'
              }}
            >
              <span style={{ fontSize: '22px' }}>{item.icon}</span>
              <span style={{
                fontSize: '10px', fontWeight: '700',
                color: active ? 'var(--maroon)' : '#C0B0B0',
                textTransform: 'uppercase', letterSpacing: '0.5px'
              }}>{item.label}</span>
              {active && (
                <div style={{
                  width: '4px', height: '4px',
                  background: 'var(--maroon)', borderRadius: '50%'
                }}/>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}