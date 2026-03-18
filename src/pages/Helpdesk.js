import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import logoIcon from '../logo-icon.png';

export default function Helpdesk({ user }) {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [openTicket, setOpenTicket] = useState(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    const { data } = await supabase
      .from('helpdesk')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setTickets(data || []);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);

    await supabase.from('helpdesk').insert({
      user_id: user.id,
      subject: subject.trim(),
      message: message.trim(),
      status: 'open'
    });

    setSubmitting(false);
    setSuccess(true);
    setShowForm(false);
    setSubject('');
    setMessage('');
    fetchTickets();
  };

  const getStatusStyle = (status) => {
    if (status === 'resolved') return { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0', label: '✓ Resolved' };
    if (status === 'in_progress') return { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE', label: '⏳ In Progress' };
    return { bg: '#FFF8E8', color: '#D97706', border: '#FDE68A', label: '● Open' };
  };

  const formatTime = (ts) => new Date(ts).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

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
            onClick={() => navigate(-1)}
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
        }}>Helpdesk</h1>
        <p style={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: '13px', marginTop: '4px'
        }}>Submit and track your concerns</p>
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

        {/* Success message */}
        {success && (
          <div style={{
            background: '#F0FDF4', border: '1px solid #BBF7D0',
            borderRadius: '12px', padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex', gap: '10px', alignItems: 'center'
          }}>
            <span style={{ fontSize: '18px' }}>✅</span>
            <p style={{ color: '#16A34A', fontSize: '13px', fontWeight: '700' }}>
              Ticket submitted! We'll get back to you within operating hours.
            </p>
          </div>
        )}

        {/* New ticket button */}
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setSuccess(false); }}
            style={{
              width: '100%', padding: '14px',
              borderRadius: '14px',
              background: 'var(--maroon)', color: 'white',
              fontSize: '14px', fontWeight: '700',
              boxShadow: 'var(--shadow-maroon)',
              marginBottom: '20px'
            }}
          >+ Submit a Concern</button>
        )}

        {/* New ticket form */}
        {showForm && (
          <div style={{
            background: '#FFF8F8',
            border: '1px solid #FECACA',
            borderRadius: '18px', padding: '18px',
            marginBottom: '20px',
            animation: 'fadeUp 0.3s ease forwards'
          }}>
            <h3 style={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: '16px', fontWeight: '800',
              color: 'var(--maroon)', marginBottom: '16px'
            }}>New Concern</h3>

            <label style={{
              display: 'block', fontSize: '11px', fontWeight: '700',
              color: 'var(--text-soft)', textTransform: 'uppercase',
              letterSpacing: '1px', marginBottom: '6px'
            }}>Subject</label>
            <input
              type="text"
              placeholder="e.g. Issue with payment verification"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              autoComplete="off"
              style={{
                width: '100%', padding: '12px 14px',
                borderRadius: '11px', border: '1.5px solid #EDE5E5',
                fontSize: '14px', fontWeight: '500',
                background: 'white', marginBottom: '12px',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--maroon)'}
              onBlur={e => e.target.style.borderColor = '#EDE5E5'}
            />

            <label style={{
              display: 'block', fontSize: '11px', fontWeight: '700',
              color: 'var(--text-soft)', textTransform: 'uppercase',
              letterSpacing: '1px', marginBottom: '6px'
            }}>Message</label>
            <textarea
              placeholder="Describe your concern in detail..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              style={{
                width: '100%', padding: '12px 14px',
                borderRadius: '11px', border: '1.5px solid #EDE5E5',
                fontSize: '14px', fontWeight: '500',
                background: 'white', marginBottom: '14px',
                resize: 'none', fontFamily: 'inherit',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--maroon)'}
              onBlur={e => e.target.style.borderColor = '#EDE5E5'}
            />

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => { setShowForm(false); setSubject(''); setMessage(''); }}
                style={{
                  flex: 1, padding: '12px', borderRadius: '11px',
                  background: 'white', border: '1.5px solid #EDE5E5',
                  fontSize: '13px', fontWeight: '700', color: '#888'
                }}
              >Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !subject.trim() || !message.trim()}
                style={{
                  flex: 2, padding: '12px', borderRadius: '11px',
                  background: (!subject.trim() || !message.trim() || submitting)
                    ? '#F0E8E8' : 'var(--maroon)',
                  color: (!subject.trim() || !message.trim() || submitting)
                    ? '#C0A8A8' : 'white',
                  fontSize: '13px', fontWeight: '800',
                  boxShadow: (!subject.trim() || !message.trim() || submitting)
                    ? 'none' : 'var(--shadow-maroon)'
                }}
              >{submitting ? '⏳ Submitting...' : '✓ Submit'}</button>
            </div>
          </div>
        )}

        {/* Tickets list */}
        <h3 style={{
          fontFamily: 'Raleway, sans-serif',
          fontSize: '16px', fontWeight: '800',
          color: 'var(--text)', marginBottom: '14px'
        }}>Your Tickets</h3>

        {loading && [1, 2].map(i => (
          <div key={i} style={{
            background: '#F8F4F4', borderRadius: '16px',
            height: '80px', marginBottom: '10px',
            overflow: 'hidden', position: 'relative'
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)',
              animation: 'shimmer 1.5s infinite'
            }}/>
          </div>
        ))}

        {!loading && tickets.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '40px 24px',
            background: '#FFF8F8', borderRadius: '20px',
            border: '1px dashed #FECACA'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎧</div>
            <p style={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: '16px', fontWeight: '800',
              color: 'var(--text)', marginBottom: '6px'
            }}>No tickets yet</p>
            <p style={{ color: 'var(--text-soft)', fontSize: '13px' }}>
              Submit a concern and we'll get back to you!
            </p>
          </div>
        )}

        {tickets.map((ticket, idx) => {
          const statusStyle = getStatusStyle(ticket.status);
          const isOpen = openTicket === ticket.id;
          return (
            <div key={ticket.id} style={{
              background: 'white', borderRadius: '16px',
              marginBottom: '10px',
              border: `1px solid ${isOpen ? '#FECACA' : '#F0E8E8'}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              overflow: 'hidden',
              animation: `fadeUp 0.4s ease ${idx * 0.05}s both`
            }}>
              <button
                onClick={() => setOpenTicket(isOpen ? null : ticket.id)}
                style={{
                  width: '100%', padding: '14px 16px',
                  background: isOpen ? '#FFF8F8' : 'white',
                  display: 'flex', alignItems: 'center',
                  gap: '12px', textAlign: 'left'
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontSize: '13px', fontWeight: '700',
                    color: isOpen ? 'var(--maroon)' : 'var(--text)',
                    marginBottom: '3px'
                  }}>{ticket.subject}</p>
                  <p style={{
                    fontSize: '11px', color: '#B0A0A0'
                  }}>{formatTime(ticket.created_at)}</p>
                </div>
                <span style={{
                  background: statusStyle.bg,
                  color: statusStyle.color,
                  border: `1px solid ${statusStyle.border}`,
                  borderRadius: '100px',
                  padding: '3px 9px',
                  fontSize: '11px', fontWeight: '700',
                  flexShrink: 0
                }}>{statusStyle.label}</span>
              </button>

              {isOpen && (
                <div style={{
                  padding: '0 16px 16px',
                  borderTop: '1px solid #F0E8E8'
                }}>
                  {/* User message */}
                  <div style={{
                    background: '#FAFAFA', borderRadius: '12px',
                    padding: '12px 14px', marginTop: '12px',
                    marginBottom: ticket.admin_reply ? '12px' : '0'
                  }}>
                    <p style={{
                      fontSize: '11px', fontWeight: '700',
                      color: '#B0A0A0', textTransform: 'uppercase',
                      letterSpacing: '0.5px', marginBottom: '6px'
                    }}>Your Message</p>
                    <p style={{
                      fontSize: '13px', color: 'var(--text)',
                      lineHeight: '1.6', fontWeight: '500'
                    }}>{ticket.message}</p>
                  </div>

                  {/* Admin reply */}
                  {ticket.admin_reply && (
                    <div style={{
                      background: '#F0FDF4', border: '1px solid #BBF7D0',
                      borderRadius: '12px', padding: '12px 14px'
                    }}>
                      <p style={{
                        fontSize: '11px', fontWeight: '700',
                        color: '#16A34A', textTransform: 'uppercase',
                        letterSpacing: '0.5px', marginBottom: '6px'
                      }}>Admin Reply</p>
                      <p style={{
                        fontSize: '13px', color: '#166534',
                        lineHeight: '1.6', fontWeight: '500'
                      }}>{ticket.admin_reply}</p>
                      <p style={{
                        fontSize: '10px', color: '#B0A0A0',
                        marginTop: '6px'
                      }}>{formatTime(ticket.replied_at)}</p>
                    </div>
                  )}

                  {!ticket.admin_reply && (
                    <div style={{
                      background: '#FFF8E8', border: '1px solid #FDE68A',
                      borderRadius: '12px', padding: '10px 14px',
                      marginTop: '12px'
                    }}>
                      <p style={{
                        fontSize: '12px', color: '#92400E',
                        fontWeight: '500'
                      }}>⏳ Waiting for admin response. We respond within 8AM - 10PM.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}