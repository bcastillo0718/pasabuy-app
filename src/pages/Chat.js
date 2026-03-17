import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, useParams } from 'react-router-dom';
import logoIcon from '../logo-icon.png';

export default function Chat({ user }) {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [request, setRequest] = useState(null);
  const [entry, setEntry] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [actualPrice, setActualPrice] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [ocrError, setOcrError] = useState('');
  const [showDisputeModal, setShowDisputeModal] = useState(false);
const [disputeReason, setDisputeReason] = useState('');
  const bottomRef = useRef(null);
  const receiptInputRef = useRef(null);
  const proofInputRef = useRef(null);

  const isBuyer = entry?.buyer_id === user.id;
  const commission = actualPrice ? Math.round(parseFloat(actualPrice) * 0.15) : 0;
  const total = actualPrice ? parseFloat(actualPrice) + commission : 0;

  useEffect(() => {
    fetchRequest();
    fetchMessages();

    const channel = supabase
      .channel(`chat-${requestId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `request_id=eq.${requestId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'requests',
        filter: `id=eq.${requestId}`
      }, () => fetchRequest())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [requestId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchRequest = async () => {
    const { data } = await supabase
      .from('requests')
      .select(`
        *,
        pasabuyer:users!requests_pasabuyer_id_fkey(name, photo_url)
      `)
      .eq('id', requestId)
      .single();
    setRequest(data);
    console.log('REQUEST:', data);
    console.log('status:', data?.status);
    console.log('proof_photo_url:', data?.proof_photo_url);

    if (data?.entry_id) {
      const { data: entryData } = await supabase
        .from('entries')
        .select('*, users(name, photo_url)')
        .eq('id', data.entry_id)
        .single();
      setEntry(entryData);
      console.log('ENTRY buyer_id:', entryData?.buyer_id);
      console.log('USER id:', user.id);
      console.log('isBuyer:', entryData?.buyer_id === user.id);
    }
    setLoading(false);
  };
  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*, users(name, photo_url)')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    const text = newMessage.trim();
    setNewMessage('');
    await supabase.from('messages').insert({
      request_id: requestId,
      sender_id: user.id,
      text
    });
    setSending(false);
  };

  const handleSetPrice = async () => {
    if (!actualPrice || parseFloat(actualPrice) < 50) return;

    await supabase.from('requests').update({
      actual_price: parseFloat(actualPrice),
      commission,
      total_amount: total,
      payment_status: 'awaiting_payment'
    }).eq('id', requestId);

    await supabase.from('messages').insert({
      request_id: requestId,
      sender_id: user.id,
      text: `💳 PAYMENT REQUEST\nItem: ₱${parseFloat(actualPrice).toFixed(2)}\nCommission (15%): ₱${commission.toFixed(2)}\nTotal: ₱${total.toFixed(2)}\n\nPlease send ₱${total.toFixed(2)} to GCash 09065935527 then upload your receipt below.`
    });

    setShowPriceModal(false);
    setActualPrice('');
    fetchRequest();
  };

  // Upload image to ImgBB
  const uploadToImgBB = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(
      `https://api.imgbb.com/1/upload?key=${process.env.REACT_APP_IMGBB_API_KEY}`,
      { method: 'POST', body: formData }
    );
    const data = await res.json();
    if (data.success) return data.data.url;
    throw new Error('Image upload failed');
  };

  // OCR via Google Vision API
  // OCR via Tesseract.js (runs locally, free)
const runOCR = async (file) => {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng');
  const { data: { text } } = await worker.recognize(file);
  await worker.terminate();
  return text;
};

  // Verify receipt using OCR
  const handleReceiptUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingReceipt(true);
    setOcrError('');

    try {
const imageUrl = await uploadToImgBB(file);
const ocrText = await runOCR(file);
console.log('OCR TEXT:', ocrText);
      
      

// Check GCash number — handle both 09... and +63... formats
const gcashNumber = '09065935527';
const ocrNormalized = ocrText.replace(/\s/g, '').toLowerCase();
const hasGcashNumber =
  ocrNormalized.includes(gcashNumber) ||
  ocrNormalized.includes('+639065935527') ||
  ocrText.includes('+63 906 593 5527');

// Check amount
const expectedAmount = request?.total_amount?.toFixed(2);
const expectedWhole = Math.round(request?.total_amount).toString();
const hasAmount =
  ocrNormalized.includes(expectedAmount?.replace('.', '')) ||
  ocrNormalized.includes(expectedAmount) ||
  ocrNormalized.includes(expectedWhole);

      if (!hasGcashNumber) {
        setOcrError('❌ GCash number not found in receipt. Make sure you sent to 09065935527.');
        setUploadingReceipt(false);
        return;
      }

      if (!hasAmount) {
        setOcrError(`❌ Payment amount not verified. Expected ₱${expectedAmount}. Please check your receipt.`);
        setUploadingReceipt(false);
        return;
      }

      // Verified! Update request
      await supabase.from('requests').update({
        payment_status: 'paid',
        gcash_reference: imageUrl
      }).eq('id', requestId);

      await supabase.from('messages').insert({
        request_id: requestId,
        sender_id: user.id,
        text: `✅ Payment verified! The buyer will now purchase your pasabuy.`
      });

      fetchRequest();

    } catch (err) {
      setOcrError('❌ Something went wrong. Please try again.');
    }

    setUploadingReceipt(false);
  };

  // Proof of delivery upload
  const handleProofUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingProof(true);

    try {
      const imageUrl = await uploadToImgBB(file);

      await supabase.from('requests').update({
        status: 'delivered',
        proof_photo_url: imageUrl
      }).eq('id', requestId);

      await supabase.from('messages').insert({
        request_id: requestId,
        sender_id: user.id,
        text: `📦 PROOF OF DELIVERY\n[photo]${imageUrl}`
      });

      fetchRequest();
    } catch (err) {
      alert('Photo upload failed. Please try again.');
    }

    setUploadingProof(false);
  };

  const handleRaiseDispute = async () => {
  if (!disputeReason.trim()) return;

  const isWithinHours = (() => {
    const now = new Date();
    const hour = now.getHours();
    return hour >= 8 && hour < 22;
  })();

  if (!isWithinHours) {
    alert('Dispute support is available between 8AM - 10PM only. Please try again during these hours.');
    return;
  }

  await supabase.from('disputes').insert({
    request_id: requestId,
    raised_by: user.id,
    reason: disputeReason.trim(),
    status: 'open'
  });

  await supabase.from('requests').update({
    status: 'disputed'
  }).eq('id', requestId);

  await supabase.from('messages').insert({
    request_id: requestId,
    sender_id: user.id,
    text: `🚨 A dispute has been raised. The admin has been notified and will review this transaction.`
  });

  setShowDisputeModal(false);
  setDisputeReason('');
  fetchRequest();
};

  const handleConfirmReceived = async () => {
    await supabase.from('requests').update({
      status: 'completed'
    }).eq('id', requestId);

    await supabase.from('messages').insert({
      request_id: requestId,
      sender_id: user.id,
      text: `🎉 Order completed! Pasabuyer confirmed receipt. Thank you for using PasaBuy!`
    });

    fetchRequest();
  };

  const formatTime = (ts) => new Date(ts).toLocaleTimeString('en-PH', {
    hour: '2-digit', minute: '2-digit'
  });

  const getStatusBanner = () => {
    if (!request) return null;
    const s = request.status;
    const ps = request.payment_status;
    if (s === 'completed') return { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0', text: '🎉 Transaction completed!' };
    if (s === 'delivered') return { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE', text: '📦 Item delivered — waiting for pasabuyer to confirm' };
    if (ps === 'paid') return { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0', text: '✅ Payment verified! Buyer is getting your item.' };
    if (ps === 'awaiting_payment') return { bg: '#FFF8E8', color: '#D97706', border: '#FDE68A', text: `💳 Please pay ₱${request.total_amount} to GCash 09065935527` };
    return { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE', text: '💬 Coordinate your pasabuy here!' };
  };

  if (loading) return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #6B0000 0%, #8B0000 45%, #1A3B20 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      maxWidth: '480px', margin: '0 auto'
    }}>
      <p style={{ color: 'white' }}>Loading chat...</p>
    </div>
  );

  const banner = getStatusBanner();

  return (
    <div style={{
      height: '100vh',
      background: 'linear-gradient(160deg, #6B0000 0%, #8B0000 45%, #1A3B20 100%)',
      display: 'flex', flexDirection: 'column',
      maxWidth: '480px', margin: '0 auto', position: 'relative'
    }}>
      {/* Header */}
      <div style={{ padding: '48px 20px 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'rgba(255,255,255,0.12)', color: 'white',
              padding: '8px 14px', borderRadius: '100px',
              fontSize: '13px', fontWeight: '600', flexShrink: 0
            }}
          >←</button>

          <img
            src={isBuyer ? request?.pasabuyer?.photo_url : entry?.users?.photo_url}
            alt=""
            style={{
              width: '40px', height: '40px', borderRadius: '50%',
              border: '2px solid var(--yellow)'
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              color: 'white', fontSize: '14px', fontWeight: '700',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
            }}>
              {isBuyer ? request?.pasabuyer?.name : entry?.users?.name}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px', marginTop: '1px' }}>
              🛍️ {request?.item_name}
            </p>
          </div>
          <img src={logoIcon} alt="PasaBuy"
            style={{ width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0 }}/>
        </div>
      </div>

      {/* Chat body */}
      <div style={{
        flex: 1, background: 'white',
        borderRadius: '28px 28px 0 0',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 -4px 48px rgba(0,0,0,0.2)'
      }}>
        {/* Status banner */}
        {banner && (
          <div style={{
            background: banner.bg, border: `1px solid ${banner.border}`,
            padding: '10px 16px', flexShrink: 0
          }}>
            <p style={{ color: banner.color, fontSize: '12px', fontWeight: '700' }}>
              {banner.text}
            </p>
          </div>
        )}

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '16px 16px 8px',
          display: 'flex', flexDirection: 'column', gap: '8px'
        }}>
          {messages.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '40px 20px',
              color: '#B0A0A0', fontSize: '13px'
            }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>💬</div>
              Start the conversation! Coordinate pickup details here.
            </div>
          )}

          {messages.map((msg) => {
            const isMe = msg.sender_id === user.id;

            if (msg.text?.startsWith('💸 PAYMENT RELEASED') && !isBuyer) {
  return null;
}

            // Proof of delivery photo message
            if (msg.text?.startsWith('📦 PROOF OF DELIVERY')) {
              const photoUrl = msg.text.split('[photo]')[1];
              return (
                <div key={msg.id} style={{
                  background: '#F0F9FF',
                  border: '1.5px solid #BAE6FD',
                  borderRadius: '16px', padding: '14px',
                  textAlign: 'center'
                }}>
                  <p style={{
                    fontSize: '12px', fontWeight: '700',
                    color: '#0369A1', marginBottom: '10px'
                  }}>📦 Proof of Delivery</p>
                  <img
                    src={photoUrl} alt="Proof of delivery"
                    style={{
                      width: '100%', maxHeight: '200px',
                      objectFit: 'cover', borderRadius: '10px'
                    }}
                  />
                  <p style={{
                    fontSize: '11px', color: '#888',
                    marginTop: '6px'
                  }}>{formatTime(msg.created_at)}</p>
                </div>
              );
            }

            // System messages
            if (msg.text?.startsWith('💳') || msg.text?.startsWith('✅') ||
                msg.text?.startsWith('🎉') || msg.text?.startsWith('📦 Item')) {
              return (
                <div key={msg.id} style={{
                  background: '#F8F4F4', borderRadius: '12px',
                  padding: '10px 14px', fontSize: '12px',
                  color: '#7A6B6E', lineHeight: '1.6',
                  fontWeight: '500', whiteSpace: 'pre-line'
                }}>{msg.text}</div>
              );
            }

            // Regular messages
            return (
              <div key={msg.id} style={{
                display: 'flex',
                justifyContent: isMe ? 'flex-end' : 'flex-start',
                alignItems: 'flex-end', gap: '6px'
              }}>
                {!isMe && (
                  <img src={msg.users?.photo_url} alt=""
                    style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      flexShrink: 0, border: '1.5px solid #EDE5E5'
                    }}
                  />
                )}
                <div style={{
                  maxWidth: '72%',
                  background: isMe ? 'var(--maroon)' : '#F5F0F0',
                  color: isMe ? 'white' : 'var(--text)',
                  padding: '10px 14px',
                  borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  fontSize: '14px', lineHeight: '1.5', fontWeight: '500'
                }}>
                  <p>{msg.text}</p>
                  <p style={{
                    fontSize: '10px', opacity: 0.6,
                    marginTop: '4px', textAlign: 'right'
                  }}>{formatTime(msg.created_at)}</p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef}/>
        </div>

        {/* Action buttons area */}
        <div style={{ padding: '0 16px 8px', flexShrink: 0 }}>

          {/* OCR Error */}
          {ocrError && (
            <div style={{
              background: '#FEF2F2', border: '1.5px solid #FECACA',
              borderRadius: '12px', padding: '10px 14px',
              marginBottom: '8px', fontSize: '12px',
              color: '#DC2626', fontWeight: '600'
            }}>{ocrError}</div>
          )}

          {/* Buyer: Set Price */}
          {isBuyer && request?.status === 'accepted' &&
            request?.payment_status === 'pending' && (
            <button
              onClick={() => setShowPriceModal(true)}
              style={{
                width: '100%', padding: '12px', borderRadius: '12px',
                background: 'var(--maroon)', color: 'white',
                fontSize: '13px', fontWeight: '700', marginBottom: '8px',
                boxShadow: 'var(--shadow-maroon)'
              }}
            >💰 Set Item Price & Request Payment</button>
          )}

          {/* Pasabuyer: Upload Receipt */}
          {!isBuyer && request?.payment_status === 'awaiting_payment' && (
            <>
              <input
                type="file" accept="image/*"
                ref={receiptInputRef}
                onChange={handleReceiptUpload}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => { setOcrError(''); receiptInputRef.current?.click(); }}
                disabled={uploadingReceipt}
                style={{
                  width: '100%', padding: '12px', borderRadius: '12px',
                  background: uploadingReceipt ? '#F0E8E8' : 'var(--green)',
                  color: uploadingReceipt ? '#C0A8A8' : 'white',
                  fontSize: '13px', fontWeight: '700', marginBottom: '8px'
                }}
              >
                {uploadingReceipt ? '⏳ Verifying receipt...' : '📸 Upload GCash Receipt'}
              </button>
            </>
          )}

          {/* Buyer: Upload Proof of Delivery */}
          {isBuyer && request?.payment_status === 'paid' &&
  !request?.proof_photo_url &&
  request?.status !== 'delivered' && request?.status !== 'completed' && (
            <>
              <input
                type="file" accept="image/*"
                ref={proofInputRef}
                onChange={handleProofUpload}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => proofInputRef.current?.click()}
                disabled={uploadingProof}
                style={{
                  width: '100%', padding: '12px', borderRadius: '12px',
                  background: uploadingProof ? '#F0E8E8' : 'var(--green)',
                  color: uploadingProof ? '#C0A8A8' : 'white',
                  fontSize: '13px', fontWeight: '700', marginBottom: '8px'
                }}
              >
                {uploadingProof ? '⏳ Uploading...' : '📷 Upload Proof of Delivery'}
              </button>
            </>
          )}
{/* Raise Dispute button */}
{!isBuyer &&
  request?.payment_status === 'paid' &&
  request?.status !== 'completed' &&
  request?.status !== 'disputed' && (
  <button
    onClick={() => setShowDisputeModal(true)}
    style={{
      width: '100%', padding: '12px', borderRadius: '12px',
      background: '#FEF2F2', color: '#DC2626',
      border: '1.5px solid #FECACA',
      fontSize: '13px', fontWeight: '700', marginBottom: '8px'
    }}
  >🚨 Raise a Dispute</button>
)}
          {/* Pasabuyer: I Received It */}
          {!isBuyer && request?.proof_photo_url && request?.status !== 'completed' && request?.status !== 'disputed' && (
            <button
              onClick={handleConfirmReceived}
              style={{
                width: '100%', padding: '12px', borderRadius: '12px',
                background: 'var(--green)', color: 'white',
                fontSize: '13px', fontWeight: '700', marginBottom: '8px'
              }}
            >🎉 I Received It!</button>
          )}
        </div>
        

        {/* Message input */}
        {request?.status !== 'completed' && request?.status !== 'disputed' && (
          <div style={{
            padding: '8px 16px 24px',
            borderTop: '1px solid #F0E8E8',
            display: 'flex', gap: '10px',
            alignItems: 'flex-end', flexShrink: 0
          }}>
            <div style={{
              flex: 1, background: '#F8F4F4',
              borderRadius: '20px', padding: '10px 16px',
              border: '2px solid transparent', transition: 'border-color 0.2s'
            }}
              onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--maroon)'}
              onBlurCapture={e => e.currentTarget.style.borderColor = 'transparent'}
            >
              <textarea
                placeholder="Type a message..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                rows={1}
                style={{
                  width: '100%', background: 'transparent',
                  fontSize: '14px', color: 'var(--text)',
                  resize: 'none', fontFamily: 'inherit',
                  lineHeight: '1.5', maxHeight: '80px', overflowY: 'auto'
                }}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              style={{
                width: '44px', height: '44px', borderRadius: '50%',
                background: newMessage.trim() ? 'var(--maroon)' : '#F0E8E8',
                color: newMessage.trim() ? 'white' : '#C0A8A8',
                fontSize: '18px', flexShrink: 0,
                boxShadow: newMessage.trim() ? 'var(--shadow-maroon)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >➤</button>
          </div>
        )}
      </div>

      {/* Set Price Modal */}
      {showPriceModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'flex-end',
          justifyContent: 'center', zIndex: 200,
          maxWidth: '480px', margin: '0 auto'
        }}>
          <div style={{
            background: 'white', borderRadius: '28px 28px 0 0',
            padding: '28px 24px 40px', width: '100%',
            animation: 'fadeUp 0.3s ease forwards'
          }}>
            <div style={{
              width: '36px', height: '4px', background: '#EDE5E5',
              borderRadius: '4px', margin: '0 auto 24px'
            }}/>
            <h3 style={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: '20px', fontWeight: '800',
              color: 'var(--maroon)', marginBottom: '6px'
            }}>💰 Set Item Price</h3>
            <p style={{
              color: '#B0A0A0', fontSize: '13px', marginBottom: '24px'
            }}>Enter the actual price of the item</p>

            <label style={{
              display: 'block', fontSize: '12px', fontWeight: '700',
              color: '#5A4A4A', textTransform: 'uppercase',
              letterSpacing: '0.6px', marginBottom: '8px'
            }}>Actual Item Price (₱)</label>

            <input
              type="number" placeholder="e.g. 120"
              value={actualPrice}
              onChange={e => setActualPrice(e.target.value)}
              min="50"
              style={{
                width: '100%', padding: '14px 16px',
                borderRadius: '14px', border: '2px solid #EDE5E5',
                fontSize: '20px', fontWeight: '700',
                marginBottom: '16px', background: '#FAFAFA'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--maroon)'}
              onBlur={e => e.target.style.borderColor = '#EDE5E5'}
            />

            {actualPrice && parseFloat(actualPrice) >= 50 && (
              <div style={{
                background: '#F8F4F4', borderRadius: '14px',
                padding: '14px 16px', marginBottom: '20px'
              }}>
                {[
                  { label: 'Item Price', value: `₱${parseFloat(actualPrice).toFixed(2)}` },
                  { label: 'Commission (15%)', value: `₱${commission.toFixed(2)}` },
                  { label: 'Total to Pay', value: `₱${total.toFixed(2)}`, bold: true }
                ].map((row, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: i < 2 ? '8px' : '0',
                    marginBottom: i < 2 ? '8px' : '0',
                    borderBottom: i < 2 ? '1px solid #EDE5E5' : 'none'
                  }}>
                    <span style={{ fontSize: '13px', color: '#7A6B6E' }}>{row.label}</span>
                    <span style={{
                      fontSize: row.bold ? '16px' : '14px',
                      fontWeight: row.bold ? '800' : '600',
                      color: row.bold ? 'var(--maroon)' : 'var(--text)'
                    }}>{row.value}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => { setShowPriceModal(false); setActualPrice(''); }}
                style={{
                  flex: 1, padding: '14px', borderRadius: '14px',
                  background: 'white', border: '2px solid #EDE5E5',
                  fontSize: '14px', fontWeight: '700', color: '#888'
                }}
              >Cancel</button>
              <button
                onClick={handleSetPrice}
                disabled={!actualPrice || parseFloat(actualPrice) < 50}
                style={{
                  flex: 2, padding: '14px', borderRadius: '14px',
                  background: (!actualPrice || parseFloat(actualPrice) < 50)
                    ? '#F0E8E8' : 'var(--maroon)',
                  color: (!actualPrice || parseFloat(actualPrice) < 50)
                    ? '#C0A8A8' : 'white',
                  fontSize: '14px', fontWeight: '800',
                  boxShadow: (!actualPrice || parseFloat(actualPrice) < 50)
                    ? 'none' : 'var(--shadow-maroon)'
                }}
              >Send Payment Request</button>
            </div>
          </div>
        </div>
      )}
      {/* Dispute Modal */}
{showDisputeModal && (
  <div style={{
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'flex-end',
    justifyContent: 'center', zIndex: 200,
    maxWidth: '480px', margin: '0 auto'
  }}>
    <div style={{
      background: 'white', borderRadius: '28px 28px 0 0',
      padding: '28px 24px 40px', width: '100%',
      animation: 'fadeUp 0.3s ease forwards'
    }}>
      <div style={{
        width: '36px', height: '4px', background: '#EDE5E5',
        borderRadius: '4px', margin: '0 auto 24px'
      }}/>
      <h3 style={{
        fontFamily: 'Raleway, sans-serif',
        fontSize: '20px', fontWeight: '800',
        color: '#DC2626', marginBottom: '6px'
      }}>🚨 Raise a Dispute</h3>
      <p style={{
        color: '#B0A0A0', fontSize: '13px', marginBottom: '20px',
        lineHeight: '1.6'
      }}>
        Describe your concern. The admin will review and respond within 8AM–10PM.
      </p>

      <label style={{
        display: 'block', fontSize: '12px', fontWeight: '700',
        color: '#5A4A4A', textTransform: 'uppercase',
        letterSpacing: '0.6px', marginBottom: '8px'
      }}>Reason for Dispute</label>

      <textarea
        placeholder="e.g. The buyer marked as delivered but I haven't received my item yet..."
        value={disputeReason}
        onChange={e => setDisputeReason(e.target.value)}
        rows={4}
        style={{
          width: '100%', padding: '14px',
          borderRadius: '14px', border: '2px solid #EDE5E5',
          fontSize: '14px', fontWeight: '500',
          marginBottom: '20px', background: '#FAFAFA',
          resize: 'none', fontFamily: 'inherit', lineHeight: '1.6'
        }}
        onFocus={e => e.target.style.borderColor = '#DC2626'}
        onBlur={e => e.target.style.borderColor = '#EDE5E5'}
      />

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => { setShowDisputeModal(false); setDisputeReason(''); }}
          style={{
            flex: 1, padding: '14px', borderRadius: '14px',
            background: 'white', border: '2px solid #EDE5E5',
            fontSize: '14px', fontWeight: '700', color: '#888'
          }}
        >Cancel</button>
        <button
          onClick={handleRaiseDispute}
          disabled={!disputeReason.trim()}
          style={{
            flex: 2, padding: '14px', borderRadius: '14px',
            background: !disputeReason.trim() ? '#F0E8E8' : '#DC2626',
            color: !disputeReason.trim() ? '#C0A8A8' : 'white',
            fontSize: '14px', fontWeight: '800'
          }}
        >Submit Dispute</button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}