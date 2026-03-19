import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import logoIcon from '../logo-icon.png';

export default function AdminPanel({ user }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [entries, setEntries] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [supportUsers, setSupportUsers] = useState([]);
  const [activeSupport, setActiveSupport] = useState(null);
  const [supportMessages, setSupportMessages] = useState([]);
  const [adminReply, setAdminReply] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [loading, setLoading] = useState(true);
  const [disputeNote, setDisputeNote] = useState({});

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [usersRes, requestsRes, entriesRes, disputesRes, supportRes] = await Promise.all([
      supabase.from('users').select('*').order('created_at', { ascending: false }),
      supabase.from('requests').select('*, entries(location, buyer_id, users(name, photo_url, phone)), pasabuyer:users!requests_pasabuyer_id_fkey(name, phone, photo_url)').order('created_at', { ascending: false }),
      supabase.from('entries').select('*, users(name, photo_url)').order('created_at', { ascending: false }),
      supabase.from('disputes').select('*, raised_by_user:users!disputes_raised_by_fkey(name, photo_url), requests(item_name, total_amount, entries(location))').order('created_at', { ascending: false }),
      supabase.from('support_messages').select('*, users(name, photo_url)').order('created_at', { ascending: false })
    ]);

    const allUsers = usersRes.data || [];
    const allRequests = requestsRes.data || [];
    const allEntries = entriesRes.data || [];
    const allDisputes = disputesRes.data || [];
    const allSupport = supportRes.data || [];

    setUsers(allUsers);
    setRequests(allRequests);
    setEntries(allEntries);
    setDisputes(allDisputes);

    // Group support messages by user
    const userMap = {};
    allSupport.forEach(msg => {
      if (!userMap[msg.user_id]) {
        userMap[msg.user_id] = {
          user: msg.users,
          userId: msg.user_id,
          lastMessage: msg,
          unread: msg.sender === 'user'
        };
      }
    });
    setSupportUsers(Object.values(userMap));

    setStats({
      totalUsers: allUsers.length,
      activeEntries: allEntries.filter(e => e.status === 'active').length,
      pendingRequests: allRequests.filter(r => r.status === 'pending').length,
      completedToday: allRequests.filter(r => {
        const today = new Date().toDateString();
        return r.status === 'completed' &&
          new Date(r.updated_at || r.created_at).toDateString() === today;
      }).length,
      totalCompleted: allRequests.filter(r => r.status === 'completed').length,
      pendingProofReview: allRequests.filter(r =>
        r.proof_photo_url && !r.payment_released && r.status === 'delivered'
      ).length,
      openDisputes: allDisputes.filter(d => d.status === 'open').length,
      suspended: allUsers.filter(u => u.account_status === 'suspended').length,
    });

    setLoading(false);
  };
const handleMarkCompleted = async (requestId) => {
  await supabase.from('requests').update({
    status: 'completed'
  }).eq('id', requestId);

  await supabase.from('messages').insert({
    request_id: requestId,
    sender_id: user.id,
    text: `✅ Admin has marked this transaction as completed. Thank you for using PasaBuy!`
  });

  fetchAll();
};

