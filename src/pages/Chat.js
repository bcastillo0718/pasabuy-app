import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, useParams } from 'react-router-dom';
import logoIcon from '../logo-icon.png';
import { ArrowLeft, ShoppingBag, Send } from 'lucide-react';

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
  const [showRatingModal, setShowRatingModal] = useState(false);
const [rating, setRating] = useState(0);
const [ratingComment, setRatingComment] = useState('');
const [hasRated, setHasRated] = useState(false);
const [submittingRating, setSubmittingRating] = useState(false);
const [canCancel, setCanCancel] = useState(false);
const [viewingPhoto, setViewingPhoto] = useState(null);
  const bottomRef = useRef(null);
  const receiptInputRef = useRef(null);
  const proofInputRef = useRef(null);

  const isBuyer = entry?.buyer_id === user.id;
  const commission = actualPrice ? Math.round(parseFloat(actualPrice) * 0.15) : 0;
  const total = actualPrice ? parseFloat(actualPrice) + commission : 0;

  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  useEffect(() => {
  if (!request?.payment_requested_at || request?.payment_status !== 'awaiting_payment') return;

  const checkTimer = () => {
    const requestedAt = new Date(request.payment_requested_at);
    const diff = (new Date() - requestedAt) / 60000;
    setCanCancel(diff >= 15);
  };

  checkTimer();
  const interval = setInterval(checkTimer, 30000);
  return () => clearInterval(interval);
}, [request]);

  const fetchRequest = async () => {
    const { data } = await supabase
      .from('requests')
      .select(`*, pasabuyer:users!requests_pasabuyer_id_fkey(name, photo_url)`)
      .eq('id', requestId)
      .single();
    setRequest(data);

    if (data?.entry_id) {
      const { data: entryData } = await supabase
        .from('entries')
        .select('*, users(name, photo_url)')
        .eq('id', data.entry_id)
        .single();
      setEntry(entryData);
    }
    setLoading(false);
    checkIfRated();
  };

const checkIfRated = async () => {
    const { data } = await supabase
      .from('ratings')
      .select('id')
      .eq('request_id', requestId)
      .eq('rater_id', user.id);
    setHasRated(data && data.length > 0);
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
    if (!actualPrice || parseFloat(actualPrice) < 40) return;

    await supabase.from('requests').update({
      actual_price: parseFloat(actualPrice),
      commission,
      total_amount: total,
      payment_status: 'awaiting_payment',
      payment_requested_at: new Date().toISOString()
    }).eq('id', requestId);

    await supabase.from('messages').insert({
      request_id: requestId,
      sender_id: user.id,
      text: `💳 PAYMENT REQUEST\nItem: ₱${parseFloat(actualPrice).toFixed(2)}\nCommission (15%): ₱${commission.toFixed(2)}\nTotal: ₱${total.toFixed(2)}\n\nPlease send ₱${total.toFixed(2)} to this GCash number: 09065935527 then upload your receipt below. Double check the amount and number before sending.`
    });

    setShowPriceModal(false);
    setActualPrice('');
    fetchRequest();
  };

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

  const runOCR = async (file) => {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(file);
    await worker.terminate();
    return text;
  };

  const handleReceiptUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingReceipt(true);
    setOcrError('');

    try {
      const imageUrl = await uploadToImgBB(file);
      const ocrText = await runOCR(file);
      const gcashNumber = '09065935527';
      const ocrNormalized = ocrText.replace(/\s/g, '').toLowerCase();
      const hasGcashNumber =
        ocrNormalized.includes(gcashNumber) ||
        ocrNormalized.includes('+639065935527') ||
        ocrText.includes('+63 906 593 5527');

      const expectedAmount = request?.total_amount?.toFixed(2);
      const expectedWhole = Math.round(request?.total_amount).toString();
      const hasAmount =
        ocrNormalized.includes(expectedAmount?.replace('.', '')) ||
        ocrNormalized.includes(expectedAmount) ||
        ocrNormalized.includes(expectedWhole);

      if (!hasGcashNumber) {
        setOcrError('❌ Wrong Receipt. Please make sure that you have sent the payment to the correct GCash number.');
        setUploadingReceipt(false);
        return;
      }
      if (!hasAmount) {
        setOcrError(`❌ Invalid Amount. Expected ₱${expectedAmount}. Please send the correct amount.`);
        setUploadingReceipt(false);
        return;
      }

      await supabase.from('requests').update({
        payment_status: 'paid',
        gcash_reference: imageUrl
      }).eq('id', requestId);

      await supabase.from('messages').insert({
  request_id: requestId,
  sender_id: user.id,
  text: `📄 RECEIPT[photo]${imageUrl}`
});

await supabase.from('messages').insert({
  request_id: requestId,
  sender_id: user.id,
  text: `✅ Payment verified! For the Buyer, please review also the receipt above before purchasing.`
});

      fetchRequest();
    } catch (err) {
      setOcrError('❌ Something went wrong. Please try again.');
    }
    setUploadingReceipt(false);
  };

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
    const hour = new Date().getHours();
    if (hour < 8 || hour >= 22) {
      alert('Dispute support is available between 8AM - 10PM only.');
      return;
    }

    await supabase.from('disputes').insert({
      request_id: requestId,
      raised_by: user.id,
      reason: disputeReason.trim(),
      status: 'open'
    });
    await supabase.from('requests').update({ status: 'disputed' }).eq('id', requestId);
    await supabase.from('messages').insert({
      request_id: requestId,
      sender_id: user.id,
      text: `🚨 A dispute has been raised. The admin has been notified and will review this transaction.`
    });
    setShowDisputeModal(false);
    setDisputeReason('');
    fetchRequest();
  };

