import React, { useState } from 'react';
import { motion } from 'framer-motion';

const Header = ({ onViewChange, isLoggedIn, onLogout }) => {
    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="fixed top-0 left-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-glass-border px-6 py-4 flex justify-between items-center"
        >
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => onViewChange('landing')}>
                <div className="w-2 h-8 bg-neon-blue animate-pulse"></div>
                <h1 className="text-2xl font-orbitron font-bold text-white tracking-widest hover:text-neon-blue transition-colors">
                    GIT TIMELINE
                </h1>
            </div>

            <nav className="flex gap-6 font-rajdhani font-bold text-lg">
                {isLoggedIn ? (
                    <>
                        <button onClick={() => onViewChange('dashboard')} className="text-slate-300 hover:text-neon-green transition-colors">DASHBOARD</button>
                        <button onClick={onLogout} className="text-slate-300 hover:text-red-500 transition-colors">LOGOUT</button>
                    </>
                ) : (
                    <>
                        {/* Scroll to auth or switch view */}
                        <button
                            onClick={() => {
                                // If on landing, scroll to bottom
                                const authSection = document.getElementById('auth-section');
                                if (authSection) authSection.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="text-slate-300 hover:text-neon-blue transition-colors relative group"
                        >
                            LOGIN
                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-neon-blue transition-all group-hover:w-full"></span>
                        </button>
                        <button
                            onClick={() => {
                                const authSection = document.getElementById('auth-section');
                                if (authSection) authSection.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="text-slate-300 hover:text-neon-purple transition-colors relative group"
                        >
                            REGISTER
                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-neon-purple transition-all group-hover:w-full"></span>
                        </button>
                    </>
                )}
            </nav>
        </motion.header>
    );
};

export default Header;