const fetchSupportMessages = async (userId) => {
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    setSupportMessages(data || []);
  };

  const handleSendReply = async (userId) => {
    if (!adminReply.trim()) return;
    setSendingReply(true);

    await supabase.from('support_messages').insert({
      user_id: userId,
      sender: 'admin',
      message: adminReply.trim()
    });

    setAdminReply('');
    fetchSupportMessages(userId);
    setSendingReply(false);
  };
  const handleReleasePayment = async (requestId) => {
    await supabase.from('requests').update({
      payment_released: true,
      payment_released_at: new Date().toISOString(),
      status: 'completed'
    }).eq('id', requestId);

    await supabase.from('messages').insert({
      request_id: requestId,
      sender_id: user.id,
      text: `💸 PAYMENT RELEASED! The admin has verified your proof of delivery and transferred your earnings to your GCash account. Thank you for using PasaBuy!`
    });

    fetchAll();
  };

  const handleResolveDispute = async (disputeId, requestId, resolution) => {
    await supabase.from('disputes').update({
      status: 'resolved',
      admin_notes: disputeNote[disputeId] || resolution
    }).eq('id', disputeId);

    const msg = resolution === 'buyer'
      ? `✅ Dispute resolved in favor of the buyer. Payment will be released to the buyer.`
      : `🔄 Dispute resolved in favor of the pasabuyer. A refund will be processed manually.`;

    await supabase.from('messages').insert({
      request_id: requestId,
      sender_id: user.id,
      text: msg
    });

    if (resolution === 'buyer') {
      await supabase.from('requests').update({
        payment_released: true,
        status: 'completed'
      }).eq('id', requestId);
    }

    fetchAll();
  };

  const handleSuspendUser = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    await supabase.from('users').update({ account_status: newStatus }).eq('id', userId);
    fetchAll();
  };

  const handleAddStrike = async (userId, currentStrikes) => {
    const newStrikes = (currentStrikes || 0) + 1;
    const updates = { strikes: newStrikes };
    if (newStrikes >= 3) updates.account_status = 'suspended';
    await supabase.from('users').update(updates).eq('id', userId);
    fetchAll();
  };

  const handleRemoveStrike = async (userId, currentStrikes) => {
    await supabase.from('users').update({
      strikes: Math.max(0, (currentStrikes || 0) - 1)
    }).eq('id', userId);
    fetchAll();
  };

  const handleCloseEntry = async (entryId) => {
    await supabase.from('entries').update({ status: 'ended' }).eq('id', entryId);
    fetchAll();
  };

  const handleCancelRequest = async (requestId) => {
    await supabase.from('requests').update({ status: 'cancelled' }).eq('id', requestId);
    fetchAll();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const formatTime = (ts) => new Date(ts).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric'
  });

  const formatDateTime = (ts) => new Date(ts).toLocaleString('en-PH', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const getStatusStyle = (status, paymentStatus) => {
    if (status === 'completed') return { bg: '#F0FDF4', color: '#16A34A', label: '✓ Completed' };
    if (status === 'delivered') return { bg: '#EFF6FF', color: '#2563EB', label: '📦 Delivered' };
    if (status === 'disputed') return { bg: '#FEF2F2', color: '#DC2626', label: '🚨 Disputed' };
    if (status === 'cancelled') return { bg: '#F8F4F4', color: '#888', label: '✕ Cancelled' };
    if (status === 'rejected') return { bg: '#FEF2F2', color: '#DC2626', label: '✕ Rejected' };
    if (paymentStatus === 'paid') return { bg: '#F0FDF4', color: '#16A34A', label: '✅ Paid' };
    if (paymentStatus === 'awaiting_payment') return { bg: '#FFF8E8', color: '#D97706', label: '💳 Awaiting Payment' };
    if (status === 'accepted') return { bg: '#F5F3FF', color: '#7C3AED', label: '✓ Accepted' };
    return { bg: '#F8F4F4', color: '#888', label: '⏳ Pending' };
  };

  const tabs = [
    { key: 'dashboard', label: '📊 Dashboard' },
    { key: 'proofs', label: `📦 Proofs${stats.pendingProofReview > 0 ? ` (${stats.pendingProofReview})` : ''}` },
    { key: 'disputes', label: `🚨 Disputes${stats.openDisputes > 0 ? ` (${stats.openDisputes})` : ''}` },
    { key: 'support', label: '🎧 Support' },
    { key: 'users', label: '👥 Users' },
    { key: 'requests', label: '📋 Requests' },
    { key: 'entries', label: '🏃 Entries' },
  ];

  return (
    <div style={{
      minHeight: '100vh', background: '#F8F4F4',
      maxWidth: '900px', margin: '0 auto',
      fontFamily: 'Outfit, sans-serif'
    }}>
      {/* Top bar */}
      <div style={{
        background: 'var(--maroon)', padding: '16px 28px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={logoIcon} alt="PasaBuy"
            style={{ width: '36px', height: '36px', borderRadius: '10px' }}/>
          <div>
            <p style={{
              fontFamily: 'Raleway, sans-serif',
              color: 'var(--yellow)', fontSize: '18px', fontWeight: '800'
            }}>PasaBuy App</p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', marginTop: '-2px' }}>
              Admin Panel
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
            👋 {user.name?.split(' ')[0]}
          </p>
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(255,255,255,0.12)', color: 'white',
              padding: '7px 16px', borderRadius: '100px',
              fontSize: '12px', fontWeight: '600',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          >Log Out</button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        background: 'white', padding: '0 28px',
        display: 'flex', borderBottom: '2px solid #F0E8E8',
        overflowX: 'auto'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '14px 20px', background: 'none',
              color: activeTab === tab.key ? 'var(--maroon)' : '#888',
              fontSize: '13px', fontWeight: '700',
              borderBottom: activeTab === tab.key
                ? '2px solid var(--maroon)' : '2px solid transparent',
              marginBottom: '-2px', whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >{tab.label}</button>
        ))}
      </div>

      <div style={{ padding: '24px 28px 48px' }}>

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div>
            <h2 style={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: '22px', fontWeight: '800',
              color: 'var(--text)', marginBottom: '20px'
            }}>Overview</h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '14px', marginBottom: '28px'
            }}>
              {[
                { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: 'var(--maroon)', tab: null },
                { label: 'Active Entries', value: stats.activeEntries, icon: '🏃', color: '#7C3AED', tab: 'entries' },
                { label: 'Pending Requests', value: stats.pendingRequests, icon: '⏳', color: '#D97706', tab: 'requests' },
                { label: 'Completed Today', value: stats.completedToday, icon: '✅', color: '#16A34A', tab: null },
                { label: 'Proof Reviews', value: stats.pendingProofReview, icon: '📦', color: '#2563EB', tab: 'proofs' },
                { label: 'Open Disputes', value: stats.openDisputes, icon: '🚨', color: '#DC2626', tab: 'disputes' },
                { label: 'Suspended Users', value: stats.suspended, icon: '🚫', color: '#DC2626', tab: 'users' },
              ].map((stat, i) => (
                <div key={i}
                  onClick={() => stat.tab && setActiveTab(stat.tab)}
                  style={{
                    background: 'white', borderRadius: '16px',
                    padding: '18px', border: '1.5px solid #F0E8E8',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    cursor: stat.tab ? 'pointer' : 'default',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={e => { if (stat.tab) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ fontSize: '24px', marginBottom: '10px' }}>{stat.icon}</div>
                  <p style={{
                    fontFamily: 'Raleway, sans-serif',
                    fontSize: '28px', fontWeight: '800', color: stat.color
                  }}>{loading ? '—' : stat.value}</p>
                  <p style={{
                    fontSize: '12px', color: '#888',
                    fontWeight: '600', marginTop: '4px'
                  }}>{stat.label}</p>
                </div>
              ))}
            </div>

            <h3 style={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: '16px', fontWeight: '800',
              color: 'var(--text)', marginBottom: '14px'
            }}>Recent Activity</h3>
            {requests.slice(0, 5).map(req => {
              const s = getStatusStyle(req.status, req.payment_status);
              return (
                <div key={req.id} style={{
                  background: 'white', borderRadius: '14px',
                  padding: '14px 16px', marginBottom: '10px',
                  border: '1.5px solid #F0E8E8',
                  display: 'flex', alignItems: 'center', gap: '12px'
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)' }}>
                      {req.item_name}
                    </p>
                    <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                      {req.pasabuyer?.name} · {req.entries?.location} · {formatDateTime(req.created_at)}
                    </p>
                  </div>
                  {req.total_amount && (
                    <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--maroon)' }}>
                      ₱{req.total_amount}
                    </p>
                  )}
                  <span style={{
                    background: s.bg, color: s.color,
                    padding: '4px 10px', borderRadius: '100px',
                    fontSize: '11px', fontWeight: '700', flexShrink: 0
                  }}>{s.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* PROOFS OF DELIVERY */}
        {activeTab === 'proofs' && (
          <div>
            <h2 style={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: '22px', fontWeight: '800',
              color: 'var(--text)', marginBottom: '6px'
            }}>📦 Proof of Delivery Review</h2>
            <p style={{
              color: '#888', fontSize: '13px', marginBottom: '20px'
            }}>Review proof photos and release payment to buyer's GCash after verification.</p>

            {requests.filter(r => r.proof_photo_url).length === 0 && (
              <div style={{
                textAlign: 'center', padding: '48px',
                background: 'white', borderRadius: '20px',
                border: '1.5px dashed #EDE5E5'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                <p style={{ color: '#888', fontSize: '14px' }}>No proofs to review yet</p>
              </div>
            )}

            {requests.filter(r => r.proof_photo_url).map(req => (
              <div key={req.id} style={{
                background: 'white', borderRadius: '20px',
                padding: '20px', marginBottom: '16px',
                border: `1.5px solid ${req.payment_released ? '#BBF7D0' : '#BFDBFE'}`,
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
              }}>
                {/* Header */}
                <div style={{
                  display: 'flex', alignItems: 'center',
                  gap: '12px', marginBottom: '16px'
                }}>
                  <img src={req.entries?.users?.photo_url} alt=""
                    style={{
                      width: '44px', height: '44px',
                      borderRadius: '50%', border: '2px solid #EDE5E5'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)' }}>
                      {req.entries?.users?.name}
                      <span style={{ color: '#888', fontWeight: '500' }}> (Buyer)</span>
                    </p>
                    <p style={{ fontSize: '12px', color: '#888' }}>
                      Item: {req.item_name} · ₱{req.total_amount}
                    </p>
                    <p style={{ fontSize: '12px', color: '#888' }}>
                      Pasabuyer: {req.pasabuyer?.name} · 📱 {req.pasabuyer?.phone}
                    </p>
                  </div>
                  <span style={{
                    background: req.payment_released ? '#F0FDF4' : '#EFF6FF',
                    color: req.payment_released ? '#16A34A' : '#2563EB',
                    padding: '4px 12px', borderRadius: '100px',
                    fontSize: '11px', fontWeight: '700', flexShrink: 0
                  }}>
                    {req.payment_released ? '✓ Released' : '⏳ Pending'}
                  </span>
                </div>

                {/* Proof photo */}
                <div style={{
                  borderRadius: '14px', overflow: 'hidden',
                  marginBottom: '16px', border: '1.5px solid #EDE5E5'
                }}>
                  <img src={req.proof_photo_url} alt="Proof"
                    style={{ width: '100%', maxHeight: '300px', objectFit: 'cover' }}
                  />
                </div>

                {/* Earnings breakdown */}
                <div style={{
                  background: '#F8F4F4', borderRadius: '12px',
                  padding: '12px 14px', marginBottom: '16px'
                }}>
                  {[
                    { label: 'Item Price', value: `₱${req.actual_price || 0}` },
                    { label: 'Buyer Commission (15%)', value: `₱${req.commission || 0}` },
                    { label: 'Total Paid by Pasabuyer', value: `₱${req.total_amount || 0}` },
                    { label: 'Amount to Send to Buyer', value: `₱${(req.actual_price || 0) + (req.commission || 0)}`, bold: true }
                  ].map((row, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between',
                      paddingBottom: i < 3 ? '6px' : '0',
                      marginBottom: i < 3 ? '6px' : '0',
                      borderBottom: i < 3 ? '1px solid #EDE5E5' : 'none'
                    }}>
                      <span style={{ fontSize: '12px', color: '#888' }}>{row.label}</span>
                      <span style={{
                        fontSize: row.bold ? '15px' : '13px',
                        fontWeight: row.bold ? '800' : '600',
                        color: row.bold ? 'var(--maroon)' : 'var(--text)'
                      }}>{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* Buyer GCash */}
                <div style={{
                  background: '#FFF8E8', border: '1.5px solid #FDE68A',
                  borderRadius: '12px', padding: '14px 16px',
                  marginBottom: '16px',
                  display: 'flex', alignItems: 'center', gap: '12px'
                }}>
                  <span style={{ fontSize: '24px' }}>📱</span>
                  <div>
                    <p style={{
                      fontSize: '11px', color: '#92400E',
                      fontWeight: '700', textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Send GCash Payment to Buyer</p>
                    <p style={{
                      fontSize: '18px', fontWeight: '800', color: '#78350F',
                      letterSpacing: '1px', marginTop: '2px'
                    }}>{req.entries?.users?.phone || 'No phone on record'}</p>
                  </div>
                </div>

                {/* Release button */}
                {!req.payment_released ? (
  <button
    onClick={() => handleReleasePayment(req.id)}
    style={{
      width: '100%', padding: '14px',
      borderRadius: '14px',
      background: 'var(--green)', color: 'white',
      fontSize: '14px', fontWeight: '800',
      boxShadow: '0 4px 16px rgba(27,107,47,0.3)'
    }}
  >💸 Mark Payment as Released to Buyer</button>
) : (
  <div style={{
    background: '#F0FDF4', border: '1.5px solid #BBF7D0',
    borderRadius: '12px', padding: '12px', textAlign: 'center'
  }}>
    <p style={{ color: '#16A34A', fontSize: '14px', fontWeight: '700' }}>
      ✓ Payment released on {formatDateTime(req.payment_released_at)}
    </p>
  </div>
)}

{/* Mark as Completed */}
{req.status !== 'completed' && (
  <button
    onClick={() => handleMarkCompleted(req.id)}
    style={{
      width: '100%', padding: '12px',
      borderRadius: '14px',
      background: '#F0FDF4', color: '#16A34A',
      border: '1.5px solid #BBF7D0',
      fontSize: '13px', fontWeight: '700',
      marginTop: '8px'
    }}
  >✅ Mark Transaction as Completed</button>
)}
              </div>
            ))}
          </div>
        )}

        {/* DISPUTES */}
        {activeTab === 'disputes' && (
          <div>
            <h2 style={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: '22px', fontWeight: '800',
              color: 'var(--text)', marginBottom: '6px'
            }}>🚨 Disputes</h2>
            <p style={{
              color: '#888', fontSize: '13px', marginBottom: '20px'
            }}>Review and resolve disputes raised by users.</p>

            {disputes.length === 0 && (
              <div style={{
                textAlign: 'center', padding: '48px',
                background: 'white', borderRadius: '20px',
                border: '1.5px dashed #EDE5E5'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>✌️</div>
                <p style={{ color: '#888', fontSize: '14px' }}>
                  No disputes! Everything is running smoothly.
                </p>
              </div>
            )}

            {disputes.map(dispute => (
              <div key={dispute.id} style={{
                background: 'white', borderRadius: '20px',
                padding: '20px', marginBottom: '16px',
                border: `1.5px solid ${dispute.status === 'open' ? '#FECACA' : '#BBF7D0'}`,
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  gap: '12px', marginBottom: '14px'
                }}>
                  <img src={dispute.raised_by_user?.photo_url} alt=""
                    style={{
                      width: '44px', height: '44px',
                      borderRadius: '50%', border: '2px solid #EDE5E5'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)' }}>
                      {dispute.raised_by_user?.name}
                    </p>
                    <p style={{ fontSize: '12px', color: '#888' }}>
                      {dispute.requests?.item_name} · ₱{dispute.requests?.total_amount}
                    </p>
                    <p style={{ fontSize: '11px', color: '#B0A0A0' }}>
                      {formatDateTime(dispute.created_at)}
                    </p>
                  </div>
                  <span style={{
                    background: dispute.status === 'open' ? '#FEF2F2' : '#F0FDF4',
                    color: dispute.status === 'open' ? '#DC2626' : '#16A34A',
                    padding: '4px 12px', borderRadius: '100px',
                    fontSize: '11px', fontWeight: '700'
                  }}>
                    {dispute.status === 'open' ? '🚨 Open' : '✓ Resolved'}
                  </span>
                </div>

                {/* Reason */}
                <div style={{
                  background: '#FEF2F2', border: '1.5px solid #FECACA',
                  borderRadius: '12px', padding: '12px 14px', marginBottom: '14px'
                }}>
                  <p style={{
                    fontSize: '11px', color: '#DC2626', fontWeight: '700',
                    textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px'
                  }}>Reason</p>
                  <p style={{ fontSize: '13px', color: '#7A1A1A', lineHeight: '1.6' }}>
                    {dispute.reason}
                  </p>
                </div>

                {/* Admin notes if resolved */}
                {dispute.admin_notes && (
                  <div style={{
                    background: '#F0FDF4', border: '1.5px solid #BBF7D0',
                    borderRadius: '12px', padding: '12px 14px', marginBottom: '14px'
                  }}>
                    <p style={{
                      fontSize: '11px', color: '#16A34A',
                      fontWeight: '700', marginBottom: '4px'
                    }}>Admin Notes</p>
                    <p style={{ fontSize: '13px', color: '#166534' }}>{dispute.admin_notes}</p>
                  </div>
                )}

                {/* Resolve actions */}
                {dispute.status === 'open' && (
                  <div>
                    <textarea
                      placeholder="Add admin notes (optional)..."
                      value={disputeNote[dispute.id] || ''}
                      onChange={e => setDisputeNote(prev => ({
                        ...prev, [dispute.id]: e.target.value
                      }))}
                      rows={2}
                      style={{
                        width: '100%', padding: '10px 12px',
                        borderRadius: '10px', border: '1.5px solid #EDE5E5',
                        fontSize: '13px', marginBottom: '10px',
                        resize: 'none', fontFamily: 'inherit',
                        background: '#FAFAFA'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleResolveDispute(dispute.id, dispute.request_id, 'pasabuyer')}
                        style={{
                          flex: 1, padding: '11px', borderRadius: '10px',
                          background: '#EFF6FF', color: '#2563EB',
                          border: '1.5px solid #BFDBFE',
                          fontSize: '12px', fontWeight: '700'
                        }}
                      >🔄 Favor Pasabuyer</button>
                      <button
                        onClick={() => handleResolveDispute(dispute.id, dispute.request_id, 'buyer')}
                        style={{
                          flex: 1, padding: '11px', borderRadius: '10px',
                          background: '#F0FDF4', color: '#16A34A',
                          border: '1.5px solid #BBF7D0',
                          fontSize: '12px', fontWeight: '700'
                        }}
                      >💸 Favor Buyer</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* SUPPORT TAB */}
        {activeTab === 'support' && (
          <div style={{ display: 'flex', gap: '20px', height: '70vh' }}>
            {/* User list */}
            <div style={{ width: '200px', flexShrink: 0, overflowY: 'auto' }}>
              <h2 style={{
                fontFamily: 'Raleway, sans-serif',
                fontSize: '16px', fontWeight: '800',
                color: 'var(--text)', marginBottom: '14px'
              }}>Conversations</h2>

              {supportUsers.length === 0 && (
                <div style={{
                  textAlign: 'center', padding: '24px',
                  background: 'white', borderRadius: '16px',
                  border: '1px dashed #EDE5E5'
                }}>
                  <p style={{ fontSize: '24px', marginBottom: '8px' }}>🎧</p>
                  <p style={{ fontSize: '12px', color: '#888' }}>No conversations yet</p>
                </div>
              )}

              {supportUsers.map(su => (
                <div
                  key={su.userId}
                  onClick={() => {
                    setActiveSupport(su.userId);
                    fetchSupportMessages(su.userId);
                  }}
                  style={{
                    background: activeSupport === su.userId ? '#FFF0F0' : 'white',
                    border: `1px solid ${activeSupport === su.userId ? '#FECACA' : '#F0E8E8'}`,
                    borderRadius: '14px', padding: '12px',
                    marginBottom: '8px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '10px'
                  }}
                >
                  <img src={su.user?.photo_url} alt=""
                    style={{
                      width: '36px', height: '36px',
                      borderRadius: '50%', border: '1.5px solid #EDE5E5',
                      flexShrink: 0
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <p style={{
                      fontSize: '12px', fontWeight: '700',
                      color: 'var(--text)',
                      whiteSpace: 'nowrap', overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>{su.user?.name}</p>
                    <p style={{
                      fontSize: '11px', color: '#888',
                      whiteSpace: 'nowrap', overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>{su.lastMessage?.message || '📎 Photo'}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat area */}
            <div style={{
              flex: 1, background: 'white',
              borderRadius: '16px', border: '1px solid #F0E8E8',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden'
            }}>
              {!activeSupport ? (
                <div style={{
                  flex: 1, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: '#B0A0A0', fontSize: '14px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎧</div>
                    <p>Select a conversation to view</p>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{
                    flex: 1, overflowY: 'auto',
                    padding: '16px', display: 'flex',
                    flexDirection: 'column', gap: '8px'
                  }}>
                    {supportMessages.map(msg => {
                      const isAdmin = msg.sender === 'admin';
                      return (
                        <div key={msg.id} style={{
                          display: 'flex',
                          justifyContent: isAdmin ? 'flex-end' : 'flex-start'
                        }}>
                          {msg.photo_url ? (
                            <img src={msg.photo_url} alt="attachment"
                              style={{
                                maxWidth: '200px', borderRadius: '12px',
                                border: '1px solid #EDE5E5'
                              }}
                            />
                          ) : (
                            <div style={{
                              maxWidth: '70%',
                              background: isAdmin ? 'var(--maroon)' : '#F0EBEB',
                              color: isAdmin ? 'white' : 'var(--text)',
                              padding: '9px 13px',
                              borderRadius: isAdmin
                                ? '16px 16px 4px 16px'
                                : '16px 16px 16px 4px',
                              fontSize: '13px', lineHeight: '1.5'
                            }}>
                              <p>{msg.message}</p>
                              <p style={{
                                fontSize: '10px', opacity: 0.6,
                                marginTop: '3px', textAlign: 'right'
                              }}>{new Date(msg.created_at).toLocaleTimeString('en-PH', {
                                hour: '2-digit', minute: '2-digit'
                              })}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div style={{
                    padding: '12px 16px',
                    borderTop: '1px solid #F0E8E8',
                    display: 'flex', gap: '8px'
                  }}>
                    <input
                      type="text"
                      placeholder="Type a reply..."
                      value={adminReply}
                      onChange={e => setAdminReply(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSendReply(activeSupport);
                      }}
                      style={{
                        flex: 1, padding: '10px 14px',
                        borderRadius: '100px',
                        border: '1.5px solid #EDE5E5',
                        fontSize: '13px', background: '#FAFAFA'
                      }}
                    />
                    <button
                      onClick={() => handleSendReply(activeSupport)}
                      disabled={!adminReply.trim() || sendingReply}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '100px',
                        background: adminReply.trim() ? 'var(--maroon)' : '#F0E8E8',
                        color: adminReply.trim() ? 'white' : '#C0A8A8',
                        fontSize: '13px', fontWeight: '700'
                      }}
                    >Send</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div>
            <h2 style={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: '22px', fontWeight: '800',
              color: 'var(--text)', marginBottom: '20px'
            }}>All Users ({users.length})</h2>

            {users.map(u => (
              <div key={u.id} style={{
                background: 'white', borderRadius: '16px',
                padding: '16px', marginBottom: '12px',
                border: `1.5px solid ${u.account_status === 'suspended' ? '#FECACA' : '#F0E8E8'}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  gap: '12px', marginBottom: '12px'
                }}>
                  <img src={u.photo_url} alt=""
                    style={{
                      width: '44px', height: '44px', borderRadius: '50%',
                      border: '2px solid #EDE5E5',
                      opacity: u.account_status === 'suspended' ? 0.5 : 1
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)' }}>
                      {u.name}
                    </p>
                    <p style={{ fontSize: '12px', color: '#888' }}>{u.email}</p>
                    <p style={{ fontSize: '12px', color: '#888' }}>📱 {u.phone}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      background: u.account_status === 'suspended' ? '#FEF2F2' : '#F0FDF4',
                      color: u.account_status === 'suspended' ? '#DC2626' : '#16A34A',
                      padding: '3px 10px', borderRadius: '100px',
                      fontSize: '11px', fontWeight: '700'
                    }}>
                      {u.account_status === 'suspended' ? '🚫 Suspended' : '● Active'}
                    </span>
                    <p style={{ fontSize: '11px', color: '#B0A0A0', marginTop: '4px' }}>
                      Joined {formatTime(u.created_at)}
                    </p>
                  </div>
                </div>

                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  marginBottom: '12px', background: '#FAFAFA',
                  borderRadius: '10px', padding: '10px 12px'
                }}>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#888', flex: 1 }}>
                    Strikes: {[0,1,2].map(i => (
                      <span key={i} style={{
                        color: i < (u.strikes || 0) ? '#DC2626' : '#E0D8D8',
                        fontSize: '16px', marginLeft: '4px'
                      }}>⚠️</span>
                    ))}
                    <span style={{ fontSize: '12px', color: '#888', marginLeft: '6px' }}>
                      {u.strikes || 0}/3
                    </span>
                  </p>
                  <button
                    onClick={() => handleRemoveStrike(u.id, u.strikes)}
                    disabled={!u.strikes}
                    style={{
                      padding: '5px 10px', borderRadius: '8px',
                      background: 'white', border: '1.5px solid #EDE5E5',
                      fontSize: '12px', fontWeight: '700', color: '#888'
                    }}
                  >- Strike</button>
                  <button
                    onClick={() => handleAddStrike(u.id, u.strikes)}
                    style={{
                      padding: '5px 10px', borderRadius: '8px',
                      background: '#FEF2F2', border: '1.5px solid #FECACA',
                      fontSize: '12px', fontWeight: '700', color: '#DC2626'
                    }}
                  >+ Strike</button>
                </div>

                <button
                  onClick={() => handleSuspendUser(u.id, u.account_status)}
                  style={{
                    width: '100%', padding: '10px', borderRadius: '10px',
                    background: u.account_status === 'suspended' ? '#F0FDF4' : '#FEF2F2',
                    color: u.account_status === 'suspended' ? '#16A34A' : '#DC2626',
                    border: `1.5px solid ${u.account_status === 'suspended' ? '#BBF7D0' : '#FECACA'}`,
                    fontSize: '13px', fontWeight: '700'
                  }}
                >
                  {u.account_status === 'suspended' ? '✓ Reactivate Account' : '🚫 Suspend Account'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* REQUESTS TAB */}
        {activeTab === 'requests' && (
          <div>
            <h2 style={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: '22px', fontWeight: '800',
              color: 'var(--text)', marginBottom: '20px'
            }}>All Requests ({requests.length})</h2>

            {requests.map(req => {
              const s = getStatusStyle(req.status, req.payment_status);
              return (
                <div key={req.id} style={{
                  background: 'white', borderRadius: '16px',
                  padding: '16px', marginBottom: '12px',
                  border: '1.5px solid #F0E8E8',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', marginBottom: '12px'
                  }}>
                    <div>
                      <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text)' }}>
                        {req.item_name}
                      </p>
                      <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                        📍 {req.entries?.location}
                      </p>
                    </div>
                    <span style={{
                      background: s.bg, color: s.color,
                      padding: '4px 10px', borderRadius: '100px',
                      fontSize: '11px', fontWeight: '700',
                      flexShrink: 0, marginLeft: '8px'
                    }}>{s.label}</span>
                  </div>

                  <div style={{
                    background: '#FAFAFA', borderRadius: '10px',
                    padding: '10px 12px', marginBottom: '12px',
                    display: 'flex', gap: '20px', flexWrap: 'wrap'
                  }}>
                    {[
                      { label: 'Pasabuyer', value: req.pasabuyer?.name },
                      { label: 'Contact', value: req.pasabuyer?.phone },
                      { label: 'Amount', value: req.total_amount ? `₱${req.total_amount}` : '—' },
                      { label: 'Date', value: formatDateTime(req.created_at) }
                    ].map((item, i) => (
                      <div key={i}>
                        <p style={{
                          fontSize: '10px', color: '#B0A0A0', fontWeight: '700',
                          textTransform: 'uppercase', letterSpacing: '0.5px'
                        }}>{item.label}</p>
                        <p style={{
                          fontSize: '13px', fontWeight: '600',
                          color: 'var(--text)', marginTop: '2px'
                        }}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                    <button
                    onClick={() => window.open(`/chat/${req.id}`, '_blank')}
                    style={{
                      width: '100%', padding: '9px', borderRadius: '10px',
                      background: '#F5F3FF', color: '#7C3AED',
                      border: '1.5px solid #DDD6FE',
                      fontSize: '12px', fontWeight: '700',
                      marginBottom: '8px'
                    }}
                  >💬 View Chat</button>
                    

                  {req.status !== 'completed' && req.status !== 'cancelled' && (
                    <button
                      onClick={() => handleCancelRequest(req.id)}
                      style={{
                        width: '100%', padding: '9px', borderRadius: '10px',
                        background: '#FEF2F2', color: '#DC2626',
                        border: '1.5px solid #FECACA',
                        fontSize: '12px', fontWeight: '700'
                      }}
                    >✕ Cancel Request</button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ENTRIES TAB */}
        {activeTab === 'entries' && (
          <div>
            <h2 style={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: '22px', fontWeight: '800',
              color: 'var(--text)', marginBottom: '20px'
            }}>All Entries ({entries.length})</h2>

            {entries.map(entry => (
              <div key={entry.id} style={{
                background: 'white', borderRadius: '16px',
                padding: '16px', marginBottom: '12px',
                border: `1.5px solid ${entry.status === 'active' ? '#BBF7D0' : '#F0E8E8'}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  gap: '10px', marginBottom: '12px'
                }}>
                  <img src={entry.users?.photo_url} alt=""
                    style={{
                      width: '40px', height: '40px',
                      borderRadius: '50%', border: '2px solid #EDE5E5'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)' }}>
                      {entry.users?.name}
                    </p>
                    <p style={{ fontSize: '12px', color: '#888' }}>📍 {entry.location}</p>
                  </div>
                  <span style={{
                    background: entry.status === 'active' ? '#F0FDF4' : '#F8F4F4',
                    color: entry.status === 'active' ? '#16A34A' : '#888',
                    padding: '4px 10px', borderRadius: '100px',
                    fontSize: '11px', fontWeight: '700'
                  }}>
                    {entry.status === 'active' ? '● Active' : '■ Ended'}
                  </span>
                </div>

                <div style={{
                  background: '#FAFAFA', borderRadius: '10px',
                  padding: '10px 12px', marginBottom: '12px'
                }}>
                  <p style={{ fontSize: '12px', color: '#888' }}>🛍️ {entry.what_can_buy}</p>
                  <p style={{ fontSize: '11px', color: '#B0A0A0', marginTop: '4px' }}>
                    Posted {formatDateTime(entry.created_at)}
                  </p>
                </div>

                {entry.status === 'active' && (
                  <button
                    onClick={() => handleCloseEntry(entry.id)}
                    style={{
                      width: '100%', padding: '9px', borderRadius: '10px',
                      background: '#FEF2F2', color: '#DC2626',
                      border: '1.5px solid #FECACA',
                      fontSize: '12px', fontWeight: '700'
                    }}
                  >🏁 Close Entry</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}