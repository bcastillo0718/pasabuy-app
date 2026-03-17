import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import logoIcon from '../logo-icon.png';

export default function MyRequests({ user }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pasabuyer');
  const [buyerRequests, setBuyerRequests] = useState([]);
  const [pasabuyerRequests, setPasabuyerRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const [buyerRes, pasabuyerRes] = await Promise.all([
      supabase
        .from('requests')
        .select('*, entries(location, what_can_buy), pasabuyer:users!requests_pasabuyer_id_fkey(name, photo_url)')
        .eq('entries.buyer_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('requests')
        .select('*, entries(location, what_can_buy, buyer_id, users(name, photo_url))')
        .eq('pasabuyer_id', user.id)
        .order('created_at', { ascending: false })
    ]);

    setBuyerRequests(buyerRes.data?.filter(r => r.entries) || []);
    setPasabuyerRequests(pasabuyerRes.data || []);
    setLoading(false);
  };

  const getStatusStyle = (status, paymentStatus) => {
    if (status === 'completed') return { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0', label: '✓ Completed' };
    if (status === 'delivered') return { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE', label: '📦 Delivered' };
    if (status === 'rejected') return { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA', label: '✕ Rejected' };
    if (paymentStatus === 'paid') return { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0', label: '✅ Paid' };
    if (paymentStatus === 'awaiting_payment') return { bg: '#FFF8E8', color: '#D97706', border: '#FDE68A', label: '💳 Pay Now' };
    if (status === 'accepted') return { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE', label: '✓ Accepted' };
    return { bg: '#F8F4F4', color: '#888', border: '#E5E5E5', label: '⏳ Pending' };
  };

  const formatTime = (ts) => {
    const diff = Math.floor((new Date() - new Date(ts)) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  const requests = activeTab === 'pasabuyer' ? pasabuyerRequests : buyerRequests;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #6B0000 0%, #8B0000 45%, #1A3B20 100%)',
      display: 'flex', flexDirection: 'column',
      maxWidth: '480px', margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{ padding: '52px 24px 24px', position: 'relative' }}>
        <div style={{
          position: 'absolute', top: '-40px', right: '-40px',
          width: '200px', height: '200px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,229,102,0.1) 0%, transparent 65%)',
          pointerEvents: 'none'
        }}/>

        <div style={{
          display: 'flex', alignItems: 'center',
          gap: '10px', marginBottom: '20px'
        }}>
          <img src={logoIcon} alt="PasaBuy"
            style={{ width: '32px', height: '32px', borderRadius: '10px' }}/>
          <span style={{
            fontFamily: 'Raleway, sans-serif',
            color: 'var(--yellow)', fontSize: '18px', fontWeight: '800'
          }}>PasaBuy</span>
        </div>

        <h1 style={{
          fontFamily: 'Raleway, sans-serif',
          color: 'white', fontSize: '28px',
          fontWeight: '800', lineHeight: '1.2'
        }}>My Requests 📋</h1>
        <p style={{
          color: 'rgba(255,255,255,0.55)',
          fontSize: '13px', marginTop: '4px'
        }}>Track all your pasabuy activity</p>
      </div>

      {/* White card */}
      <div style={{
        flex: 1, background: 'white',
        borderRadius: '32px 32px 0 0',
        padding: '24px 20px 100px',
        boxShadow: '0 -4px 48px rgba(0,0,0,0.2)'
      }}>
        {/* Handle */}
        <div style={{
          width: '36px', height: '4px',
          background: '#EDE5E5', borderRadius: '4px',
          margin: '0 auto 20px'
        }}/>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: '8px',
          background: '#F8F4F4',
          borderRadius: '16px', padding: '4px',
          marginBottom: '20px'
        }}>
          {[
            { key: 'pasabuyer', label: '🛍️ My Requests', count: pasabuyerRequests.length },
            { key: 'buyer', label: '🏃 As Buyer', count: buyerRequests.length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, padding: '10px',
                borderRadius: '12px',
                background: activeTab === tab.key ? 'white' : 'transparent',
                color: activeTab === tab.key ? 'var(--maroon)' : '#888',
                fontSize: '13px', fontWeight: '700',
                boxShadow: activeTab === tab.key ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '6px'
              }}
            >
              {tab.label}
              <span style={{
                background: activeTab === tab.key ? 'var(--maroon)' : '#E0D8D8',
                color: activeTab === tab.key ? 'white' : '#888',
                borderRadius: '100px',
                padding: '1px 7px',
                fontSize: '11px', fontWeight: '700'
              }}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{
            textAlign: 'center', padding: '40px',
            color: '#B0A0A0', fontSize: '14px'
          }}>Loading...</div>
        )}

        {/* Empty state */}
        {!loading && requests.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '52px 24px',
            background: '#FFF8F8', borderRadius: '24px',
            border: '1.5px dashed #FECACA'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>
              {activeTab === 'pasabuyer' ? '🛍️' : '🏃'}
            </div>
            <h3 style={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: '17px', fontWeight: '800',
              color: 'var(--text)', marginBottom: '8px'
            }}>No requests yet</h3>
            <p style={{
              color: '#B0A0A0', fontSize: '13px', lineHeight: '1.6'
            }}>
              {activeTab === 'pasabuyer'
                ? 'Browse the feed and request a pasabuy!'
                : 'Post an entry and start accepting requests!'}
            </p>
            <button
              onClick={() => navigate('/')}
              style={{
                marginTop: '16px', padding: '12px 24px',
                borderRadius: '12px', background: 'var(--maroon)',
                color: 'white', fontSize: '13px', fontWeight: '700',
                boxShadow: 'var(--shadow-maroon)'
              }}
            >Go to Home →</button>
          </div>
        )}

        {/* Request cards */}
        {requests.map((req, idx) => {
          const statusStyle = getStatusStyle(req.status, req.payment_status);
          const canChat = req.status === 'accepted' ||
            req.status === 'delivered' ||
            req.payment_status === 'awaiting_payment' ||
            req.payment_status === 'paid';

          return (
            <div key={req.id} style={{
              background: 'white', borderRadius: '20px',
              padding: '16px', marginBottom: '12px',
              border: '1.5px solid #F0E8E8',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              animation: `fadeUp 0.4s ease ${idx * 0.05}s both`
            }}>
              {/* Top row */}
              <div style={{
                display: 'flex', alignItems: 'center',
                gap: '10px', marginBottom: '12px'
              }}>
                <img
                  src={activeTab === 'pasabuyer'
                    ? req.entries?.users?.photo_url
                    : req.pasabuyer?.photo_url}
                  alt=""
                  style={{
                    width: '40px', height: '40px',
                    borderRadius: '50%',
                    border: '2px solid #EDE5E5'
                  }}
                />
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontSize: '13px', fontWeight: '700',
                    color: 'var(--text)'
                  }}>
                    {activeTab === 'pasabuyer'
                      ? req.entries?.users?.name
                      : req.pasabuyer?.name}
                  </p>
                  <p style={{
                    fontSize: '11px', color: '#B0A0A0', marginTop: '1px'
                  }}>{formatTime(req.created_at)}</p>
                </div>
                <span style={{
                  background: statusStyle.bg,
                  color: statusStyle.color,
                  border: `1.5px solid ${statusStyle.border}`,
                  borderRadius: '100px',
                  padding: '4px 10px',
                  fontSize: '11px', fontWeight: '700'
                }}>{statusStyle.label}</span>
              </div>

              {/* Details */}
              <div style={{
                background: '#FAFAFA', borderRadius: '12px',
                padding: '12px', marginBottom: '12px'
              }}>
                <p style={{
                  fontSize: '14px', fontWeight: '700',
                  color: 'var(--text)', marginBottom: '6px'
                }}>🛍️ {req.item_name}</p>
                <div style={{
                  display: 'flex', gap: '16px',
                  flexWrap: 'wrap'
                }}>
                  <div>
                    <p style={{
                      fontSize: '10px', color: '#B0A0A0',
                      fontWeight: '700', textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Location</p>
                    <p style={{
                      fontSize: '12px', fontWeight: '600',
                      color: 'var(--text)'
                    }}>📍 {req.entries?.location}</p>
                  </div>
                  {req.total_amount && (
                    <div>
                      <p style={{
                        fontSize: '10px', color: '#B0A0A0',
                        fontWeight: '700', textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>Total</p>
                      <p style={{
                        fontSize: '12px', fontWeight: '700',
                        color: 'var(--maroon)'
                      }}>₱{req.total_amount}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Chat button */}
              {canChat && (
                <button
                  onClick={() => navigate(`/chat/${req.id}`)}
                  style={{
                    width: '100%', padding: '11px',
                    borderRadius: '12px',
                    background: req.status === 'completed'
                      ? '#F8F4F4' : 'var(--maroon)',
                    color: req.status === 'completed' ? '#888' : 'white',
                    fontSize: '13px', fontWeight: '700',
                    boxShadow: req.status === 'completed'
                      ? 'none' : 'var(--shadow-maroon)'
                  }}
                >
                  {req.status === 'completed' ? '📋 View Chat' : '💬 Open Chat →'}
                </button>
              )}
            </div>
          );
        })}
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