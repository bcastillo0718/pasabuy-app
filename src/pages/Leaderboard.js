import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import logoIcon from '../logo-icon.png';

export default function Leaderboard({ user }) {
  const navigate = useNavigate();
  const [topEarners, setTopEarners] = useState([]);
  const [topPasabuyers, setTopPasabuyers] = useState([]);
  const [activeTab, setActiveTab] = useState('earners');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    // Top earners — buyers with most commission earned
    const { data: earnersData } = await supabase
      .from('requests')
      .select('commission, entries(buyer_id, users(name, photo_url, avg_rating))')
      .eq('status', 'completed')
      .not('entries', 'is', null);

    // Group by buyer
    const earnerMap = {};
    earnersData?.forEach(r => {
      const buyer = r.entries?.users;
      const buyerId = r.entries?.buyer_id;
      if (!buyer || !buyerId) return;
      if (!earnerMap[buyerId]) {
        earnerMap[buyerId] = {
          id: buyerId,
          name: buyer.name,
          photo_url: buyer.photo_url,
          avg_rating: buyer.avg_rating,
          totalEarned: 0
        };
      }
      earnerMap[buyerId].totalEarned += r.commission || 0;
    });

    const earners = Object.values(earnerMap)
      .sort((a, b) => b.totalEarned - a.totalEarned)
      .slice(0, 10);

    // Top pasabuyers — most completed transactions
    const { data: pasabuyerData } = await supabase
      .from('requests')
      .select('pasabuyer_id, pasabuyer:users!requests_pasabuyer_id_fkey(name, photo_url, avg_rating)')
      .eq('status', 'completed');

    const pasabuyerMap = {};
    pasabuyerData?.forEach(r => {
      const id = r.pasabuyer_id;
      if (!id) return;
      if (!pasabuyerMap[id]) {
        pasabuyerMap[id] = {
          id,
          name: r.pasabuyer?.name,
          photo_url: r.pasabuyer?.photo_url,
          avg_rating: r.pasabuyer?.avg_rating,
          completed: 0
        };
      }
      pasabuyerMap[id].completed += 1;
    });

    const pasabuyers = Object.values(pasabuyerMap)
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 10);

    setTopEarners(earners);
    setTopPasabuyers(pasabuyers);
    setLoading(false);
  };

  const getRankStyle = (rank) => {
    if (rank === 0) return { bg: '#FFF8E8', border: '#FDE68A', color: '#D97706', medal: '🥇' };
    if (rank === 1) return { bg: '#F8F8F8', border: '#E5E5E5', color: '#888', medal: '🥈' };
    if (rank === 2) return { bg: '#FFF5F0', border: '#FECACA', color: '#D97706', medal: '🥉' };
    return { bg: 'white', border: '#F0E8E8', color: '#B0A0A0', medal: `#${rank + 1}` };
  };

  const list = activeTab === 'earners' ? topEarners : topPasabuyers;

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
          justifyContent: 'space-between', marginBottom: '20px'
        }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: 'white', padding: '8px 16px',
              borderRadius: '100px', fontSize: '13px',
              fontWeight: '600', border: '1px solid rgba(255,255,255,0.12)'
            }}
          >← Back</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '30px', height: '30px',
              background: 'var(--yellow)', borderRadius: '9px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <img src={logoIcon} alt="PasaBuy"
                style={{ width: '22px', height: '22px', borderRadius: '6px' }}/>
            </div>
            <span style={{
              fontFamily: 'Raleway, sans-serif',
              color: 'var(--yellow)', fontSize: '17px', fontWeight: '800'
            }}>PasaBuy</span>
          </div>
        </div>

        <h1 style={{
          fontFamily: 'Raleway, sans-serif',
          color: 'white', fontSize: '26px',
          fontWeight: '800', letterSpacing: '-0.3px'
        }}>Leaderboard 📊</h1>
        <p style={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: '13px', marginTop: '4px'
        }}>Top performers on campus</p>
      </div>

      {/* White card */}
      <div style={{
        flex: 1, background: 'white',
        borderRadius: '32px 32px 0 0',
        padding: '20px 20px 100px',
        boxShadow: '0 -8px 48px rgba(0,0,0,0.18)'
      }}>
        <div style={{
          width: '32px', height: '4px',
          background: '#EDE5E5', borderRadius: '4px',
          margin: '0 auto 20px'
        }}/>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: '6px',
          background: '#F5F0F0',
          borderRadius: '14px', padding: '4px',
          marginBottom: '20px'
        }}>
          {[
            { key: 'earners', label: '💸 Top Earners' },
            { key: 'pasabuyers', label: '🛍️ Top Pasabuyers' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, padding: '9px 8px',
                borderRadius: '11px',
                background: activeTab === tab.key ? 'white' : 'transparent',
                color: activeTab === tab.key ? 'var(--maroon)' : '#AAA',
                fontSize: '12px', fontWeight: '700',
                boxShadow: activeTab === tab.key ? '0 1px 6px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.18s ease'
              }}
            >{tab.label}</button>
          ))}
        </div>

        {/* Loading */}
        {loading && [1, 2, 3].map(i => (
          <div key={i} style={{
            background: '#F8F4F4', borderRadius: '16px',
            height: '72px', marginBottom: '10px',
            overflow: 'hidden', position: 'relative'
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)',
              animation: 'shimmer 1.5s infinite'
            }}/>
          </div>
        ))}

        {/* Empty state */}
        {!loading && list.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '48px 24px',
            background: '#FFF8F8', borderRadius: '20px',
            border: '1px dashed #FECACA'
          }}>
            <div style={{ fontSize: '44px', marginBottom: '12px' }}>📊</div>
            <h3 style={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: '16px', fontWeight: '800',
              color: 'var(--text)', marginBottom: '8px'
            }}>No data yet</h3>
            <p style={{ color: '#B0A0A0', fontSize: '13px' }}>
              Complete transactions to appear here!
            </p>
          </div>
        )}

        {/* Leaderboard list */}
        {list.map((item, idx) => {
          const rankStyle = getRankStyle(idx);
          const isMe = item.id === user.id;
          return (
            <div key={item.id} style={{
              background: isMe ? '#FFF5F5' : rankStyle.bg,
              borderRadius: '16px', padding: '14px',
              marginBottom: '10px',
              border: `1px solid ${isMe ? '#FECACA' : rankStyle.border}`,
              boxShadow: idx < 3 ? '0 2px 12px rgba(0,0,0,0.06)' : 'none',
              display: 'flex', alignItems: 'center', gap: '12px',
              animation: `fadeUp 0.4s ease ${idx * 0.05}s both`
            }}>
              {/* Rank */}
              <div style={{
                width: '36px', height: '36px',
                borderRadius: '10px',
                background: idx < 3 ? rankStyle.bg : '#F5F0F0',
                border: `1px solid ${rankStyle.border}`,
                display: 'flex', alignItems: 'center',
                justifyContent: 'center',
                fontSize: idx < 3 ? '20px' : '13px',
                fontWeight: '800',
                color: rankStyle.color,
                flexShrink: 0
              }}>{rankStyle.medal}</div>

              {/* Avatar */}
              <img src={item.photo_url} alt=""
                style={{
                  width: '40px', height: '40px',
                  borderRadius: '50%',
                  border: `2px solid ${isMe ? 'var(--maroon)' : '#EDE5E5'}`,
                  flexShrink: 0
                }}
              />

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <p style={{
                    fontSize: '13px', fontWeight: '700',
                    color: 'var(--text)'
                  }}>{item.name}</p>
                  {isMe && (
                    <span style={{
                      background: 'var(--maroon)', color: 'white',
                      fontSize: '9px', fontWeight: '700',
                      padding: '2px 6px', borderRadius: '100px'
                    }}>YOU</span>
                  )}
                </div>
                {item.avg_rating > 0 && (
                  <p style={{
                    fontSize: '11px', color: '#D97706',
                    fontWeight: '600', marginTop: '2px'
                  }}>⭐ {item.avg_rating}</p>
                )}
              </div>

              {/* Score */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{
                  fontFamily: 'Raleway, sans-serif',
                  fontSize: '16px', fontWeight: '800',
                  color: activeTab === 'earners' ? 'var(--green)' : 'var(--maroon)'
                }}>
                  {activeTab === 'earners'
                    ? `₱${item.totalEarned}`
                    : `${item.completed} done`}
                </p>
                <p style={{
                  fontSize: '10px', color: '#B0A0A0',
                  marginTop: '2px', fontWeight: '600'
                }}>
                  {activeTab === 'earners' ? 'earned' : 'transactions'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}