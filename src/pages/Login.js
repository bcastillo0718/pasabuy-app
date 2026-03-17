import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

import logoIcon from '../logo-icon.png';
import logoFull from '../logo.png';

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
        position: 'absolute', top: '-60px', left: '50%',
        transform: 'translateX(-50%)',
        width: '320px', height: '320px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,229,102,0.18) 0%, transparent 65%)',
        pointerEvents: 'none'
      }}/>
      <div style={{
        position: 'absolute', bottom: '280px', right: '-60px',
        width: '200px', height: '200px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(46,158,79,0.2) 0%, transparent 65%)',
        pointerEvents: 'none'
      }}/>
      <div style={{
        position: 'absolute', bottom: '250px', left: '-60px',
        width: '180px', height: '180px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 65%)',
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
        gap: '0'
      }}>
        {/* Logo */}
        <div className="fade-up" style={{
          width: '96px', height: '96px',
          background: 'var(--yellow)',
          borderRadius: '30px',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center',
          fontSize: '48px',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-yellow)',
          animation: 'float 3.5s ease-in-out infinite',
}}>
  <img src={logoIcon} alt="PasaBuy" style={{ width: '80px', height: '80px', borderRadius: '20px' }}/>
</div>

        <h1 className="fade-up-1" style={{
          display: 'none'
}}>PasaBuy</h1>

        <p className="fade-up-2" style={{
          color: 'rgba(255,255,255,0.6)',
          fontSize: '15px',
          textAlign: 'center',
          lineHeight: '1.7',
          maxWidth: '220px',
          marginBottom: '36px'
        }}>Campus errand sharing made easy 🎓</p>

        {/* Feature chips */}
        <div className="fade-up-3" style={{
          display: 'flex', gap: '8px', flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {['🏃 Post Errands', '💸 Earn Extra', '🤝 Help Others'].map((t, i) => (
            <span key={i} style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.88)',
              padding: '7px 16px',
              borderRadius: '100px',
              fontSize: '12px',
              fontWeight: '600'
            }}>{t}</span>
          ))}
        </div>
      </div>

      {/* White card */}
      <div className="fade-up-4" style={{
        background: 'white',
        borderRadius: '32px 32px 0 0',
        padding: '32px 24px 48px',
        boxShadow: '0 -4px 48px rgba(0,0,0,0.2)'
      }}>
        {/* Handle bar */}
        <div style={{
          width: '36px', height: '4px',
          background: '#E8E0E0',
          borderRadius: '4px',
          margin: '0 auto 28px'
        }}/>

        <h2 style={{
          fontFamily: 'Raleway, sans-serif',
          fontSize: '26px', fontWeight: '800',
          color: 'var(--text)', marginBottom: '4px'
        }}>Welcome! 👋</h2>
        <p style={{
          color: 'var(--text-soft)',
          fontSize: '14px', marginBottom: '24px'
        }}>Sign in to start buying and earning on campus</p>

        {/* Google button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: '100%', padding: '16px',
            borderRadius: '16px',
            background: loading ? '#F5F0F0' : 'white',
            border: '2px solid #EDE5E5',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '12px',
            fontSize: '15px', fontWeight: '700',
            color: '#1A1214',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            marginBottom: '16px',
            position: 'relative', overflow: 'hidden'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--maroon)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(139,0,0,0.12)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#EDE5E5';
            e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
          }}
        >
          {!loading && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.9) 50%, transparent 100%)',
              animation: 'shimmer 2.5s infinite',
              pointerEvents: 'none'
            }}/>
          )}
          <img src="https://www.google.com/favicon.ico"
            alt="Google" style={{ width: '20px', height: '20px' }}/>
          {loading ? 'Signing you in...' : 'Continue with Google'}
        </button>

        {/* UP notice */}
        <div style={{
          background: 'linear-gradient(135deg, #FFF9E8, #FFF3CC)',
          border: '1.5px solid #FFE082',
          borderRadius: '16px',
          padding: '14px 16px',
          display: 'flex', gap: '12px', alignItems: 'center'
        }}>
          <div style={{
            width: '38px', height: '38px',
            background: 'var(--maroon)',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px', flexShrink: 0
          }}>🎓</div>
          <p style={{
            fontSize: '12px', color: '#78350F',
            lineHeight: '1.6', fontWeight: '500'
          }}>
            Connect, help & earn with your fellow students on campus!
          </p>
        </div>

        <p style={{
          color: '#C0B4B4', fontSize: '11px',
          textAlign: 'center', marginTop: '20px'
        }}>© 2025 PasaBuy · Campus Errands Made Easy 💚</p>
      </div>
    </div>
  );
}