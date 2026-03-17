import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

import logoIcon from '../logo-icon.png';

export default function Home({ user }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEntries();
    const channel = supabase
      .channel('entries')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'entries'
      }, () => fetchEntries())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const fetchEntries = async () => {
    const { data } = await supabase
      .from('entries')
      .select('*, users(name, photo_url)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    setEntries(data || []);
    setLoading(false);
  };

  const formatTime = (ts) => {
    const diff = Math.floor((new Date() - new Date(ts)) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #6B0000 0%, #8B0000 45%, #1A3B20 100%)',
      maxWidth: '480px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '52px 24px 20px',
        position: 'relative'
      }}>
        {/* Glow */}
        <div style={{
          position: 'absolute', top: '-40px', right: '-40px',
          width: '200px', height: '200px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,229,102,0.12) 0%, transparent 65%)',
          pointerEvents: 'none'
        }}/>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div>
            <div style={{
              display: 'flex', alignItems: 'center',
              gap: '8px', marginBottom: '6px'
            }}>
              <div style={{
                width: '32px', height: '32px',
                background: 'var(--yellow)',
                borderRadius: '10px',
                display: 'flex', alignItems: 'center',
justifyContent: 'center'
}}>
  <img src={logoIcon} alt="PasaBuy" style={{ width: '26px', height: '26px', borderRadius: '7px' }}/>
</div>
<span style={{
  fontFamily: 'Raleway, sans-serif',
  color: 'var(--yellow)',
  fontSize: '18px', fontWeight: '800'
}}>PasaBuy</span>
            </div>
            <h1 style={{
              fontFamily: 'Raleway, sans-serif',
              color: 'white', fontSize: '26px',
              fontWeight: '800', lineHeight: '1.2'
            }}>Hey, {user.name?.split(' ')[0]}! 👋</h1>
            <p style={{
              color: 'rgba(255,255,255,0.55)',
              fontSize: '13px', marginTop: '4px'
            }}>What are you up to today?</p>
          </div>

          <img
            src={user.photo_url}
            alt="Profile"
            onClick={() => navigate('/profile')}
            style={{
              width: '48px', height: '48px',
              borderRadius: '50%',
              border: '2.5px solid var(--yellow)',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-yellow)'
            }}
          />
        </div>

        {/* Post entry CTA */}
        <button
          onClick={() => navigate('/post-entry')}
          style={{
            width: '100%', marginTop: '20px',
            padding: '16px 20px',
            borderRadius: '18px',
            background: 'var(--yellow)',
            color: 'var(--maroon)',
            fontSize: '15px', fontWeight: '800',
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-yellow)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px' }}>🏃</span>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: '15px', fontWeight: '800' }}>
                I'm going out!
              </p>
              <p style={{
                fontSize: '11px',
                fontWeight: '500',
                opacity: 0.7
              }}>Post an entry & earn commission</p>
            </div>
          </div>
          <span style={{ fontSize: '20px' }}>→</span>
        </button>
      </div>

      {/* Feed */}
      <div style={{
        flex: 1,
        background: 'white',
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

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h2 style={{
            fontFamily: 'Raleway, sans-serif',
            fontSize: '20px', fontWeight: '800',
            color: 'var(--text)'
          }}>Active Entries</h2>
          <span style={{
            background: entries.length > 0 ? '#FEF3F2' : '#F5F5F5',
            color: entries.length > 0 ? 'var(--maroon)' : 'var(--text-soft)',
            border: `1.5px solid ${entries.length > 0 ? '#FECACA' : '#E5E5E5'}`,
            borderRadius: '100px',
            padding: '4px 12px',
            fontSize: '12px', fontWeight: '700'
          }}>{entries.length} active</span>
        </div>

        {/* Loading skeleton */}
        {loading && [1, 2, 3].map(i => (
          <div key={i} style={{
            background: '#F8F4F4',
            borderRadius: '18px',
            height: '120px',
            marginBottom: '12px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)',
              animation: 'shimmer 1.5s infinite'
            }}/>
          </div>
        ))}

        {/* Empty state */}
        {!loading && entries.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '52px 24px',
            background: '#FFF8F8',
            borderRadius: '24px',
            border: '1.5px dashed #FECACA'
          }}>
            <div style={{ fontSize: '52px', marginBottom: '16px' }}>🏪</div>
            <h3 style={{
              fontFamily: 'Raleway, sans-serif',
              color: 'var(--text)', fontSize: '18px',
              fontWeight: '800', marginBottom: '8px'
            }}>No active entries yet</h3>
            <p style={{
              color: 'var(--text-soft)',
              fontSize: '13px', lineHeight: '1.6'
            }}>
              Going out? Be the first to post an entry<br/>
              and earn commission!
            </p>
          </div>
        )}

        {/* Entry cards */}
        {entries.map((entry, idx) => (
          <div
            key={entry.id}
            onClick={() => navigate(`/entry/${entry.id}`)}
            style={{
              background: 'white',
              borderRadius: '20px',
              padding: '16px',
              marginBottom: '12px',
              border: '1.5px solid #F0E8E8',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              animation: `fadeUp 0.4s ease ${idx * 0.05}s both`
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(139,0,0,0.1)';
              e.currentTarget.style.borderColor = '#FECACA';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)';
              e.currentTarget.style.borderColor = '#F0E8E8';
            }}
          >
            {/* Buyer row */}
            <div style={{
              display: 'flex', alignItems: 'center',
              gap: '10px', marginBottom: '14px'
            }}>
              <img
                src={entry.users?.photo_url}
                alt="Buyer"
                style={{
                  width: '42px', height: '42px',
                  borderRadius: '50%',
                  border: '2px solid var(--maroon)'
                }}
              />
              <div style={{ flex: 1 }}>
                <p style={{
                  fontWeight: '700', fontSize: '14px',
                  color: 'var(--text)'
                }}>{entry.users?.name}</p>
                <p style={{
                  color: 'var(--text-soft)',
                  fontSize: '11px', marginTop: '1px'
                }}>{formatTime(entry.created_at)}</p>
              </div>
              <span style={{
                background: '#F0FDF4',
                color: '#16A34A',
                border: '1.5px solid #BBF7D0',
                borderRadius: '100px',
                padding: '4px 10px',
                fontSize: '11px', fontWeight: '700'
              }}>● Active</span>
            </div>

            {/* Details */}
            <div style={{
              background: '#FAFAFA',
              borderRadius: '14px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {[
                { icon: '📍', label: 'Going to', value: entry.location },
                { icon: '🛍️', label: 'Can buy', value: entry.what_can_buy },
                
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', gap: '10px', alignItems: 'flex-start'
                }}>
                  <span style={{ fontSize: '14px', marginTop: '1px' }}>{item.icon}</span>
                  <div>
                    <span style={{
                      fontSize: '10px', color: 'var(--text-soft)',
                      fontWeight: '600', textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>{item.label}</span>
                    <p style={{
                      fontSize: '13px', fontWeight: '700',
                      color: 'var(--text)', marginTop: '1px'
                    }}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              display: 'flex', justifyContent: 'flex-end',
              marginTop: '10px'
            }}>
              <span style={{
                color: 'var(--maroon)',
                fontSize: '12px', fontWeight: '700',
                display: 'flex', alignItems: 'center', gap: '4px'
              }}>Request a Pasabuy →</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom nav */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%',
        transform: 'translateX(-50%)',
        width: '100%', maxWidth: '480px',
        background: 'white',
        borderTop: '1px solid #F0E8E8',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '10px 0 20px',
        zIndex: 100,
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
                background: 'none',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '3px',
                padding: '6px 20px',
                borderRadius: '12px',
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
                  background: 'var(--maroon)',
                  borderRadius: '50%'
                }}/>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}