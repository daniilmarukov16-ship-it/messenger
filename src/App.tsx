import React, { useState, useEffect } from 'react';
import { Auth } from './components/Auth';
import { Messenger } from './components/Messenger';
import { getCurrentUser } from './supabase';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser().then(user => {
      setUser(user);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={setUser} />;
  }

  return <Messenger user={user} onLogout={() => setUser(null)} />;
}

export default App;
