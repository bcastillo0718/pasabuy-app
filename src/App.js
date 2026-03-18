import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';

import logoIcon from './logo-icon.png';

// Pages
import Login from './pages/Login';
import ProfileSetup from './pages/ProfileSetup';

import Home from './pages/Home';
import PostEntry from './pages/PostEntry';
import EntryDetail from './pages/EntryDetail';
import MyRequests from './pages/MyRequests';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';

const ADMIN_EMAIL = 'bucastillo@up.edu.ph'; // 🔴 CHANGE THIS TO YOUR EMAIL

function App() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUser(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUser(session.user.id);
      else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUser = async (id) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    setUser(data);
    setLoading(false);
  };

if (loading) return (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: 'linear-gradient(160deg, #6B0000 0%, #8B0000 45%, #1A3B20 100%)',
    maxWidth: '480px',
    margin: '0 auto',
    gap: '20px'
  }}>
    {/* Pulse rings */}
    <div style={{ position: 'relative', display: 'flex',
      alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        position: 'absolute',
        width: '90px', height: '90px',
        borderRadius: '50%',
        background: 'rgba(255,229,102,0.15)',
        animation: 'pulse 1.8s ease-in-out infinite'
      }}/>
      <div style={{
        position: 'absolute',
        width: '110px', height: '110px',
        borderRadius: '50%',
        background: 'rgba(255,229,102,0.08)',
        animation: 'pulse 1.8s ease-in-out infinite 0.3s'
      }}/>
      <div style={{
        position: 'absolute',
        width: '130px', height: '130px',
        borderRadius: '50%',
        background: 'rgba(255,229,102,0.04)',
        animation: 'pulse 1.8s ease-in-out infinite 0.6s'
      }}/>

      {/* Spinning ring */}
      <div style={{
        position: 'absolute',
        width: '80px', height: '80px',
        borderRadius: '50%',
        border: '3px solid transparent',
        borderTopColor: 'var(--yellow)',
        borderRightColor: 'rgba(255,229,102,0.3)',
        animation: 'spin 1s linear infinite'
      }}/>

      {/* Logo */}
      <div style={{
        width: '60px', height: '60px',
        background: 'var(--yellow)',
        borderRadius: '18px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 24px rgba(255,229,102,0.3)'
      }}>
        <img src={logoIcon} alt="PasaBuy"
          style={{ width: '46px', height: '46px', borderRadius: '12px' }}/>
      </div>
    </div>

    {/* Text */}
    <div style={{ textAlign: 'center' }}>
      <p style={{
        fontFamily: 'Raleway, sans-serif',
        color: 'var(--yellow)',
        fontSize: '20px', fontWeight: '800',
        letterSpacing: '-0.3px',
        animation: 'pulse 1.8s ease-in-out infinite'
      }}>PasaBuy</p>
      <p style={{
        color: 'rgba(255,255,255,0.4)',
        fontSize: '12px', marginTop: '4px',
        fontWeight: '500'
      }}>Campus errands made easy</p>
    </div>
  </div>
);

  return (
    <Router>
      <Routes>
        {/* Not logged in */}
        {!session && <Route path="*" element={<Login />} />}

        {/* Logged in but no profile yet */}
        {session && !user && (
          <Route path="*" element={
            <ProfileSetup
              session={session}
              onComplete={(newUser) => setUser(newUser)}
            />}
          />
        )}

        {/* Logged in, has profile, is admin */}
        {session && user && user.email === ADMIN_EMAIL && (
          <Route path="*" element={<AdminPanel user={user} />} />
        )}

        {/* Logged in, active member, regular user - membership disabled for trial */}
{session && user && user.email !== ADMIN_EMAIL && (
          <>
            <Route path="/" element={<Home user={user} />} />
            <Route path="/post-entry" element={<PostEntry user={user} />} />
            <Route path="/entry/:id" element={<EntryDetail user={user} />} />
            <Route path="/my-requests" element={<MyRequests user={user} />} />
            <Route path="/chat/:requestId" element={<Chat user={user} />} />
            <Route path="/profile" element={
              <Profile
                user={user}
                onUpdate={(updatedUser) => setUser(updatedUser)}
              />}
            />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;