import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import logoIcon from '../logo-icon.png';

import { Home as HomeIcon, ClipboardList, User, Mail, GraduationCap, Calendar, Smartphone } from 'lucide-react';

export default function Profile({ user, onUpdate }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ asBuyer: 0, asPasabuyer: 0, completed: 0, earnings: 0 });
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState(user.phone || '');
  const [saving, setSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [badges, setBadges] = useState([]);

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

    // Calculate badges
    const earnedBadges = [];

    if (completed >= 1) earnedBadges.push({ id: 'first_pasabuy', icon: '🌟', label: 'First Pasabuy', desc: 'Completed first transaction' });
    if (completed >= 5) earnedBadges.push({ id: 'on_a_roll', icon: '🔥', label: 'On a Roll', desc: 'Completed 5 transactions' });
    if (completed >= 10) earnedBadges.push({ id: 'top_pasabuyer', icon: '💎', label: 'Top Pasabuyer', desc: 'Completed 10 transactions' });
    if (user.avg_rating >= 4.5 && user.total_ratings >= 3) earnedBadges.push({ id: 'highly_rated', icon: '⭐', label: 'Highly Rated', desc: 'Average rating of 4.5+' });
    if (buyerRequests.length >= 5) earnedBadges.push({ id: 'active_buyer', icon: '🏃', label: 'Active Buyer', desc: 'Posted 5 entries' });
    if (totalEarnings >= 500) earnedBadges.push({ id: 'big_earner', icon: '💸', label: 'Big Earner', desc: 'Earned ₱500+ in commissions' });

    // Save badges to database
    await supabase.from('users').update({
      badges: earnedBadges.map(b => b.id)
    }).eq('id', user.id);

    setBadges(earnedBadges);
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
        padding: '52px 24px 72px',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: '240px', height: '240px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,229,102,0.1) 0%, transparent 65%)',
          pointerEvents: 'none'
        }}/>

        {/* Brand */}
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: '8px', marginBottom: '24px'
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
            color: 'var(--yellow)', fontSize: '17px', fontWeight: '800'
          }}>PasaBuy App</span>
        </div>

        {/* Avatar */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img
              src={user.photo_url}
              alt="Profile"
              style={{
                width: '84px', height: '84px',
                borderRadius: '50%',
                border: '3px solid var(--yellow)',
                boxShadow: '0 8px 24px rgba(255,229,102,0.25)'
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
            color: 'white', fontSize: '20px',
            fontWeight: '800', marginTop: '12px',
            letterSpacing: '-0.2px'
          }}>{user.name}</h2>
          <p style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: '13px', marginTop: '3px'
          }}>{user.email}</p>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '6px',
            marginTop: '8px'
          }}>
            {user.avg_rating > 0 ? (
              <>
                <span style={{ fontSize: '14px' }}>⭐</span>
                <span style={{
                  color: 'var(--yellow)', fontSize: '15px',
                  fontWeight: '800'
                }}>{user.avg_rating}</span>
                <span style={{
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: '12px'
                }}>({user.total_ratings} {user.total_ratings === 1 ? 'rating' : 'ratings'})</span>
              </>
            ) : (
              <span style={{
                color: 'rgba(255,255,255,0.3)',
                fontSize: '12px'
              }}>No ratings yet</span>
            )}
          </div>
        </div>
      </div>

      {/* White card */}
      <div style={{
        flex: 1, background: 'white',
        borderRadius: '32px 32px 0 0',
        marginTop: '-36px',
        padding: '24px 20px 100px',
        boxShadow: '0 -8px 48px rgba(0,0,0,0.18)'
      }}>
        <div style={{
          width: '32px', height: '4px',
          background: '#EDE5E5', borderRadius: '4px',
          margin: '0 auto 24px'
        }}/>

        {/* Stats grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          marginBottom: '20px'
        }}>
          {[
            { label: 'As Buyer', value: stats.asBuyer, icon: '🏃', green: false },
            { label: 'As Pasabuyer', value: stats.asPasabuyer, icon: '🛍️', green: false },
            { label: 'Completed', value: stats.completed, icon: '✅', green: false },
            { label: 'Total Earned', value: `₱${stats.earnings || 0}`, icon: '💸', green: true }
          ].map((stat, i) => (
            <div key={i} style={{
              background: stat.green
                ? 'linear-gradient(135deg, #1A6B2F, #2E9E4F)'
                : '#FAFAFA',
              borderRadius: '14px', padding: '14px',
              textAlign: 'center',
              border: stat.green ? 'none' : '1px solid #F0E8E8'
            }}>
              <div style={{ fontSize: '20px', marginBottom: '6px' }}>{stat.icon}</div>
              <p style={{
                fontFamily: 'Raleway, sans-serif',
                fontSize: stat.green ? '18px' : '22px',
                fontWeight: '800',
                color: stat.green ? 'white' : 'var(--maroon)'
              }}>{stat.value}</p>
              <p style={{
                fontSize: '10px',
                color: stat.green ? 'rgba(255,255,255,0.7)' : '#B0A0A0',
                fontWeight: '700', marginTop: '2px'
              }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div style={{
            background: '#FAFAFA',
            borderRadius: '16px',
            padding: '14px 16px',
            marginBottom: '10px',
            border: '1px solid #F0E8E8'
          }}>
            <p style={{
              fontSize: '10px', color: '#B0A0A0',
              fontWeight: '700', textTransform: 'uppercase',
              letterSpacing: '0.7px', marginBottom: '12px'
            }}>🏆 Achievements</p>
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: '8px'
            }}>
              {badges.map((badge, i) => (
                <div key={i} style={{
                  background: 'white',
                  border: '1px solid #F0E8E8',
                  borderRadius: '12px',
                  padding: '8px 12px',
                  display: 'flex', alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                }}>
                  <span style={{ fontSize: '18px' }}>{badge.icon}</span>
                  <div>
                    <p style={{
                      fontSize: '11px', fontWeight: '700',
                      color: 'var(--text)'
                    }}>{badge.label}</p>
                    <p style={{
                      fontSize: '10px', color: '#B0A0A0',
                      marginTop: '1px'
                    }}>{badge.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}  

        {/* GCash Number */}
        <div style={{
          background: '#FAFAFA',
          borderRadius: '16px',
          padding: '14px 16px',
          marginBottom: '10px',
          border: '1px solid #F0E8E8'
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: editing ? '12px' : '0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px',
                background: '#FFF0F0',
                borderRadius: '10px',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--maroon)'
              }}><Smartphone size={18} strokeWidth={2}/></div>
              <div>
                <p style={{
                  fontSize: '10px', color: '#B0A0A0',
                  fontWeight: '700', textTransform: 'uppercase',
                  letterSpacing: '0.7px'
                }}>GCash Number</p>
                {!editing && (
                  <p style={{
                    fontSize: '15px', fontWeight: '700',
                    color: 'var(--text)', marginTop: '2px',
                    letterSpacing: '0.5px'
                  }}>{user.phone}</p>
                )}
              </div>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                style={{
                  background: 'white',
                  color: 'var(--maroon)',
                  padding: '6px 14px',
                  borderRadius: '100px',
                  fontSize: '12px', fontWeight: '700',
                  border: '1px solid #FECACA'
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
                  borderRadius: '11px',
                  border: '1.5px solid var(--maroon)',
                  fontSize: '16px', fontWeight: '700',
                  letterSpacing: '1.5px', marginBottom: '8px',
                  background: 'white'
                }}
              />
              <p style={{
                fontSize: '11px', color: '#B0A0A0',
                lineHeight: '1.5', marginBottom: '10px'
              }}>
                💡 Your earnings will be transferred here after each completed transaction.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => { setEditing(false); setPhone(user.phone); }}
                  style={{
                    flex: 1, padding: '10px',
                    borderRadius: '10px', background: 'white',
                    border: '1px solid #EDE5E5',
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
          background: '#FAFAFA', borderRadius: '16px',
          padding: '14px 16px', marginBottom: '12px',
          border: '1px solid #F0E8E8'
        }}>
          {[
            { icon: <Mail size={16} strokeWidth={2}/>, label: 'Email', value: user.email },
            { icon: <GraduationCap size={16} strokeWidth={2}/>, label: 'Account Type', value: 'Regular User' },
            { icon: <Calendar size={16} strokeWidth={2}/>, label: 'Member Since', value: new Date(user.created_at).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' }) }
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center',
              gap: '12px',
              paddingBottom: i < 2 ? '12px' : '0',
              marginBottom: i < 2 ? '12px' : '0',
              borderBottom: i < 2 ? '1px solid #F0E8E8' : 'none'
            }}>
              <div style={{
                width: '34px', height: '34px',
                background: '#F5F0F0',
                borderRadius: '9px',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: 'var(--maroon)'
              }}>{item.icon}</div>
              <div>
                <p style={{
                  fontSize: '10px', color: '#B0A0A0',
                  fontWeight: '700', textTransform: 'uppercase',
                  letterSpacing: '0.7px'
                }}>{item.label}</p>
                <p style={{
                  fontSize: '13px', fontWeight: '600',
                  color: 'var(--text)', marginTop: '2px'
                }}>{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Nav buttons */}
        {[
          { icon: '🏠', label: 'Browse Active Entries', path: '/' },
          { icon: '📋', label: 'Check My Requests', path: '/my-requests' },
          { icon: '❓', label: 'FAQs', path: '/faq' },
          { icon: '🎧', label: 'Chat Support', path: '/support' }
        ].map((btn, i) => (
          <button
            key={i}
            onClick={() => navigate(btn.path)}
            style={{
              width: '100%', padding: '13px 16px',
              borderRadius: '13px',
              background: '#FAFAFA',
              color: 'var(--text)',
              border: '1px solid #EDE5E5',
              fontSize: '13px', fontWeight: '700',
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}
          >
            <span>{btn.icon} {btn.label}</span>
            <span style={{ color: '#C0B0B0', fontSize: '16px' }}>→</span>
          </button>
        ))}

        {/* Logout */}
        {!showLogoutConfirm ? (
          <button
            onClick={() => setShowLogoutConfirm(true)}
            style={{
              width: '100%', padding: '13px',
              borderRadius: '13px',
              background: '#FEF2F2',
              color: '#DC2626',
              border: '1px solid #FECACA',
              fontSize: '13px', fontWeight: '700',
              marginTop: '4px'
            }}
          >🚪 Log Out</button>
        ) : (
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '14px', padding: '16px',
            marginTop: '4px'
          }}>
            <p style={{
              fontSize: '13px', fontWeight: '700',
              color: '#DC2626', marginBottom: '12px',
              textAlign: 'center'
            }}>Are you sure you want to log out?</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  flex: 1, padding: '10px',
                  borderRadius: '10px', background: 'white',
                  border: '1px solid #EDE5E5',
                  fontSize: '13px', fontWeight: '700', color: '#888'
                }}
              >Cancel</button>
              <button
                onClick={handleLogout}
                style={{
                  flex: 2, padding: '10px',
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
                background: 'none', display: 'flex',
                flexDirection: 'column', alignItems: 'center',
                gap: '3px', padding: '6px 20px', borderRadius: '12px'
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