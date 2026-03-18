import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import logoIcon from '../logo-icon.png';
import { Home, ClipboardList, User } from 'lucide-react';
import { Home as HomeIcon, ClipboardList, User, MapPin, ShoppingBag } from 'lucide-react';

export default function Home({ user }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      .select('*, users(name, photo_url, avg_rating, total_ratings)')
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
          width: '220px', height: '220px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,229,102,0.1) 0%, transparent 65%)',
          pointerEvents: 'none'
        }}/>

        {/* Top bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <div style={{
              width: '32px', height: '32px',
              background: 'var(--yellow)',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img src={logoIcon} alt="PasaBuy"
                style={{ width: '24px', height: '24px', borderRadius: '6px' }}/>
            </div>
            <span style={{
              fontFamily: 'Raleway, sans-serif',
              color: 'var(--yellow)',
              fontSize: '17px', fontWeight: '800'
            }}>PasaBuy</span>
          </div>

          <img
            src={user.photo_url}
            alt="Profile"
            onClick={() => navigate('/profile')}
            style={{
              width: '40px', height: '40px',
              borderRadius: '50%',
              border: '2px solid var(--yellow)',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(255,229,102,0.25)'
            }}
          />
        </div>

        {/* Greeting */}
        <h1 style={{
          fontFamily: 'Raleway, sans-serif',
          color: 'white', fontSize: '26px',
          fontWeight: '800', lineHeight: '1.2',
          marginBottom: '4px',
          letterSpacing: '-0.3px'
        }}>Hey, {user.name?.split(' ')[0]}! 👋</h1>
        <p style={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: '13px', marginBottom: '20px'
        }}>What are you up to today?</p>

        {/* Post entry CTA */}
        <button
          onClick={() => navigate('/post-entry')}
          style={{
            width: '100%',
            padding: '16px 20px',
            borderRadius: '18px',
            background: 'var(--yellow)',
            color: 'var(--maroon)',
            fontSize: '14px', fontWeight: '800',
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 8px 24px rgba(255,229,102,0.3)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px',
              background: 'rgba(139,0,0,0.12)',
              borderRadius: '12px',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>🏃</div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: '14px', fontWeight: '800' }}>
                I'm going out!
              </p>
              <p style={{
                fontSize: '11px',
                fontWeight: '500',
                opacity: 0.65,
                marginTop: '1px'
              }}>Post an entry & earn commission</p>
            </div>
          </div>
          <span style={{
            width: '28px', height: '28px',
            background: 'rgba(139,0,0,0.1)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px'
          }}>→</span>
        </button>
      </div>

      {/* Feed */}
      <div style={{
        flex: 1,
        background: 'white',
        borderRadius: '32px 32px 0 0',
        padding: '20px 20px 100px',
        boxShadow: '0 -8px 48px rgba(0,0,0,0.18)'
      }}>
        {/* Handle */}
        <div style={{
          width: '32px', height: '4px',
          background: '#EDE5E5', borderRadius: '4px',
          margin: '0 auto 20px'
        }}/>

        {/* Section header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h2 style={{
            fontFamily: 'Raleway, sans-serif',
            fontSize: '18px', fontWeight: '800',
            color: 'var(--text)',
            letterSpacing: '-0.2px'
          }}>Active Entries</h2>
          <span style={{
            background: entries.length > 0 ? '#FEF3F2' : '#F5F5F5',
            color: entries.length > 0 ? 'var(--maroon)' : 'var(--text-soft)',
            border: `1px solid ${entries.length > 0 ? '#FECACA' : '#E5E5E5'}`,
            borderRadius: '100px',
            padding: '3px 10px',
            fontSize: '11px', fontWeight: '700'
          }}>{entries.length} active</span>
        </div>

        {/* Loading skeleton */}
        {loading && [1, 2, 3].map(i => (
          <div key={i} style={{
            background: '#F8F4F4',
            borderRadius: '16px',
            height: '110px',
            marginBottom: '12px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)',
              animation: 'shimmer 1.5s infinite'
            }}/>
          </div>
        ))}

        {/* Empty state */}
        {!loading && entries.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '48px 24px',
            background: '#FFF8F8',
            borderRadius: '20px',
            border: '1px dashed #FECACA'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '14px' }}>🏪</div>
            <h3 style={{
              fontFamily: 'Raleway, sans-serif',
              color: 'var(--text)', fontSize: '17px',
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
              borderRadius: '18px',
              padding: '16px',
              marginBottom: '12px',
              border: '1px solid #F0E8E8',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              animation: `fadeUp 0.4s ease ${idx * 0.05}s both`
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(139,0,0,0.08)';
              e.currentTarget.style.borderColor = '#FECACA';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
              e.currentTarget.style.borderColor = '#F0E8E8';
            }}
          >
            {/* Buyer row */}
            <div style={{
              display: 'flex', alignItems: 'center',
              gap: '10px', marginBottom: '12px'
            }}>
              <img
                src={entry.users?.photo_url}
                alt="Buyer"
                style={{
                  width: '40px', height: '40px',
                  borderRadius: '50%',
                  border: '2px solid #F0E8E8'
                }}
              />
              <div style={{ flex: 1 }}>
                <p style={{
                  fontWeight: '700', fontSize: '14px',
                  color: 'var(--text)'
                }}>{entry.users?.name}</p>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  gap: '6px', marginTop: '2px'
                }}>
                  <p style={{
                    color: 'var(--text-soft)',
                    fontSize: '11px'
                  }}>{formatTime(entry.created_at)}</p>
                  {entry.users?.avg_rating > 0 && (
                    <span style={{
                      fontSize: '11px', fontWeight: '700',
                      color: '#D97706'
                    }}>⭐ {entry.users?.avg_rating}</span>
                  )}
                </div>
              </div>
              <span style={{
                background: '#F0FDF4',
                color: '#16A34A',
                border: '1px solid #BBF7D0',
                borderRadius: '100px',
                padding: '3px 10px',
                fontSize: '11px', fontWeight: '700'
              }}>● Active</span>
            </div>

            {/* Details */}
            <div style={{
              background: '#FAFAFA',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginBottom: '10px'
            }}>
              {[
                { icon: <MapPin size={14} strokeWidth={2}/>, label: 'Going to', value: entry.location },
                { icon: <ShoppingBag size={14} strokeWidth={2}/>, label: 'Can buy', value: entry.what_can_buy },
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', gap: '10px',
                  alignItems: 'flex-start',
                  paddingBottom: i === 0 ? '8px' : '0',
                  borderBottom: i === 0 ? '1px solid #F0E8E8' : 'none'
                }}>
                  <span style={{ 
                    color: 'var(--maroon)',
                    marginTop: '1px',
                    display: 'flex', alignItems: 'center'
                  }}>{item.icon}</span>
                  <div>
                    <p style={{
                      fontSize: '10px', color: 'var(--text-soft)',
                      fontWeight: '600', textTransform: 'uppercase',
                      letterSpacing: '0.5px', marginBottom: '2px'
                    }}>{item.label}</p>
                    <p style={{
                      fontSize: '13px', fontWeight: '600',
                      color: 'var(--text)'
                    }}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              display: 'flex', justifyContent: 'flex-end'
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
        boxShadow: '0 -4px 24px rgba(0,0,0,0.06)'
      }}>
        {[
          { icon: <HomeIcon size={22} strokeWidth={2}/>, label: 'Home', path: '/' },
          { icon: <ClipboardList size={22} strokeWidth={2}/>, label: 'Requests', path: '/my-requests' },
          { icon: <User size={22} strokeWidth={2}/>, label: 'Profile', path: '/profile' }
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
              <span style={{ 
                color: active ? 'var(--maroon)' : '#C0B0B0',
                display: 'flex', alignItems: 'center'
              }}>{item.icon}</span>
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