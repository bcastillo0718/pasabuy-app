import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import logoIcon from '../logo-icon.png';

export default function Login() {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #6B0000 0%, #8B0000 45%, #1A3B20 100%)',
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '480px',
      margin: '0 auto',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Glow blobs */}
      <div style={{
        position: 'absolute', top: '-80px', left: '50%',
        transform: 'translateX(-50%)',
        width: '360px', height: '360px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,229,102,0.15) 0%, transparent 65%)',
        pointerEvents: 'none'
      }}/>
      <div style={{
        position: 'absolute', bottom: '300px', right: '-80px',
        width: '220px', height: '220px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(46,158,79,0.18) 0%, transparent 65%)',
        pointerEvents: 'none'
      }}/>

      {/* Hero */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px 32px 40px',
      }}>
        {/* Logo */}
        <div className="fade-up" style={{
          width: '100px', height: '100px',
          background: 'var(--yellow)',
          borderRadius: '32px',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          boxShadow: '0 20px 60px rgba(255,229,102,0.3), 0 8px 24px rgba(0,0,0,0.2)',
          animation: 'float 3.5s ease-in-out infinite',
        }}>
          <img src={logoIcon} alt="PasaBuy"
            style={{ width: '72px', height: '72px', borderRadius: '20px' }}/>
        </div>

        <h1 className="fade-up-1" style={{
          fontFamily: 'Raleway, sans-serif',
          color: 'white',
          fontSize: '32px',
          fontWeight: '800',
          marginBottom: '8px',
          letterSpacing: '-0.5px'
        }}>PasaBuy App</h1>

        <p className="fade-up-2" style={{
          color: 'rgba(255,255,255,0.55)',
          fontSize: '14px',
          textAlign: 'center',
          lineHeight: '1.7',
          maxWidth: '200px',
          marginBottom: '32px'
        }}>Turn every errand into earnings 💸</p>

        {/* Feature chips */}
        <div className="fade-up-3" style={{
          display: 'flex', gap: '8px', flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {['🏃 Post Errands', '💸 Earn Extra', '🤝 Help Others'].map((t, i) => (
            <span key={i} style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.8)',
              padding: '6px 14px',
              borderRadius: '100px',
              fontSize: '12px',
              fontWeight: '600',
              letterSpacing: '0.2px'
            }}>{t}</span>
          ))}
        </div>
      </div>

      {/* White card */}
      <div className="fade-up-4" style={{
        background: 'white',
        borderRadius: '32px 32px 0 0',
        padding: '28px 24px 44px',
        boxShadow: '0 -8px 48px rgba(0,0,0,0.18)'
      }}>
        {/* Handle bar */}
        <div style={{
          width: '32px', height: '4px',
          background: '#EDE5E5',
          borderRadius: '4px',
          margin: '0 auto 24px'
        }}/>

        <h2 style={{
          fontFamily: 'Raleway, sans-serif',
          fontSize: '24px', fontWeight: '800',
          color: 'var(--text)', marginBottom: '4px',
          letterSpacing: '-0.3px'
        }}>Welcome back! 👋</h2>
        <p style={{
          color: 'var(--text-soft)',
          fontSize: '13px', marginBottom: '24px',
          lineHeight: '1.6'
        }}>Sign in to start accepting and earning through PasaBuy</p>

        {/* Google button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: '100%', padding: '15px',
            borderRadius: '14px',
            background: loading ? '#FAFAFA' : 'white',
            border: '1.5px solid #EDE5E5',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '10px',
            fontSize: '14px', fontWeight: '700',
            color: '#1A1214',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            marginBottom: '16px',
            position: 'relative', overflow: 'hidden'
          }}
        >
          {!loading && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)',
              animation: 'shimmer 2.5s infinite',
              pointerEvents: 'none'
            }}/>
          )}
          <img src="https://www.google.com/favicon.ico"
            alt="Google" style={{ width: '18px', height: '18px' }}/>
          {loading ? '⏳ Signing you in...' : 'Continue with Google'}
        </button>

        {/* Notice */}
        <div style={{
          background: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: '14px',
          padding: '14px 16px',
          display: 'flex', gap: '12px', alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'var(--maroon)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px', flexShrink: 0
          }}>🎓</div>
          <p style={{
            fontSize: '12px', color: '#78350F',
            lineHeight: '1.6', fontWeight: '500'
          }}>
            Connect, help & let's earn together!
          </p>
        </div>

        <p style={{
          color: '#C0B4B4', fontSize: '11px',
          textAlign: 'center',
          letterSpacing: '0.2px'
        }}>© 2025 PasaBuy · Campus Errands Made Easy 💚</p>
      </div>
    </div>
  );
}