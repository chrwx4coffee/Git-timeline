import React, { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useScroll, useInView } from 'framer-motion';
import axios from 'axios';

// Reusable animated feature card
const FeatureCard = ({ title, desc, delay }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05, borderColor: '#00f3ff' }}
            className="p-6 border border-glass-border bg-black/40 backdrop-blur-sm rounded-none relative group overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-neon-blue/20 to-transparent transform rotate-45 translate-x-10 -translate-y-10 group-hover:translate-x-5 group-hover:-translate-y-5 transition-transform"></div>
            <h3 className="text-xl font-orbitron font-bold text-neon-blue mb-2">{title}</h3>
            <p className="text-slate-400 font-rajdhani leading-relaxed">{desc}</p>
            <div className="mt-4 w-full h-0.5 bg-slate-800 relative overflow-hidden">
                <div className="absolute top-0 left-0 h-full w-1/3 bg-neon-purple animate-[shimmer_2s_infinite]"></div>
            </div>
        </motion.div>
    );
};

// Typing Log Component
const LogStream = () => {
    const logs = [
        "INITIALIZING CORE SYSTEMS...",
        "CONNECTING TO GITHUB API NODE...",
        "ANALYZING BRANCH TOPOLOGY...",
        "DETECTING MERGE ANOMALIES...",
        "RENDERING TIMELINE MATRIX...",
        "SYSTEM OPTIMAL.",
        "AWAITING INPUT..."
    ];
    return (
        <div className="font-mono text-xs text-neon-green/70 space-y-1 p-4 border-l-2 border-neon-green/30 bg-black/80 h-48 overflow-hidden relative">
            {logs.map((log, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.5 }}
                >
                    <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span> {'>'} {log}
                </motion.div>
            ))}
            <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-black to-transparent"></div>
        </div>
    );
};

