import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, useParams } from 'react-router-dom';
import logoIcon from '../logo-icon.png';
import { MapPin, ShoppingBag } from 'lucide-react';

export default function EntryDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');

  const isBuyer = entry?.buyer_id === user.id;
  const hasRequested = requests.some(r => r.pasabuyer_id === user.id);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchEntry();
    fetchRequests();
    const channel = supabase
      .channel('entry-detail')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'requests'
      }, () => fetchRequests())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [id]);

  const fetchEntry = async () => {
    const { data } = await supabase
      .from('entries')
      .select('*, users(name, photo_url, phone)')
      .eq('id', id)
      .single();
    setEntry(data);
    setLoading(false);
  };

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('requests')
      .select('*, users(name, photo_url)')
      .eq('entry_id', id)
      .order('created_at', { ascending: false });
    setRequests(data || []);
  };

  const handleSubmitRequest = async () => {
    if (!itemName) {
      setError('Please enter the item name');
      return;
    }
    setSubmitting(true);
    setError('');

    const { error } = await supabase
      .from('requests')
      .insert({
        entry_id: id,
        pasabuyer_id: user.id,
        item_name: itemName,
        item_description: itemDescription,
        status: 'pending',
        payment_status: 'pending'
      });

    if (error) {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setShowForm(false);
    setItemName('');
    setItemDescription('');
    fetchRequests();
    setSubmitting(false);
  };

  const handleAcceptRequest = async (requestId) => {
    await supabase
      .from('requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);
    fetchRequests();
  };

  const handleRejectRequest = async (requestId) => {
    await supabase
      .from('requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);
    fetchRequests();
  };

  const handleEndRun = async () => {
    await supabase
      .from('entries')
      .update({ status: 'ended' })
      .eq('id', id);
    navigate('/');
  };

  const formatTime = (ts) => {
    const diff = Math.floor((new Date() - new Date(ts)) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ago`;
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case 'accepted': return { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0', label: '✓ Accepted' };
      case 'rejected': return { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA', label: '✕ Rejected' };
      default: return { bg: '#FFF8E8', color: '#D97706', border: '#FDE68A', label: '⏳ Pending' };
    }
  };

  if (loading) return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #6B0000 0%, #8B0000 45%, #1A3B20 100%)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', maxWidth: '480px', margin: '0 auto'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '40px', height: '40px',
          background: 'var(--yellow)',
          borderRadius: '12px',
          margin: '0 auto 12px',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center'
        }}>
          <img src={logoIcon} alt="PasaBuy"
            style={{ width: '28px', height: '28px', borderRadius: '8px' }}/>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>Loading...</p>
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #6B0000 0%, #8B0000 45%, #1A3B20 100%)',
      display: 'flex', flexDirection: 'column',
      maxWidth: '480px', margin: '0 auto',
      overflow: 'hidden', position: 'relative'
    }}>
      {/* Glow */}
      <div style={{
        position: 'absolute', top: '-60px', right: '-60px',
        width: '220px', height: '220px', borderRadius: '50%',
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
          justifyContent: 'space-between', marginBottom: '20px'
        }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: 'white', padding: '8px 16px',
              borderRadius: '100px', fontSize: '13px',
              fontWeight: '600', display: 'flex',
              alignItems: 'center', gap: '6px',
              border: '1px solid rgba(255,255,255,0.12)'
            }}
          >← Back</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
              color: 'var(--yellow)', fontSize: '17px', fontWeight: '800'
            }}>PasaBuy App</span>
          </div>
        </div>

        {/* Buyer info */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px'
        }}>
          <img
            src={entry?.users?.photo_url}
            alt="Buyer"
            style={{
              width: '48px', height: '48px',
              borderRadius: '50%',
              border: '2px solid var(--yellow)',
              boxShadow: '0 4px 12px rgba(255,229,102,0.2)'
            }}
          />
          <div style={{ flex: 1 }}>
            <p style={{
              color: 'white', fontSize: '15px', fontWeight: '700'
            }}>{entry?.users?.name}</p>
            <p style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: '12px', marginTop: '2px'
            }}>
              {isBuyer ? '👋 This is your entry' : '🏃 Going out now'}
            </p>
          </div>
          <span style={{
            background: 'rgba(34,197,94,0.15)',
            color: '#4ADE80',
            border: '1px solid rgba(74,222,128,0.3)',
            borderRadius: '100px',
            padding: '4px 12px',
            fontSize: '11px', fontWeight: '700'
          }}>● Active</span>
        </div>
      </div>

      {/* White card */}
      <div style={{
        flex: 1, background: 'white',
        borderRadius: '32px 32px 0 0',
        padding: '20px 20px 100px',
        boxShadow: '0 -8px 48px rgba(0,0,0,0.18)',
        animation: 'fadeUp 0.4s ease 0.12s both',
        overflowY: 'auto'
      }}>
        <div style={{
          width: '32px', height: '4px',
          background: '#EDE5E5', borderRadius: '4px',
          margin: '0 auto 20px'
        }}/>

        {/* Entry details card */}
        <div style={{
          background: '#FAFAFA',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '16px',
          border: '1px solid #F0E8E8'
        }}>
          {[
            { icon: <MapPin size={16} strokeWidth={2}/>, label: 'Going to', value: entry?.location },
            { icon: <ShoppingBag size={16} strokeWidth={2}/>, label: 'Can buy', value: entry?.what_can_buy },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', gap: '12px',
              paddingBottom: i === 0 ? '12px' : '0',
              marginBottom: i === 0 ? '12px' : '0',
              borderBottom: i === 0 ? '1px solid #F0E8E8' : 'none'
            }}>
              <span style={{
                color: 'var(--maroon)',
                marginTop: '1px',
                display: 'flex', alignItems: 'center',
                flexShrink: 0
              }}>{item.icon}</span>
              <div>
                <p style={{
                  fontSize: '10px', color: '#B0A0A0',
                  fontWeight: '700', textTransform: 'uppercase',
                  letterSpacing: '0.7px', marginBottom: '3px'
                }}>{item.label}</p>
                <p style={{
                  fontSize: '14px', fontWeight: '600',
                  color: 'var(--text)'
                }}>{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Success message */}
        {success && (
          <div style={{
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex', gap: '10px', alignItems: 'center'
          }}>
            <span style={{ fontSize: '18px' }}>🎉</span>
            <p style={{
              color: '#16A34A', fontSize: '13px', fontWeight: '700'
            }}>Request submitted! Wait for the buyer to accept.</p>
          </div>
        )}

        {/* Buyer: End Run button */}
        {isBuyer && entry?.status === 'active' && (
          <button
            onClick={handleEndRun}
            style={{
              width: '100%', padding: '13px',
              borderRadius: '13px',
              background: '#FEF2F2',
              color: '#DC2626',
              border: '1px solid #FECACA',
              fontSize: '13px', fontWeight: '700',
              marginBottom: '16px'
            }}
          > End My Run</button>
        )}

        {/* Pasabuyer: Request button */}
        {!isBuyer && !hasRequested && !showForm && entry?.status === 'active' && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              width: '100%', padding: '15px',
              borderRadius: '14px',
              background: 'var(--maroon)',
              color: 'white',
              fontSize: '14px', fontWeight: '800',
              boxShadow: 'var(--shadow-maroon)',
              marginBottom: '16px'
            }}
          >🛍️ Request a Pasabuy</button>
        )}

        {/* Already requested */}
        {!isBuyer && hasRequested && (
          <div style={{
            background: '#FFF8E8',
            border: '1px solid #FDE68A',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex', gap: '10px', alignItems: 'center'
          }}>
            <span style={{ fontSize: '16px' }}>⏳</span>
            <p style={{
              color: '#92400E', fontSize: '13px', fontWeight: '600'
            }}>You already submitted a request for this entry.</p>
          </div>
        )}

        {/* Request form */}
        {showForm && (
          <div style={{
            background: '#FFF8F8',
            border: '1px solid #FECACA',
            borderRadius: '18px',
            padding: '18px',
            marginBottom: '16px',
            animation: 'fadeUp 0.3s ease forwards'
          }}>
            <h3 style={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: '16px', fontWeight: '800',
              color: 'var(--maroon)', marginBottom: '16px'
            }}>🛍️ Your Request</h3>

            <label style={{
              display: 'block', fontSize: '11px',
              fontWeight: '700', color: 'var(--text-soft)',
              textTransform: 'uppercase', letterSpacing: '1px',
              marginBottom: '6px'
            }}>Item Name *</label>
            <input
              type="text"
              placeholder="e.g. Jollibee Chickenjoy 1pc"
              value={itemName}
              autoComplete="off"
              onChange={e => setItemName(e.target.value)}
              style={{
                width: '100%', padding: '12px 14px',
                borderRadius: '11px',
                border: '1.5px solid #EDE5E5',
                fontSize: '14px', fontWeight: '500',
                background: 'white', marginBottom: '12px',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--maroon)'}
              onBlur={e => e.target.style.borderColor = '#EDE5E5'}
            />

            <label style={{
              display: 'block', fontSize: '11px',
              fontWeight: '700', color: 'var(--text-soft)',
              textTransform: 'uppercase', letterSpacing: '1px',
              marginBottom: '6px'
            }}>Additional Details (optional)</label>
            <textarea
              placeholder="e.g. No spicy, extra rice, size M"
              value={itemDescription}
              onChange={e => setItemDescription(e.target.value)}
              rows={3}
              style={{
                width: '100%', padding: '12px 14px',
                borderRadius: '11px',
                border: '1.5px solid #EDE5E5',
                fontSize: '14px', fontWeight: '500',
                background: 'white', marginBottom: '14px',
                resize: 'none', fontFamily: 'inherit',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--maroon)'}
              onBlur={e => e.target.style.borderColor = '#EDE5E5'}
            />

            {error && (
              <p style={{
                color: '#DC2626', fontSize: '13px',
                fontWeight: '600', marginBottom: '12px'
              }}>❌ {error}</p>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => { setShowForm(false); setError(''); }}
                style={{
                  flex: 1, padding: '12px',
                  borderRadius: '11px',
                  background: 'white',
                  border: '1.5px solid #EDE5E5',
                  fontSize: '13px', fontWeight: '700',
                  color: '#888'
                }}
              >Cancel</button>
              <button
                onClick={handleSubmitRequest}
                disabled={submitting || !itemName}
                style={{
                  flex: 2, padding: '12px',
                  borderRadius: '11px',
                  background: (!itemName || submitting)
                    ? '#F0E8E8' : 'var(--maroon)',
                  color: (!itemName || submitting) ? '#C0A8A8' : 'white',
                  fontSize: '13px', fontWeight: '800',
                  boxShadow: (!itemName || submitting)
                    ? 'none' : 'var(--shadow-maroon)'
                }}
              >{submitting ? '⏳ Submitting...' : '✓ Submit Request'}</button>
            </div>
          </div>
        )}

        {/* Requests section */}
        <div>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px'
          }}>
            <h3 style={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: '16px', fontWeight: '800',
              color: 'var(--text)'
            }}>Pasabuy Requests</h3>
            <span style={{
              background: requests.length > 0 ? '#FEF3F2' : '#F5F5F5',
              color: requests.length > 0 ? 'var(--maroon)' : '#888',
              border: `1px solid ${requests.length > 0 ? '#FECACA' : '#E5E5E5'}`,
              borderRadius: '100px', padding: '3px 10px',
              fontSize: '11px', fontWeight: '700'
            }}>{requests.length}</span>
          </div>

          {requests.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '32px 24px',
              background: '#FAFAFA', borderRadius: '16px',
              border: '1px dashed #EDE5E5'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>📭</div>
              <p style={{
                color: '#B0A0A0', fontSize: '13px', fontWeight: '500'
              }}>No requests yet</p>
            </div>
          )}

          {requests.map((req, idx) => {
            const statusStyle = getStatusStyle(req.status);
            return (
              <div key={req.id} style={{
                background: 'white',
                borderRadius: '16px',
                padding: '14px',
                marginBottom: '10px',
                border: '1px solid #F0E8E8',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                animation: `fadeUp 0.3s ease ${idx * 0.05}s both`
              }}>
                {/* Pasabuyer info */}
                <div style={{
                  display: 'flex', alignItems: 'center',
                  gap: '10px', marginBottom: '12px'
                }}>
                  <img
                    src={req.users?.photo_url}
                    alt=""
                    style={{
                      width: '36px', height: '36px',
                      borderRadius: '50%',
                      border: '1.5px solid #EDE5E5'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontSize: '13px', fontWeight: '700',
                      color: 'var(--text)'
                    }}>{req.users?.name}</p>
                    <p style={{
                      fontSize: '11px', color: '#B0A0A0',
                      marginTop: '1px'
                    }}>{formatTime(req.created_at)}</p>
                  </div>
                  <span style={{
                    background: statusStyle.bg,
                    color: statusStyle.color,
                    border: `1px solid ${statusStyle.border}`,
                    borderRadius: '100px',
                    padding: '3px 10px',
                    fontSize: '11px', fontWeight: '700'
                  }}>{statusStyle.label}</span>
                </div>

                {/* Item info */}
                <div style={{
                  background: '#FAFAFA',
                  borderRadius: '11px',
                  padding: '11px 12px',
                  marginBottom: req.status === 'pending' && isBuyer ? '12px' : '0'
                }}>
                  <p style={{
                    fontSize: '13px', fontWeight: '700',
                    color: 'var(--text)', marginBottom: '3px'
                  }}>🛍️ {req.item_name}</p>
                  {req.item_description && (
                    <p style={{
                      fontSize: '12px', color: '#888',
                      lineHeight: '1.5'
                    }}>{req.item_description}</p>
                  )}
                </div>

                {/* Buyer actions */}
                {isBuyer && req.status === 'pending' && (
                  <div style={{
                    display: 'flex', gap: '8px', marginTop: '12px'
                  }}>
                    <button
                      onClick={() => handleRejectRequest(req.id)}
                      style={{
                        flex: 1, padding: '10px',
                        borderRadius: '10px',
                        background: 'white',
                        border: '1px solid #FECACA',
                        color: '#DC2626',
                        fontSize: '13px', fontWeight: '700'
                      }}
                    >✕ Reject</button>
                    <button
                      onClick={() => handleAcceptRequest(req.id)}
                      style={{
                        flex: 2, padding: '10px',
                        borderRadius: '10px',
                        background: 'var(--maroon)',
                        color: 'white',
                        fontSize: '13px', fontWeight: '800',
                        boxShadow: '0 4px 12px rgba(139,0,0,0.2)'
                      }}
                    >✓ Accept Request</button>
                  </div>
                )}

                {/* Open chat */}
                {req.status === 'accepted' && (
                  <button
                    onClick={() => navigate(`/chat/${req.id}`)}
                    style={{
                      width: '100%', padding: '10px',
                      borderRadius: '10px',
                      background: '#F0FDF4',
                      color: '#16A34A',
                      border: '1px solid #BBF7D0',
                      fontSize: '13px', fontWeight: '700',
                      marginTop: '10px'
                    }}
                  >💬 Open Chat</button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}