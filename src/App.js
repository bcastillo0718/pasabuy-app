import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';

// Pages
import Login from './pages/Login';
import ProfileSetup from './pages/ProfileSetup';
import Membership from './pages/Membership';
import Home from './pages/Home';
import PostEntry from './pages/PostEntry';
import EntryDetail from './pages/EntryDetail';
import MyRequests from './pages/MyRequests';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';

const ADMIN_EMAIL = 'automathic.apparel@gmail.com'; // 🔴 CHANGE THIS TO YOUR EMAIL

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
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'var(--maroon)'
    }}>
      <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
        PasaBuy 
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