const LandingPage = ({ onAuthSuccess }) => {
    // Auth State
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const handleAuthSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const endpoint = isRegistering ? 'http://localhost:3001/register' : 'http://localhost:3001/login';
            const { data } = await axios.post(endpoint, { email, password });

            // Show success message before redirecting
            setSuccessMsg(isRegistering ? 'REGISTRATION COMPLETE. INITIALIZING SESSION...' : 'ACCESS GRANTED. LOADING DASHBOARD...');

            setTimeout(async () => {
                if (isRegistering) {
                    const loginRes = await axios.post('http://localhost:3001/login', { email, password });
                    onAuthSuccess(loginRes.data.token);
                } else {
                    onAuthSuccess(data.token);
                }
            }, 1500);

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Authentication Failed. Check credentials.');
            setLoading(false);
        }
    };

    // Mouse movement state
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Smooth spring physics for mouse movement
    const mouseX = useSpring(x, { stiffness: 50, damping: 20 });
    const mouseY = useSpring(y, { stiffness: 50, damping: 20 });

    const handleMouseMove = (e) => {
        const { clientX, clientY } = e;
        const targetX = (clientX / window.innerWidth) - 0.5;
        const targetY = (clientY / window.innerHeight) - 0.5;
        x.set(targetX);
        y.set(targetY);
    };

    // Parallax Transforms
    const bgX = useTransform(mouseX, [-0.5, 0.5], [20, -20]);
    const bgY = useTransform(mouseY, [-0.5, 0.5], [20, -20]);
    const textX = useTransform(mouseX, [-0.5, 0.5], [-30, 30]);
    const textY = useTransform(mouseY, [-0.5, 0.5], [-30, 30]);

    // Glitch effect loop
    const [glitch, setGlitch] = useState(false);
    useEffect(() => {
        const interval = setInterval(() => {
            setGlitch(true);
            setTimeout(() => setGlitch(false), 200);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div
            className="relative w-full min-h-screen overflow-x-hidden bg-hacker-black text-white font-rajdhani selection:bg-neon-purple selection:text-white"
            onMouseMove={handleMouseMove}
        >
            {/* Background Video Layer */}
            <motion.div
                style={{ x: bgX, y: bgY, scale: 1.1 }}
                className="fixed top-0 left-0 w-full h-full z-0 overflow-hidden opacity-50 pointer-events-none"
            >
                <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                    <source src="/vids/PixelArtAnimation.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-hacker-black/60 to-hacker-black"></div>
                <div className="absolute inset-0 bg-[url('/grid.png')] opacity-10 bg-repeat"></div>
            </motion.div>

            {/* CRT Scanline Overlay */}
            <div className="fixed inset-0 z-50 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none"></div>

            {/* HERO SECTION */}
            <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 text-center">
                <motion.div style={{ x: textX, y: textY }}>
                    <div className="mb-4 flex items-center justify-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                        <span className="text-neon-blue font-mono text-sm tracking-widest">SYSTEM ONLINE</span>
                    </div>

                    <h1 className={`text-6xl md:text-9xl font-black font-orbitron tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-neon-blue to-neon-purple drop-shadow-[0_0_20px_rgba(0,243,255,0.3)] ${glitch ? 'translate-x-[2px] skew-x-12 opacity-80' : ''}`}>
                        GIT TIMELINE
                    </h1>

                    <p className="mt-8 max-w-2xl mx-auto text-xl md:text-2xl text-slate-300 font-light tracking-wide leading-relaxed">
                        Decode your repository's DNA. <br />
                        <span className="text-neon-green font-bold">Visualize.</span> <span className="text-neon-purple font-bold">Analyze.</span> <span className="text-neon-blue font-bold">Understand.</span>
                    </p>

                    <div className="mt-12">
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(0, 243, 255, 0.4)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                document.getElementById('auth-section').scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="group relative px-10 py-5 bg-black border border-neon-blue overflow-hidden transition-all duration-300"
                        >
                            <div className="absolute inset-0 w-0 bg-neon-blue/20 transition-all duration-300 ease-out group-hover:w-full"></div>
                            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-neon-blue"></div>
                            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-neon-blue"></div>
                            <span className="relative text-neon-blue font-orbitron font-bold tracking-[0.2em] group-hover:text-white">INITIALIZE PROTOCOL</span>
                        </motion.button>
                    </div>
                </motion.div>

                {/* Scroll Indicator */}
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute bottom-10 flex flex-col items-center gap-2 opacity-50"
                >
                    <span className="text-xs font-mono tracking-widest text-neon-blue">SCROLL TO DECRYPT</span>
                    <div className="w-px h-12 bg-gradient-to-b from-neon-blue to-transparent"></div>
                </motion.div>
            </section>

            {/* FEATURES SECTION */}
            <section id="features" className="relative z-10 py-32 bg-hacker-black/80 backdrop-blur-sm border-t border-glass-border">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row gap-16 items-center">
                        <div className="w-full md:w-1/2 space-y-8">
                            <motion.h2
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.7 }}
                                className="text-4xl md:text-5xl font-orbitron font-bold text-white"
                            >
                                SYSTEM CAPABILITIES
                            </motion.h2>
                            <div className="h-1 w-24 bg-neon-purple"></div>

                            <LogStream />
                        </div>

                        <div className="w-full md:w-1/2 grid gap-6">
                            <FeatureCard
                                title="CHRONO-VISUALIZATION"
                                desc="Transform linear git logs into an interactive 4-dimensional timeline matrix."
                                delay={0.2}
                            />
                            <FeatureCard
                                title="BRANCH DIVERGENCE"
                                desc="Algorithmic detection of branch creation, merges, and stale feature vectors."
                                delay={0.4}
                            />
                            <FeatureCard
                                title="COMMIT VELOCITY"
                                desc="Real-time heatmap analysis of development intensity and author contribution vectors."
                                delay={0.6}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* DATA SECTION (Visual Filler) */}
            <section className="relative z-10 py-20 overflow-hidden border-t border-glass-border bg-black/50">
                <div className="flex gap-8 animate-[marquee_20s_linear_infinite] opacity-30 font-mono text-4xl text-transparent bg-clip-text bg-gradient-to-b from-slate-700 to-slate-900 whitespace-nowrap">
                    GIT_INIT_SUCCESS COMMIT_HASH_xF72A MERGE_REQUEST_APPROVED BRANCH_DELETED ORIGIN_MASTER_SYNC PUSH_FORCE_DETECTED REBASE_COMPLETE STASH_POP
                    GIT_INIT_SUCCESS COMMIT_HASH_xF72A MERGE_REQUEST_APPROVED BRANCH_DELETED ORIGIN_MASTER_SYNC PUSH_FORCE_DETECTED REBASE_COMPLETE STASH_POP
                </div>
            </section>

            {/* AUTH SECTION */}
            <div id="auth-section" className="relative z-20 min-h-screen flex flex-col items-center justify-center bg-black">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neon-blue/10 via-black to-black opacity-50"></div>

                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="glass-panel p-10 w-full max-w-md relative border-t border-b border-neon-blue/40 shadow-[0_0_80px_rgba(0,243,255,0.1)] backdrop-blur-xl"
                >
                    {/* Decorative Corner Makers */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-neon-blue"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-neon-blue"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-neon-blue"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-neon-blue"></div>

                    <h2 className="text-3xl font-orbitron text-center mb-1 text-white tracking-[0.2em] relative">
                        {isRegistering ? 'NEW USER REGISTRY' : 'ACCESS TERMINAL'}
                    </h2>
                    <p className="text-center text-xs text-neon-blue mb-8 font-mono tracking-widest">SECURE CONNECTION ESTABLISHED</p>

                    <div className="flex gap-4 mb-8">
                        <button
                            type="button"
                            className={`flex-1 py-2 font-bold tracking-wider transition-all ${!isRegistering ? 'text-neon-blue border-b-2 border-neon-blue bg-neon-blue/5' : 'text-slate-500 border-b-2 border-transparent hover:text-white'}`}
                            onClick={() => { setIsRegistering(false); setError(''); setSuccessMsg(''); }}
                        >
                            LOGIN
                        </button>
                        <button
                            type="button"
                            className={`flex-1 py-2 font-bold tracking-wider transition-all ${isRegistering ? 'text-neon-blue border-b-2 border-neon-blue bg-neon-blue/5' : 'text-slate-500 border-b-2 border-transparent hover:text-white'}`}
                            onClick={() => { setIsRegistering(true); setError(''); setSuccessMsg(''); }}
                        >
                            REGISTER
                        </button>
                    </div>

                    <form className="space-y-6" onSubmit={handleAuthSubmit}>
                        {error && (
                            <div className="p-3 bg-red-500/20 border border-red-500 text-red-400 text-xs font-mono text-center animate-pulse">
                                [ERROR]: {error}
                            </div>
                        )}
                        {successMsg && (
                            <div className="p-3 bg-green-500/20 border border-neon-green text-neon-green text-xs font-mono text-center animate-pulse">
                                [SUCCESS]: {successMsg}
                            </div>
                        )}

                        {!successMsg && (
                            <>
                                <div className="relative group">
                                    <label className="text-[10px] text-neon-blue font-mono mb-1 block">EMAIL ADDRESS</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-black/60 border border-slate-700 p-3 text-white focus:outline-none focus:border-neon-blue transition-colors font-rajdhani text-lg"
                                        required
                                    />
                                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-neon-blue transition-all duration-300 group-focus-within:w-full"></div>
                                </div>
                                <div className="relative group">
                                    <label className="text-[10px] text-neon-blue font-mono mb-1 block">SECURITY KEY</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-black/60 border border-slate-700 p-3 text-white focus:outline-none focus:border-neon-blue transition-colors font-rajdhani text-lg font-bold tracking-widest"
                                        required
                                    />
                                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-neon-blue transition-all duration-300 group-focus-within:w-full"></div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full py-4 bg-neon-blue/20 border border-neon-blue text-neon-blue hover:bg-neon-blue hover:text-black font-bold transition-all uppercase tracking-[0.3em] font-orbitron text-sm relative overflow-hidden group ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <span className="relative z-10">{loading ? 'PROCESSING...' : (isRegistering ? 'INITIALIZE ACCOUNT' : 'AUTHENTICATE')}</span>
                                    {!loading && <div className="absolute inset-0 bg-neon-blue transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0"></div>}
                                </button>
                            </>
                        )}
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-[10px] text-slate-600 font-mono">ENCRYPTION: AES-256 // SERVER: US-EAST-1</p>
                    </div>
                </motion.div>
            </div>

            {/* FOOTER */}
            <footer className="relative z-20 py-12 bg-black text-center border-t border-glass-border">
                <div className="flex justify-center items-center gap-2 mb-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-neon-green font-mono text-xs">ALL SYSTEMS GO</span>
                </div>
                <p className="text-slate-600 text-xs font-mono">
                    GIT TIMELINE // V1.0.0 // DESIGNED FOR DEVELOPERS
                </p>
            </footer>
        </div>
    );
};

export default LandingPage;
