import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import logoIcon from '../logo-icon.png';

export default function ProfileSetup({ session, onComplete }) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);
  const [step, setStep] = useState('agreement');
   

  const handleSubmit = async () => {
    if (!phone || phone.length < 11) {
      setError('Please enter a valid 11-digit GCash number');
      return;
    }
    if (!phone.startsWith('09')) {
      setError('GCash number must start with 09');
      return;
    }
    setLoading(true);
    setError('');

    const { data, error } = await supabase
      .from('users')
      .insert({
        id: session.user.id,
        name: session.user.user_metadata.full_name,
        email: session.user.email,
        phone,
        photo_url: session.user.user_metadata.avatar_url,
        membership_status: 'inactive',
        strikes: 0,
        account_status: 'active',
        agreed_to_terms: true,
        agreed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
      return;
    }
    onComplete(data);
  };

  const progress = Math.min((phone.length / 11) * 100, 100);
  const isValid = phone.length === 11 && phone.startsWith('09');

const rules = [
  { category: 'General', items: [
    'You must provide accurate and truthful information when signing up.',
    'You must be respectful to all users at all times.',
    'Any form of harassment, fraud, or misconduct will result in immediate suspension.'
  ]},
  { category: 'For Buyers', items: [
    'Only post an entry if you are actually going out. Posting fake entries will result in a strike.',
    'Once you accept a request, you are obligated to purchase and deliver the item. Failure to do so without valid reason will result in a strike.',
    'You must upload a valid proof of delivery before the transaction can be completed.',
  ]},
  { category: 'For Pasabuyers', items: [
    'You must pay the exact amount requested within 15 minutes of receiving the payment request. Repeated failure to pay (3 times) will result in a strike.',
    'You must upload a valid and genuine GCash receipt as proof of payment.',
    'Raising false disputes will result in a strike.',
  ]},
  { category: 'Payments & Earnings', items: [
    'All payments must be made through GCash only.',
    'The minimum order amount is ₱40. Orders below this amount will not be accepted.',
    'The 15% commission is non-negotiable and goes directly to the buyer.',
    'Earnings will be released after the admin verifies the proof of delivery.'
  ]},
  { category: 'Violations — Instant Suspension', items: [
    'Uploading a fake or manipulated GCash receipt will result in immediate account suspension.',
    'Using PasaBuy App for illegal items or prohibited substances will result in immediate account suspension.',
    'Creating multiple accounts is strictly prohibited and will result in immediate suspension of all accounts.',
    'Sharing your account with other users will result in immediate suspension.',
    'Any form of harassment or threatening behavior in chat will result in immediate suspension.',
    'Manipulating ratings through fake accounts will result in immediate permanent suspension.',
  ]},
  { category: 'Violations — Strike Offenses', items: [
    'Not delivering an accepted item without valid reason.',
    'Raising a false dispute.',
    'Failing to pay within 15 minutes on 3 separate transactions.',
    'Providing inaccurate profile information.',
    'Pressuring other users for high ratings.',
    'Sharing external contact details in chat.',
    'Posting fake entries without actually going out.',
  ]},
  { category: 'Strikes & Suspension', items: [
    'Users who receive 3 strikes will be automatically suspended.',
    'Suspended accounts may submit an appeal for review.',
    'PasaBuy App reserves the right to suspend accounts without prior notice for serious violations.',
  ]},
  { category: 'Privacy & Safety', items: [
    'Do not share your personal information in the chat.',
    'Do not use PasaBuy App for items that are prohibited on campus.',
    'Your GCash number is only used for receiving earnings and will not be shared publicly.',
  ]},
  { category: 'Chat & Communication', items: [
    'Keep all communication within the PasaBuy Appchat only.',
    'Do not share external contact details in the chat.',
    'Do not send inappropriate, offensive or threatening messages in the chat.',
    'Screenshots of private conversations used to harass other users will result in suspension.',
  ]},
  { category: 'Ratings & Reviews', items: [
    'Ratings must be honest and based on actual transaction experience.',
    'Manipulating ratings through fake accounts will result in permanent suspension.',
    'Do not pressure other users into giving you a high rating.',
  ]},
  { category: 'Account', items: [
    'Each person is only allowed one PasaBuy account.',
    'Sharing accounts with other users is strictly prohibited.',
    'PasaBuy App reserves the right to modify these rules at any time.',
    'Continued use of the app means you agree to any updated rules.',
  ]},
  { category: 'Disclaimer', items: [
    'PasaBuy App is a peer-to-peer errand sharing platform and is not responsible for any loss, damage or disputes arising from transactions between users.',
    'All disputes will be handled fairly by the admin based on available evidence.',
    'PasaBuy App operates daily from 8AM to 10PM only. Transactions outside these hours are at the users\'s own risk.',
  ]}
];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #6B0000 0%, #8B0000 45%, #1A3B20 100%)',
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '480px',
      margin: '0 auto',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Glow */}
      <div style={{
        position: 'absolute', top: '-80px', right: '-80px',
        width: '300px', height: '300px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,229,102,0.12) 0%, transparent 65%)',
        pointerEvents: 'none'
      }}/>
      <div style={{
        position: 'absolute', bottom: '300px', left: '-60px',
        width: '200px', height: '200px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(46,158,79,0.15) 0%, transparent 65%)',
        pointerEvents: 'none'
      }}/>

      {/* Header */}
      <div style={{
        padding: '52px 24px 28px',
        animation: 'fadeUp 0.4s ease forwards'
      }}>
        {/* Brand */}
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: '10px', marginBottom: '32px'
        }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'var(--yellow)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img src={logoIcon} alt="PasaBuy"
              style={{ width: '26px', height: '26px', borderRadius: '6px' }}/>
          </div>
          <span style={{
            fontFamily: 'Raleway, sans-serif',
            color: 'var(--yellow)',
            fontSize: '18px', fontWeight: '800'
          }}>PasaBuy App</span>
        </div>

        {/* Step indicator */}
        <div style={{
          display: 'flex', gap: '6px', marginBottom: '20px'
        }}>
          {[0, 1].map(i => (
            <div key={i} style={{
              height: '3px', flex: 1, borderRadius: '4px',
              background: (step === 'agreement' && i === 0) || (step === 'profile' && i <= 1)
                ? 'var(--yellow)'
                : 'rgba(255,255,255,0.15)'
            }}/>
          ))}
        </div>

        <p style={{
          color: 'rgba(255,255,255,0.45)',
          fontSize: '11px', fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '1.4px', marginBottom: '8px'
        }}>{step === 'agreement' ? 'Step 1 of 2' : 'Step 2 of 2'}</p>
        <h1 style={{
          fontFamily: 'Raleway, sans-serif',
          color: 'white', fontSize: '30px',
          fontWeight: '800', lineHeight: '1.2',
          letterSpacing: '-0.3px'
        }}>Set up your<br/>profile ✨</h1>
      </div>

      {/* White card */}
      <div style={{
        flex: 1,
        background: 'white',
        borderRadius: '32px 32px 0 0',
        padding: '24px 24px 40px',
        boxShadow: '0 -8px 48px rgba(0,0,0,0.18)',
        animation: 'fadeUp 0.4s ease 0.12s both',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Handle */}
        <div style={{
          width: '32px', height: '4px',
          background: '#EDE5E5', borderRadius: '4px',
          margin: '0 auto 20px', flexShrink: 0
        }}/>

        {step === 'agreement' ? (
          <>
            <h2 style={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: '18px', fontWeight: '800',
              color: 'var(--text)', marginBottom: '4px',
              flexShrink: 0
            }}>Community Rules & Agreement</h2>
            <p style={{
              color: 'var(--text-soft)', fontSize: '12px',
              marginBottom: '16px', lineHeight: '1.6',
              flexShrink: 0
            }}>
              Please read and scroll through all the rules before proceeding.
            </p>

            {/* Rules scroll area */}
            <div
            
              
              style={{
                flex: 1, overflowY: 'auto',
                marginBottom: '16px',
                paddingRight: '4px'
              }}
            >
              {rules.map((section, si) => (
                <div key={si} style={{ marginBottom: '16px' }}>
                  <p style={{
                    fontSize: '11px', fontWeight: '800',
                    color: 'var(--maroon)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    marginBottom: '8px'
                  }}>{section.category}</p>
                  {section.items.map((rule, ri) => (
                    <div key={ri} style={{
                      display: 'flex', gap: '8px',
                      marginBottom: '6px',
                      alignItems: 'flex-start'
                    }}>
                      <div style={{
                        width: '5px', height: '5px',
                        borderRadius: '50%',
                        background: 'var(--maroon)',
                        marginTop: '6px', flexShrink: 0
                      }}/>
                      <p style={{
                        fontSize: '12px', color: 'var(--text)',
                        lineHeight: '1.6', fontWeight: '500'
                      }}>{rule}</p>
                    </div>
                  ))}
                </div>
              ))}

              {/* Bottom padding so last item isn't cut off */}
              <div style={{ height: '20px' }}/>
            </div>

            {/* Agree button */}
            <div style={{ flexShrink: 0 }}>
              
              <button
                onClick={() => setStep('profile')}
                style={{
                width: '100%', padding: '15px',
                borderRadius: '14px',
                background: 'var(--maroon)',
                color: 'white',
                  fontSize: '14px', fontWeight: '800',
                  boxShadow: 'var(--shadow-maroon)',
                  transition: 'all 0.2s ease'
                }}
              >I Agree to the Community Rules</button>
            </div>
          </>
        ) : (
          <>
            {/* User info row */}
            <div style={{
              display: 'flex', alignItems: 'center',
              gap: '12px',
              background: '#FFF8F8',
              border: '1px solid rgba(139,0,0,0.08)',
              borderRadius: '16px',
              padding: '14px',
              marginBottom: '24px'
            }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <img
                  src={session.user.user_metadata.avatar_url}
                  alt="Profile"
                  style={{
                    width: '48px', height: '48px',
                    borderRadius: '50%',
                    border: '2px solid var(--maroon)'
                  }}
                />
                <div style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: '16px', height: '16px',
                  background: '#22C55E',
                  borderRadius: '50%',
                  border: '2px solid white',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8px', color: 'white',
                  fontWeight: '900'
                }}>✓</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontWeight: '700', fontSize: '14px',
                  color: 'var(--text)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>{session.user.user_metadata.full_name}</p>
                <p style={{
                  fontSize: '12px', color: 'var(--text-soft)',
                  marginTop: '2px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>{session.user.email}</p>
              </div>
              <div style={{
                background: 'var(--maroon)',
                color: 'white',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '10px', fontWeight: '700',
                flexShrink: 0,
                display: 'flex', alignItems: 'center', gap: '4px'
              }}>
                <img src="https://www.google.com/favicon.ico"
                  alt="" style={{ width: '10px', height: '10px', filter: 'brightness(10)' }}/>
                Verified
              </div>
            </div>

            {/* GCash label */}
            <p style={{
              fontSize: '11px', fontWeight: '700',
              color: 'var(--text-soft)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '10px'
            }}>GCash Number</p>

            {/* Phone input */}
            <div style={{
              borderRadius: '14px',
              border: `1.5px solid ${focused ? 'var(--maroon)' : '#EDE5E5'}`,
              display: 'flex', alignItems: 'center',
              background: focused ? '#FFF8F8' : '#FAFAFA',
              marginBottom: '8px',
              transition: 'all 0.2s ease',
              boxShadow: focused ? '0 0 0 3px rgba(139,0,0,0.08)' : 'none'
            }}>
              <div style={{
                padding: '13px 14px',
                fontSize: '20px',
                borderRight: `1.5px solid ${focused ? '#FFCDD2' : '#EDE5E5'}`,
                transition: 'border-color 0.2s'
              }}>🇵🇭</div>
              <input
                type="tel"
                placeholder="09XXXXXXXXX"
                value={phone}
                autoComplete="off"
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                style={{
                  flex: 1, padding: '13px 14px',
                  fontSize: '18px', fontWeight: '700',
                  letterSpacing: '2px',
                  background: 'transparent',
                  color: 'var(--text)'
                }}
              />
              {isValid && (
                <div style={{
                  padding: '0 14px',
                  color: '#22C55E',
                  fontSize: '20px'
                }}>✓</div>
              )}
            </div>

            {/* Progress bar */}
            <div style={{
              height: '3px', background: '#F0E8E8',
              borderRadius: '4px', marginBottom: '20px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${progress}%`,
                background: isValid ? '#22C55E' : 'var(--maroon)',
                borderRadius: '4px',
                transition: 'width 0.3s ease, background 0.3s ease'
              }}/>
            </div>

            {/* Warning box */}
            <div style={{
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: '12px',
              padding: '12px 14px',
              display: 'flex', gap: '10px',
              alignItems: 'flex-start',
              marginBottom: '20px'
            }}>
              <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>⚠️</span>
              <p style={{
                fontSize: '12px', color: '#92400E',
                lineHeight: '1.6', fontWeight: '500'
              }}>
                Use your <strong>real GCash number</strong> — your earnings will be
                transferred here after each completed transaction.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '12px',
                padding: '11px 14px',
                marginBottom: '16px',
                display: 'flex', gap: '8px', alignItems: 'center'
              }}>
                <span style={{ fontSize: '14px' }}>❌</span>
                <p style={{
                  color: '#DC2626', fontSize: '13px', fontWeight: '600'
                }}>{error}</p>
              </div>
            )}

            {/* Button */}
            <button
              onClick={handleSubmit}
              disabled={loading || !isValid}
              style={{
                width: '100%', padding: '16px',
                borderRadius: '14px',
                background: (!isValid || loading) ? '#F0E8E8' : 'var(--maroon)',
                color: (!isValid || loading) ? '#C0A8A8' : 'white',
                fontSize: '15px', fontWeight: '800',
                letterSpacing: '0.2px',
                boxShadow: (!isValid || loading) ? 'none' : 'var(--shadow-maroon)',
                transition: 'all 0.2s ease'
              }}
            >
              {loading ? '⏳ Setting up your profile...' : 'Complete Setup →'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}