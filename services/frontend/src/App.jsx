import React, { useState, useEffect } from 'react';
import LandingPage from './LandingPage';
import RepoVisualizer from './RepoVisualizer';
import UserDashboard from './UserDashboard';
import Header from './Header';

const App = () => {
    const [view, setView] = useState('landing');
    const [token, setToken] = useState(localStorage.getItem('token'));

    useEffect(() => {
        if (token) {
            setView('dashboard');
        } else {
            setView('landing');
        }
    }, [token]);

    const handleLogout = () => {
        setToken(null);
        localStorage.removeItem('token');
        setView('landing');
    };

    const handleAuthSuccess = (newToken) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setView('dashboard');
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200">
            <Header
                onViewChange={setView}
                isLoggedIn={!!token}
                onLogout={handleLogout}
            />

            <main>
                {view === 'landing' && (
                    <LandingPage onAuthSuccess={handleAuthSuccess} />
                )}

                {view === 'dashboard' && (
                    <UserDashboard />
                )}

                {view === 'visualizer' && (
                    <RepoVisualizer />
                )}
            </main>
        </div>
    );
};

export default App;
