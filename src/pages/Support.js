import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import logoIcon from '../logo-icon.png';
import { Send } from 'lucide-react';

export default function Support({ user }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const bottomRef = useRef(null);
  const photoInputRef = useRef(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`support-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'support_messages',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    const text = newMessage.trim();
    setNewMessage('');

    await supabase.from('support_messages').insert({
      user_id: user.id,
      sender: 'user',
      message: text
    });
    setSending(false);
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
    throw new Error('Upload failed');
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);

    try {
      const photoUrl = await uploadToImgBB(file);
      await supabase.from('support_messages').insert({
        user_id: user.id,
        sender: 'user',
        photo_url: photoUrl
      });
    } catch (err) {
      alert('Photo upload failed. Please try again.');
    }
    setUploadingPhoto(false);
  };

  const formatTime = (ts) => new Date(ts).toLocaleTimeString('en-PH', {
    hour: '2-digit', minute: '2-digit'
  });

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
              borderRadius: '100px', flexShrink: 0,
              border: '1px solid rgba(255,255,255,0.12)',
              fontSize: '13px', fontWeight: '600'
            }}
          >← Back</button>

          <div style={{
            width: '38px', height: '38px',
            background: 'var(--yellow)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0
          }}>
            <img src={logoIcon} alt="PasaBuy"
              style={{ width: '28px', height: '28px', borderRadius: '50%' }}/>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              color: 'white', fontSize: '14px', fontWeight: '700'
            }}>PasaBuy Support</p>
            <p style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: '11px', marginTop: '1px'
            }}>Available 8AM - 10PM</p>
          </div>

          <div style={{
            width: '28px', height: '28px',
            background: 'var(--yellow)', borderRadius: '8px',
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
        {/* Info banner */}
        <div style={{
          background: '#F5F3FF',
          borderBottom: '1px solid #DDD6FE',
          padding: '10px 16px', flexShrink: 0
        }}>
          <p style={{
            color: '#7C3AED', fontSize: '12px', fontWeight: '700'
          }}>💬 Chat with our support team. We respond within 8AM - 10PM.</p>
        </div>

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
              <div style={{ fontSize: '36px', marginBottom: '10px' }}>🎧</div>
              <p style={{ fontWeight: '600', marginBottom: '4px', color: 'var(--text)' }}>
                Hi {user.name?.split(' ')[0]}! 👋
              </p>
              <p>How can we help you today?</p>
            </div>
          )}

          {messages.map((msg) => {
            const isMe = msg.sender === 'user';

            if (msg.photo_url) {
              return (
                <div key={msg.id} style={{
                  display: 'flex',
                  justifyContent: isMe ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-end', gap: '6px'
                }}>
                  {!isMe && (
                    <div style={{
                      width: '26px', height: '26px',
                      background: 'var(--yellow)',
                      borderRadius: '50%',
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'center', flexShrink: 0
                    }}>
                      <img src={logoIcon} alt=""
                        style={{ width: '20px', height: '20px', borderRadius: '50%' }}/>
                    </div>
                  )}
                  <div style={{
                    maxWidth: '75%',
                    background: isMe ? 'var(--maroon)' : '#F0EBEB',
                    borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    overflow: 'hidden'
                  }}>
                    <img src={msg.photo_url} alt="attachment"
                      style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }}/>
                    <p style={{
                      fontSize: '10px', opacity: 0.6,
                      padding: '4px 10px 6px',
                      textAlign: 'right',
                      color: isMe ? 'white' : 'var(--text)'
                    }}>{formatTime(msg.created_at)}</p>
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id} style={{
                display: 'flex',
                justifyContent: isMe ? 'flex-end' : 'flex-start',
                alignItems: 'flex-end', gap: '6px'
              }}>
                {!isMe && (
                  <div style={{
                    width: '26px', height: '26px',
                    background: 'var(--yellow)',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0
                  }}>
                    <img src={logoIcon} alt=""
                      style={{ width: '20px', height: '20px', borderRadius: '50%' }}/>
                  </div>
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
                  <p>{msg.message}</p>
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

        {/* Message input */}
        <div style={{
          padding: '8px 14px 24px',
          borderTop: '1px solid #F0E8E8',
          display: 'flex', gap: '8px',
          alignItems: 'flex-end', flexShrink: 0
        }}>
          {/* Photo upload */}
          <input type="file" accept="image/*"
            ref={photoInputRef}
            onChange={handlePhotoUpload}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => photoInputRef.current?.click()}
            disabled={uploadingPhoto}
            style={{
              width: '42px', height: '42px',
              borderRadius: '50%',
              background: '#F5F0F0',
              color: 'var(--text-soft)',
              fontSize: '18px', flexShrink: 0,
              display: 'flex', alignItems: 'center',
              justifyContent: 'center'
            }}
          >{uploadingPhoto ? '⏳' : '📎'}</button>

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
              transition: 'all 0.18s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          ><Send size={15} strokeWidth={2}/></button>
        </div>
      </div>
    </div>
  );
}