const handleSubmitRating = async () => {
  if (rating === 0) return;
  setSubmittingRating(true);

  const ratedId = isBuyer
    ? request?.pasabuyer_id
    : entry?.buyer_id;

  console.log('Submitting rating:', { requestId, raterId: user.id, ratedId, rating });

await supabase.from('ratings').insert({
    request_id: requestId,
    rater_id: user.id,
    rated_id: ratedId,
    rating,
    comment: ratingComment.trim() || null
  });



  // Update user's average rating
  const { data: allRatings } = await supabase
    .from('ratings')
    .select('rating')
    .eq('rated_id', ratedId);

  const avg = allRatings?.reduce((sum, r) => sum + r.rating, 0) / allRatings?.length;

  await supabase.from('users').update({
    avg_rating: Math.round(avg * 10) / 10,
    total_ratings: allRatings?.length
  }).eq('id', ratedId);

  setHasRated(true);
  setShowRatingModal(false);
  setSubmittingRating(false);
};

  const handleConfirmReceived = async () => {
    await supabase.from('requests').update({ status: 'completed' }).eq('id', requestId);
    await supabase.from('messages').insert({
      request_id: requestId,
      sender_id: user.id,
      text: `🎉 Order completed! Pasabuyer confirmed receipt of items. Thank you for using PasaBuy App!`
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
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '40px', height: '40px',
          background: 'var(--yellow)', borderRadius: '12px',
          margin: '0 auto 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <img src={logoIcon} alt="PasaBuy"
            style={{ width: '28px', height: '28px', borderRadius: '8px' }}/>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>Loading chat...</p>
      </div>
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
      <div style={{ padding: '48px 20px 14px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: 'white', padding: '8px 14px',
              borderRadius: '100px',
              flexShrink: 0,
              border: '1px solid rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center'
            }}
          ><ArrowLeft size={16} strokeWidth={2}/></button>

          <img
            src={isBuyer ? request?.pasabuyer?.photo_url : entry?.users?.photo_url}
            alt=""
            style={{
              width: '38px', height: '38px', borderRadius: '50%',
              border: '2px solid var(--yellow)',
              flexShrink: 0
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              color: 'white', fontSize: '14px', fontWeight: '700',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
            }}>
              {isBuyer ? request?.pasabuyer?.name : entry?.users?.name}
            </p>
            <p style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: '11px', marginTop: '1px',
              display: 'flex', alignItems: 'center', gap: '4px'
            }}>
              <ShoppingBag size={11} strokeWidth={2}/>
              {request?.item_name}
            </p>
          </div>
          <div style={{
            width: '28px', height: '28px',
            background: 'var(--yellow)',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0
          }}>
            <img src={logoIcon} alt="PasaBuy"
              style={{ width: '22px', height: '22px', borderRadius: '6px' }}/>
          </div>
        </div>
      </div>

      {/* Chat body */}
      <div style={{
        flex: 1, background: 'white',
        borderRadius: '28px 28px 0 0',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 -8px 48px rgba(0,0,0,0.2)'
      }}>
        {/* Status banner */}
        {banner && (
          <div style={{
            background: banner.bg,
            borderBottom: `1px solid ${banner.border}`,
            padding: '10px 16px', flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <p style={{
              color: banner.color, fontSize: '12px',
              fontWeight: '700', flex: 1
            }}>{banner.text}</p>
          </div>
        )}

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '14px 14px 8px',
          display: 'flex', flexDirection: 'column', gap: '6px'
        }}>
          {messages.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '48px 20px',
              color: '#C0B0B0', fontSize: '13px'
            }}>
              <div style={{ fontSize: '36px', marginBottom: '10px' }}>💬</div>
              Start the conversation! Coordinate pickup details here.
            </div>
          )}

          {messages.map((msg) => {
            const isMe = msg.sender_id === user.id;

            if (msg.text?.startsWith('💸 PAYMENT RELEASED') && !isBuyer) {
              return null;
            }

            if (msg.text?.startsWith('📄 RECEIPT')) {
  const photoUrl = msg.text.split('[photo]')[1];
  return (
    <div key={msg.id} style={{
      background: '#F0FDF4',
      border: '1px solid #BBF7D0',
      borderRadius: '14px', padding: '12px',
      textAlign: 'center'
    }}>
      <p style={{
        fontSize: '11px', fontWeight: '700',
        color: '#16A34A', marginBottom: '8px',
        textTransform: 'uppercase', letterSpacing: '0.5px'
      }}>📄 GCash Receipt</p>
      <img
        src={photoUrl} alt="GCash Receipt"
        onClick={() => setViewingPhoto(photoUrl)}
        style={{
          width: '100%', borderRadius: '8px',
          cursor: 'pointer'
        }}
      />
      <p style={{
        fontSize: '11px', color: '#16A34A',
        marginTop: '8px', fontWeight: '500',
        lineHeight: '1.5'
      }}>Please verify this receipt before purchasing. If you think that the receipt is fake/manipulated, you may raise a dispute.</p>
      <p style={{
        fontSize: '10px', color: '#888',
        marginTop: '4px'
      }}>{formatTime(msg.created_at)}</p>
    </div>
  );
}

            // Proof of delivery
            if (msg.text?.startsWith('📦 PROOF OF DELIVERY')) {
              const photoUrl = msg.text.split('[photo]')[1];
              return (
                <div key={msg.id} style={{
                  background: '#F0F9FF',
                  border: '1px solid #BAE6FD',
                  borderRadius: '14px', padding: '12px',
                  textAlign: 'center'
                }}>
                  <p style={{
                    fontSize: '11px', fontWeight: '700',
                    color: '#0369A1', marginBottom: '8px',
                    textTransform: 'uppercase', letterSpacing: '0.5px'
                  }}>📦 Proof of Delivery</p>
                  <img
                    src={photoUrl} alt="Proof of delivery"
                    onClick={() => setViewingPhoto(photoUrl)}
                    style={{
                      width: '100%', borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  />
                  <p style={{
                    fontSize: '10px', color: '#888',
                    marginTop: '6px'
                  }}>{formatTime(msg.created_at)}</p>
                </div>
              );
            }

            // System messages
            if (msg.text?.startsWith('💳') || msg.text?.startsWith('✅') ||
                msg.text?.startsWith('🎉') || msg.text?.startsWith('📦 Item') ||
                msg.text?.startsWith('🚨')) {
              return (
                <div key={msg.id} style={{
                  background: '#F5F0F0', borderRadius: '12px',
                  padding: '10px 14px', fontSize: '12px',
                  color: '#7A6B6E', lineHeight: '1.6',
                  fontWeight: '500', whiteSpace: 'pre-line',
                  textAlign: 'center'
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
                      width: '26px', height: '26px', borderRadius: '50%',
                      flexShrink: 0, border: '1px solid #EDE5E5'
                    }}
                  />
                )}
                <div style={{
                  maxWidth: '75%',
                  background: isMe ? 'var(--maroon)' : '#F0EBEB',
                  color: isMe ? 'white' : 'var(--text)',
                  padding: '9px 13px',
                  borderRadius: isMe
                    ? '16px 16px 4px 16px'
                    : '16px 16px 16px 4px',
                  fontSize: '14px', lineHeight: '1.5',
                  fontWeight: '500'
                }}>
                  <p>{msg.text}</p>
                  <p style={{
                    fontSize: '10px', opacity: 0.55,
                    marginTop: '3px', textAlign: 'right'
                  }}>{formatTime(msg.created_at)}</p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef}/>
        </div>

        {/* Action buttons */}
        <div style={{ padding: '0 14px 6px', flexShrink: 0 }}>
          {ocrError && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: '10px', padding: '9px 12px',
              marginBottom: '6px', fontSize: '12px',
              color: '#DC2626', fontWeight: '600'
            }}>{ocrError}</div>
          )}

          {/* Payment timeout note + cancel button */}
          {isBuyer && request?.payment_status === 'awaiting_payment' && (
            <div style={{
              background: '#FFF8E8',
              border: '1px solid #FDE68A',
              borderRadius: '10px', padding: '9px 12px',
              marginBottom: '6px'
            }}>
              <p style={{
                fontSize: '11px', color: '#92400E',
                fontWeight: '500', lineHeight: '1.5'
              }}>
                ⚠️ To prevent buyers waiting indefinitely, you may cancel this request after 15 minutes of no payment.
              </p>
              {canCancel && (
                <button
                  onClick={async () => {
                    await supabase.from('requests').update({
                      status: 'cancelled',
                      payment_status: 'cancelled'
                    }).eq('id', requestId);
                    await supabase.from('messages').insert({
                      request_id: requestId,
                      sender_id: user.id,
                      text: `❌ Request cancelled due to no payment received after 15 minutes.`
                    });
                    fetchRequest();
                  }}
                  style={{
                    width: '100%', padding: '9px',
                    borderRadius: '9px',
                    background: '#FEF2F2', color: '#DC2626',
                    border: '1px solid #FECACA',
                    fontSize: '12px', fontWeight: '700',
                    marginTop: '8px'
                  }}
                >❌ Cancel Request (No Payment Received)</button>
              )}
            </div>
          )}

          {/* Buyer: Set Price */}
          {isBuyer && request?.status === 'accepted' &&
            request?.payment_status === 'pending' && (
            <button
              onClick={() => setShowPriceModal(true)}
              style={{
                width: '100%', padding: '11px', borderRadius: '11px',
                background: 'var(--maroon)', color: 'white',
                fontSize: '13px', fontWeight: '700', marginBottom: '6px',
                boxShadow: 'var(--shadow-maroon)'
              }}
            >💰 Set Item Price & Request Payment</button>
          )}

          {/* Pasabuyer: Upload Receipt */}
          {!isBuyer && request?.payment_status === 'awaiting_payment' && (
            <>
              <input type="file" accept="image/*"
                ref={receiptInputRef}
                onChange={handleReceiptUpload}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => { setOcrError(''); receiptInputRef.current?.click(); }}
                disabled={uploadingReceipt}
                style={{
                  width: '100%', padding: '11px', borderRadius: '11px',
                  background: uploadingReceipt ? '#F0E8E8' : 'var(--green)',
                  color: uploadingReceipt ? '#C0A8A8' : 'white',
                  fontSize: '13px', fontWeight: '700', marginBottom: '6px'
                }}
              >
                {uploadingReceipt ? '⏳ Verifying receipt...' : '📸 Upload GCash Receipt'}
              </button>
            </>
          )}

          {/* Buyer: Upload Proof */}
          {isBuyer && request?.payment_status === 'paid' &&
            !request?.proof_photo_url &&
            request?.status !== 'delivered' &&
            request?.status !== 'completed' && (
            <>
              <input type="file" accept="image/*"
                ref={proofInputRef}
                onChange={handleProofUpload}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => proofInputRef.current?.click()}
                disabled={uploadingProof}
                style={{
                  width: '100%', padding: '11px', borderRadius: '11px',
                  background: uploadingProof ? '#F0E8E8' : 'var(--green)',
                  color: uploadingProof ? '#C0A8A8' : 'white',
                  fontSize: '13px', fontWeight: '700', marginBottom: '6px'
                }}
              >
                {uploadingProof ? '⏳ Uploading...' : '📷 Upload Proof of Delivery'}
              </button>
            </>
          )}

          {/* Raise Dispute */}
          {!isBuyer &&
            request?.payment_status === 'paid' &&
            request?.status !== 'completed' &&
            request?.status !== 'disputed' && (
            <button
              onClick={() => setShowDisputeModal(true)}
              style={{
                width: '100%', padding: '11px', borderRadius: '11px',
                background: '#FEF2F2', color: '#DC2626',
                border: '1px solid #FECACA',
                fontSize: '13px', fontWeight: '700', marginBottom: '6px'
              }}
            >🚨 Raise a Dispute</button>
          )}

          {/* Buyer: Raise Dispute for suspicious receipt */}
          {isBuyer &&
            request?.payment_status === 'paid' &&
            request?.status !== 'completed' &&
            request?.status !== 'disputed' && (
            <button
              onClick={() => setShowDisputeModal(true)}
              style={{
                width: '100%', padding: '11px', borderRadius: '11px',
                background: '#FEF2F2', color: '#DC2626',
                border: '1px solid #FECACA',
                fontSize: '13px', fontWeight: '700', marginBottom: '6px'
              }}
            >🚨 Raise Dispute</button>
          )}

          {/* I Received It */}
          {!isBuyer &&
            request?.proof_photo_url &&
            request?.status !== 'completed' &&
            request?.status !== 'disputed' && (
            <button
              onClick={handleConfirmReceived}
              style={{
                width: '100%', padding: '11px', borderRadius: '11px',
                background: 'var(--green)', color: 'white',
                fontSize: '13px', fontWeight: '700', marginBottom: '6px'
              }}
            >🎉 I Received It!</button>
          )}
          {/* Rate button — shows after completed */}
          {request?.status === 'completed' && !hasRated && (
            <button
              onClick={() => setShowRatingModal(true)}
              style={{
                width: '100%', padding: '11px', borderRadius: '11px',
                background: 'var(--yellow)', color: 'var(--maroon)',
                fontSize: '13px', fontWeight: '700', marginBottom: '6px',
                boxShadow: '0 4px 12px rgba(255,229,102,0.3)'
              }}
            >⭐ Rate this Transaction</button>
          )}

          {request?.status === 'completed' && hasRated && (
            <div style={{
              textAlign: 'center', padding: '10px',
              color: '#16A34A', fontSize: '13px', fontWeight: '700'
            }}>✅ You've already rated this transaction</div>
          )}
        </div>

          {/* Quick replies */}
        {request?.status !== 'completed' && request?.status !== 'disputed' && (
          <div style={{
            padding: '0 14px 8px',
            display: 'flex', gap: '6px',
            overflowX: 'auto', flexShrink: 0
          }}>
            {[
              "I'm on my way! 🏃",
              "Almost there! ⏱️",
              "I'm here! 📍",
              "Got your item! ✅",
              "Please wait a moment 🙏"
            ].map((reply, i) => (
              <button
                key={i}
                onClick={() => setNewMessage(reply)}
                style={{
                  background: '#F5F0F0',
                  color: 'var(--text)',
                  padding: '6px 12px',
                  borderRadius: '100px',
                  fontSize: '12px', fontWeight: '600',
                  whiteSpace: 'nowrap',
                  border: '1px solid #EDE5E5',
                  flexShrink: 0
                }}
              >{reply}</button>
            ))}
          </div>
        )}

        {/* Message input */}
        {request?.status !== 'completed' && request?.status !== 'disputed' && (
          <div style={{
            padding: '8px 14px 24px',
            borderTop: '1px solid #F0E8E8',
            display: 'flex', gap: '8px',
            alignItems: 'flex-end', flexShrink: 0
          }}>
            <div style={{
              flex: 1, background: '#F5F0F0',
              borderRadius: '18px', padding: '9px 14px',
              border: '1.5px solid transparent',
              transition: 'border-color 0.2s'
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
                width: '42px', height: '42px', borderRadius: '50%',
                background: newMessage.trim() ? 'var(--maroon)' : '#EDE5E5',
                color: newMessage.trim() ? 'white' : '#C0A8A8',
                fontSize: '16px', flexShrink: 0,
                boxShadow: newMessage.trim() ? 'var(--shadow-maroon)' : 'none',
                transition: 'all 0.18s ease'
              }}
            ><Send size={15} strokeWidth={2}/></button>
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
            padding: '24px 22px 40px', width: '100%',
            animation: 'slideUp 0.3s ease forwards'
          }}>
            <div style={{
              width: '32px', height: '4px', background: '#EDE5E5',
              borderRadius: '4px', margin: '0 auto 20px'
            }}/>
            <h3 style={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: '19px', fontWeight: '800',
              color: 'var(--maroon)', marginBottom: '4px'
            }}>💰 Set Item Price</h3>
            <p style={{
              color: '#B0A0A0', fontSize: '13px', marginBottom: '20px'
            }}>Enter the actual price of the item</p>

            <label style={{
              display: 'block', fontSize: '11px', fontWeight: '700',
              color: 'var(--text-soft)', textTransform: 'uppercase',
              letterSpacing: '1px', marginBottom: '8px'
            }}>Actual Item Price (₱)</label>

            <input
              type="number" placeholder="e.g. 120"
              value={actualPrice}
              onChange={e => setActualPrice(e.target.value)}
              min="40"
              style={{
                width: '100%', padding: '13px 16px',
                borderRadius: '13px', border: '1.5px solid #EDE5E5',
                fontSize: '20px', fontWeight: '700',
                marginBottom: '14px', background: '#FAFAFA'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--maroon)'}
              onBlur={e => e.target.style.borderColor = '#EDE5E5'}
            />

            {actualPrice && parseFloat(actualPrice) >= 50 && (
              <div style={{
                background: '#FAFAFA', borderRadius: '13px',
                padding: '13px 16px', marginBottom: '18px',
                border: '1px solid #F0E8E8'
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
                  flex: 1, padding: '13px', borderRadius: '13px',
                  background: 'white', border: '1.5px solid #EDE5E5',
                  fontSize: '14px', fontWeight: '700', color: '#888'
                }}
              >Cancel</button>
              <button
                onClick={handleSetPrice}
                disabled={!actualPrice || parseFloat(actualPrice) < 40}
                style={{
                  flex: 2, padding: '13px', borderRadius: '13px',
                  background: (!actualPrice || parseFloat(actualPrice) < 40)
                    ? '#F0E8E8' : 'var(--maroon)',
                  color: (!actualPrice || parseFloat(actualPrice) < 40)
                    ? '#C0A8A8' : 'white',
                  fontSize: '14px', fontWeight: '800',
                  boxShadow: (!actualPrice || parseFloat(actualPrice) < 40)
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
            padding: '24px 22px 40px', width: '100%',
            animation: 'slideUp 0.3s ease forwards'
          }}>
            <div style={{
              width: '32px', height: '4px', background: '#EDE5E5',
              borderRadius: '4px', margin: '0 auto 20px'
            }}/>
            <h3 style={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: '19px', fontWeight: '800',
              color: '#DC2626', marginBottom: '4px'
            }}>🚨 Raise a Dispute</h3>
            <p style={{
              color: '#B0A0A0', fontSize: '13px', marginBottom: '20px',
              lineHeight: '1.6'
            }}>
              Describe your concern. The admin will review and respond within 8AM–10PM.
            </p>

            <label style={{
              display: 'block', fontSize: '11px', fontWeight: '700',
              color: 'var(--text-soft)', textTransform: 'uppercase',
              letterSpacing: '1px', marginBottom: '8px'
            }}>Reason for Dispute</label>

            <textarea
              placeholder="e.g. The buyer marked as delivered but I haven't received my item yet..."
              value={disputeReason}
              onChange={e => setDisputeReason(e.target.value)}
              rows={4}
              style={{
                width: '100%', padding: '13px',
                borderRadius: '13px', border: '1.5px solid #EDE5E5',
                fontSize: '14px', fontWeight: '500',
                marginBottom: '18px', background: '#FAFAFA',
                resize: 'none', fontFamily: 'inherit', lineHeight: '1.6'
              }}
              onFocus={e => e.target.style.borderColor = '#DC2626'}
              onBlur={e => e.target.style.borderColor = '#EDE5E5'}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => { setShowDisputeModal(false); setDisputeReason(''); }}
                style={{
                  flex: 1, padding: '13px', borderRadius: '13px',
                  background: 'white', border: '1.5px solid #EDE5E5',
                  fontSize: '14px', fontWeight: '700', color: '#888'
                }}
              >Cancel</button>
              <button
                onClick={handleRaiseDispute}
                disabled={!disputeReason.trim()}
                style={{
                  flex: 2, padding: '13px', borderRadius: '13px',
                  background: !disputeReason.trim() ? '#F0E8E8' : '#DC2626',
                  color: !disputeReason.trim() ? '#C0A8A8' : 'white',
                  fontSize: '14px', fontWeight: '800'
                }}
              >Submit Dispute</button>
            </div>
          </div>
        </div>
      )}


 {/* Rating Modal */}
      {showRatingModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'flex-end',
          justifyContent: 'center', zIndex: 200,
          maxWidth: '480px', margin: '0 auto'
        }}>
          <div style={{
            background: 'white', borderRadius: '28px 28px 0 0',
            padding: '24px 22px 40px', width: '100%',
            animation: 'slideUp 0.3s ease forwards'
          }}>
            <div style={{
              width: '32px', height: '4px', background: '#EDE5E5',
              borderRadius: '4px', margin: '0 auto 20px'
            }}/>

            <h3 style={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: '19px', fontWeight: '800',
              color: 'var(--text)', marginBottom: '4px'
            }}>⭐ Rate this Transaction</h3>
            <p style={{
              color: '#B0A0A0', fontSize: '13px',
              marginBottom: '24px', lineHeight: '1.6'
            }}>
              How was your experience with{' '}
              <strong>{isBuyer ? request?.pasabuyer?.name : entry?.users?.name}</strong>?
            </p>

            {/* Star selector */}
            <div style={{
              display: 'flex', justifyContent: 'center',
              gap: '12px', marginBottom: '20px'
            }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  style={{
                    fontSize: '36px',
                    background: 'none',
                    transform: rating >= star ? 'scale(1.2)' : 'scale(1)',
                    filter: rating >= star ? 'none' : 'grayscale(1)',
                    transition: 'all 0.15s ease'
                  }}
                >⭐</button>
              ))}
            </div>

            {/* Rating label */}
            {rating > 0 && (
              <p style={{
                textAlign: 'center', fontWeight: '700',
                fontSize: '14px', marginBottom: '16px',
                color: rating >= 4 ? '#16A34A' : rating >= 3 ? '#D97706' : '#DC2626'
              }}>
                {rating === 5 ? '🎉 Excellent!' :
                 rating === 4 ? '😊 Great!' :
                 rating === 3 ? '😐 Okay' :
                 rating === 2 ? '😕 Not great' :
                 '😞 Poor'}
              </p>
            )}

            {/* Comment */}
            <label style={{
              display: 'block', fontSize: '11px', fontWeight: '700',
              color: 'var(--text-soft)', textTransform: 'uppercase',
              letterSpacing: '1px', marginBottom: '8px'
            }}>Comment (optional)</label>
            <textarea
              placeholder="Share your experience..."
              value={ratingComment}
              onChange={e => setRatingComment(e.target.value)}
              rows={3}
              style={{
                width: '100%', padding: '13px',
                borderRadius: '13px', border: '1.5px solid #EDE5E5',
                fontSize: '14px', fontWeight: '500',
                marginBottom: '18px', background: '#FAFAFA',
                resize: 'none', fontFamily: 'inherit', lineHeight: '1.6'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--maroon)'}
              onBlur={e => e.target.style.borderColor = '#EDE5E5'}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => { setShowRatingModal(false); setRating(0); setRatingComment(''); }}
                style={{
                  flex: 1, padding: '13px', borderRadius: '13px',
                  background: 'white', border: '1.5px solid #EDE5E5',
                  fontSize: '14px', fontWeight: '700', color: '#888'
                }}
              >Cancel</button>
              <button
                onClick={handleSubmitRating}
                disabled={rating === 0 || submittingRating}
                style={{
                  flex: 2, padding: '13px', borderRadius: '13px',
                  background: rating === 0 ? '#F0E8E8' : 'var(--maroon)',
                  color: rating === 0 ? '#C0A8A8' : 'white',
                  fontSize: '14px', fontWeight: '800',
                  boxShadow: rating === 0 ? 'none' : 'var(--shadow-maroon)'
                }}
              >{submittingRating ? '⏳ Submitting...' : 'Submit Rating'}</button>
            </div>
          </div>
        </div>
      )}

    {viewingPhoto && (
        <div
          onClick={() => setViewingPhoto(null)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 999,
            padding: '20px'
          }}
        >
          <img src={viewingPhoto} alt="Full view"
            style={{
              maxWidth: '100%', maxHeight: '90vh',
              borderRadius: '12px', objectFit: 'contain'
            }}
          />
          <p style={{
            position: 'absolute', bottom: '30px',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '12px'
          }}>Tap anywhere to close</p>
        </div>
      )}
    </div>
  );
}