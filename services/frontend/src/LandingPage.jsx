import React, { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Github, Cpu, Zap, Lock, Unlock, Terminal, GitBranch, Code, Shield, Sparkles } from 'lucide-react';

// Enhanced feature card with interactive effects
const EnhancedFeatureCard = ({ title, desc, delay, icon: Icon, gradient }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{ y: -8, transition: { type: "spring", stiffness: 300 } }}
            transition={{ duration: 0.6, delay, type: "spring" }}
            viewport={{ once: true, margin: "-50px" }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className="relative p-8 border border-glass-border/50 bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-xl rounded-2xl overflow-hidden group cursor-pointer"
            style={{
                boxShadow: isHovered
                    ? `0 20px 40px rgba(0, 243, 255, 0.15), 0 0 0 1px rgba(0, 243, 255, 0.1)`
                    : '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}
        >
            {/* Animated background gradient */}
            <motion.div
                animate={{
                    x: isHovered ? ['0%', '100%', '0%'] : '0%',
                    opacity: isHovered ? 0.3 : 0.1
                }}
                transition={{ duration: 3, repeat: isHovered ? Infinity : 0 }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-neon-blue/20 to-transparent"
            />

            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-neon-blue/30 -translate-x-3 -translate-y-3 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform"></div>
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-neon-purple/30 translate-x-3 translate-y-3 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform"></div>

            {/* Icon with glow effect */}
            <div className="relative mb-6">
                <div className={`w-14 h-14 rounded-xl ${gradient} flex items-center justify-center mb-4 relative overflow-hidden`}>
                    <motion.div
                        animate={{ rotate: isHovered ? 360 : 0 }}
                        transition={{ duration: 1, ease: "easeInOut" }}
                        className="absolute inset-0 opacity-20"
                        style={{
                            background: `conic-gradient(from 0deg, transparent, ${gradient.includes('blue') ? '#00f3ff' : '#8b5cf6'}, transparent)`
                        }}
                    />
                    <Icon className="w-7 h-7 text-white relative z-10" />
                </div>
                <motion.div
                    animate={{ scale: isHovered ? 1.2 : 1 }}
                    className="absolute -inset-4 blur-xl opacity-20 bg-current"
                />
            </div>

            <h3 className="text-2xl font-orbitron font-bold text-white mb-4 relative">
                {title}
                <motion.div
                    animate={{ width: isHovered ? '100%' : '40px' }}
                    className="h-0.5 bg-gradient-to-r from-neon-blue to-neon-purple mt-2"
                />
            </h3>

            <p className="text-slate-300/90 font-rajdhani leading-relaxed text-lg">
                {desc}
            </p>

            {/* Interactive indicator */}
            <motion.div
                animate={{ x: isHovered ? 8 : 0 }}
                className="absolute bottom-6 right-6 text-neon-blue opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <Zap className="w-5 h-5" />
            </motion.div>
        </motion.div>
    );
};

// Animated typing log with realistic cursor
const EnhancedLogStream = () => {
    const [currentLog, setCurrentLog] = useState(0);
    const logs = [
        { text: "INITIALIZING CORE SYSTEMS...", color: "text-neon-blue" },
        { text: "CONNECTING TO GITHUB API NODE...", color: "text-neon-green" },
        { text: "ANALYZING BRANCH TOPOLOGY...", color: "text-neon-purple" },
        { text: "DETECTING MERGE ANOMALIES...", color: "text-cyan-400" },
        { text: "RENDERING TIMELINE MATRIX...", color: "text-pink-400" },
        { text: "SYSTEM STATUS: OPTIMAL", color: "text-neon-green" },
        { text: "AWAITING USER INPUT...", color: "text-slate-400" },
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentLog((prev) => (prev + 1) % logs.length);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative p-6 border-2 border-glass-border/30 bg-black/60 backdrop-blur-lg rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/5 via-transparent to-neon-purple/5"></div>

            {/* Terminal header */}
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-glass-border/30">
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <span className="text-xs text-slate-400 font-mono ml-4">terminal@git-timeline:~</span>
            </div>

            <div className="space-y-3">
                {logs.map((log, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{
                            opacity: i <= currentLog ? 1 : 0.3,
                            x: 0,
                            scale: i === currentLog ? 1.02 : 1
                        }}
                        transition={{ delay: i * 0.1 }}
                        className={`flex items-center gap-3 font-mono text-sm ${log.color} ${i === currentLog ? 'font-bold' : ''}`}
                    >
                        <span className="text-slate-500 text-xs">[{String(i + 1).padStart(2, '0')}:00]</span>
                        <span className="text-slate-400">{'>'}</span>
                        {log.text}
                        {i === currentLog && (
                            <motion.span
                                animate={{ opacity: [1, 0] }}
                                transition={{ repeat: Infinity, duration: 0.8 }}
                                className="w-2 h-4 bg-current"
                            />
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Scan line effect */}
            <motion.div
                animate={{ y: ['0%', '100%'] }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-neon-blue to-transparent"
            />
        </div>
    );
};

// Particle background component
const ParticleBackground = () => {
    return (
        <div className="fixed inset-0 z-0 overflow-hidden">
            {[...Array(50)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-px h-px bg-neon-blue/20 rounded-full"
                    initial={{
                        x: Math.random() * 100 + 'vw',
                        y: Math.random() * 100 + 'vh',
                    }}
                    animate={{
                        x: ['0vw', '100vw', '0vw'],
                        y: ['0vh', '100vh', '0vh'],
                    }}
                    transition={{
                        duration: Math.random() * 20 + 10,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />
            ))}
        </div>
    );
};

// Simulated Timeline Demo Component


const EnhancedLandingPage = ({ onAuthSuccess }) => {
    const [isRegistering, setIsRegistering] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [activeSection, setActiveSection] = useState('hero');

    // Mouse parallax effects
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseX = useSpring(x, { stiffness: 100, damping: 30 });
    const mouseY = useSpring(y, { stiffness: 100, damping: 30 });

    // Parallax transforms
    const bgX = useTransform(mouseX, [-0.5, 0.5], ['-2%', '2%']);
    const bgY = useTransform(mouseY, [-0.5, 0.5], ['-2%', '2%']);
    const contentX = useTransform(mouseX, [-0.5, 0.5], ['-10px', '10px']);
    const contentY = useTransform(mouseY, [-0.5, 0.5], ['-10px', '10px']);

    const handleMouseMove = (e) => {
        const { clientX, clientY } = e;
        const targetX = (clientX / window.innerWidth) - 0.5;
        const targetY = (clientY / window.innerHeight) - 0.5;
        x.set(targetX);
        y.set(targetY);
    };

    // Scroll spy for navigation
    useEffect(() => {
        const handleScroll = () => {
            const sections = ['hero', 'features', 'about', 'auth'];
            const current = sections.find(section => {
                const element = document.getElementById(section);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    return rect.top <= 100 && rect.bottom >= 100;
                }
                return false;
            });
            if (current) setActiveSection(current);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleAuthSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const endpoint = isRegistering ? 'http://localhost:3001/register' : 'http://localhost:3001/login';
            const { data } = await axios.post(endpoint, { email, password });

            setSuccessMsg(isRegistering ? 'REGISTRATION COMPLETE' : 'ACCESS GRANTED');

            setTimeout(() => {
                if (isRegistering) {
                    axios.post('http://localhost:3001/login', { email, password })
                        .then(loginRes => onAuthSuccess(loginRes.data.token));
                } else {
                    onAuthSuccess(data.token);
                }
            }, 2000);

        } catch (err) {
            setError(err.response?.data?.error || 'Authentication Failed');
            setLoading(false);
        }
    };

    return (
        <div
            className="relative min-h-screen bg-hacker-black text-white overflow-x-hidden"
            onMouseMove={handleMouseMove}
        >
            <ParticleBackground />

            {/* Enhanced background with parallax */}
            <motion.div
                style={{ x: bgX, y: bgY }}
                className="fixed inset-0 z-0"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-purple-900/20"></div>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neon-blue/10 via-transparent to-transparent"></div>

                {/* Restored Video Background */}
                <div className="absolute inset-0 z-0 overflow-hidden opacity-40 mix-blend-screen pointer-events-none">
                    <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                        <source src="/vids/PixelArtAnimation.mp4" type="video/mp4" />
                    </video>
                </div>

                <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cdefs%3E%3Cpattern id=%22grid%22 width=%2260%22 height=%2260%22 patternUnits=%22userSpaceOnUse%22%3E%3Cpath d=%22M 60 0 L 0 0 0 60%22 fill=%22none%22 stroke=%22white%22 stroke-width=%220.5%22/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=%22100%25%22 height=%22100%25%22 fill=%22url(%23grid)%22/%3E%3C/svg%3E')]"></div>
            </motion.div>

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 p-6 backdrop-blur-lg border-b border-glass-border/30">
                <div className="container mx-auto flex items-center justify-between">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3"
                    >
                        <div className="w-10 h-10 bg-gradient-to-br from-neon-blue to-neon-purple rounded-lg flex items-center justify-center">
                            <GitBranch className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-orbitron font-bold">GIT TIMELINE</span>
                    </motion.div>

                    <div className="flex items-center gap-8">
                        {['features', 'about', 'auth'].map((section) => (
                            <button
                                key={section}
                                onClick={() => document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' })}
                                className={`text-sm font-rajdhani transition-all ${activeSection === section ? 'text-neon-blue' : 'text-slate-400 hover:text-white'}`}
                            >
                                {section.toUpperCase()}
                            </button>
                        ))}
                        <motion.button
                            whileHover={{ scale: 1.05, whileTap: 0.95 }}
                            onClick={() => document.getElementById('auth').scrollIntoView({ behavior: 'smooth' })}
                            className="px-6 py-2 bg-gradient-to-r from-neon-blue to-neon-purple rounded-lg font-orbitron text-sm"
                        >
                            LAUNCH APP
                        </motion.button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section id="hero" className="relative min-h-screen flex items-center justify-center pt-20">
                <motion.div
                    style={{ x: contentX, y: contentY }}
                    className="container mx-auto px-6 text-center"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-3 mb-8 px-4 py-2 rounded-full bg-glass-border/30 backdrop-blur-sm border border-glass-border"
                    >
                        <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
                        <span className="text-sm font-mono text-neon-green">SYSTEM ONLINE • v2.0</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-7xl md:text-9xl font-bold font-orbitron mb-8"
                    >
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-neon-blue to-neon-purple animate-gradient">
                            GIT TIMELINE
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-2xl md:text-3xl text-slate-300 max-w-3xl mx-auto mb-12 leading-relaxed"
                    >
                        Visualize your repository's evolution in <span className="text-neon-blue font-bold">4D</span>.
                        Understand complex branching with <span className="text-neon-purple font-bold">AI-powered</span> insights.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-col sm:flex-row gap-6 justify-center items-center"
                    >
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(0, 243, 255, 0.3)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => document.getElementById('auth').scrollIntoView({ behavior: 'smooth' })}
                            className="group relative px-12 py-4 bg-gradient-to-r from-neon-blue to-neon-purple rounded-xl overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-neon-blue to-neon-purple blur-xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                            <span className="relative font-orbitron font-bold text-lg tracking-wider">
                                START ANALYZING
                            </span>
                        </motion.button>


                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 max-w-4xl mx-auto"
                    >
                        {[
                            { label: 'Repositories Analyzed', value: '10K+' },
                            { label: 'Developers', value: '5K+' },
                            { label: 'Accuracy', value: '99.9%' },
                            { label: 'Processing Speed', value: '<1s' },
                        ].map((stat, i) => (
                            <div key={i} className="text-center">
                                <div className="text-4xl font-orbitron text-neon-blue mb-2">{stat.value}</div>
                                <div className="text-sm text-slate-400">{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>

                {/* Scroll indicator */}
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute bottom-10 flex flex-col items-center"
                >
                    <span className="text-sm font-mono text-neon-blue/70 mb-2">EXPLORE FEATURES</span>
                    <div className="w-px h-16 bg-gradient-to-b from-neon-blue via-neon-purple to-transparent"></div>
                </motion.div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-32 relative">
                <div className="container mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-20"
                    >
                        <h2 className="text-5xl md:text-6xl font-orbitron font-bold mb-6">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-neon-purple">
                                POWERFUL FEATURES
                            </span>
                        </h2>
                        <p className="text-xl text-slate-400 max-w-3xl mx-auto">
                            Everything you need to understand your repository's story
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
                        <EnhancedLogStream />

                        <div className="space-y-8">
                            <EnhancedFeatureCard
                                title="INTERACTIVE GRAPH"
                                desc="Visualize commit history with a dynamic, chronological graph. Track branches, merges, and tags effortlessly."
                                delay={0.1}
                                icon={GitBranch}
                                gradient="bg-gradient-to-br from-neon-blue/20 to-neon-purple/20"
                            />
                            <EnhancedFeatureCard
                                title="AI-POWERED INSIGHTS"
                                desc="Leverage local LLMs to analyze code changes, summarize commits, and answer queries about your repository."
                                delay={0.2}
                                icon={Cpu}
                                gradient="bg-gradient-to-br from-purple-500/20 to-pink-500/20"
                            />
                            <EnhancedFeatureCard
                                title="LIVE REPOSITORY SYNC"
                                desc="Connect seamlessly to your local Git repositories for instant, real-time analysis and visualization."
                                delay={0.3}
                                icon={Zap}
                                gradient="bg-gradient-to-br from-green-500/20 to-cyan-500/20"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="py-32 bg-black/50 relative">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-5xl font-orbitron font-bold mb-8">
                                Built for <span className="text-neon-blue">Developers</span>,
                                by <span className="text-neon-purple">Developers</span>
                            </h2>
                            <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                                Git Timeline started as a passion project to solve the pain of understanding complex git histories.
                                Now it's a powerful tool used by thousands of developers worldwide.
                            </p>

                            <div className="grid grid-cols-2 gap-6">
                                {[
                                    { icon: Shield, label: 'Enterprise Security', desc: 'End-to-end encryption' },
                                    { icon: Code, label: 'Open Source', desc: 'MIT Licensed' },
                                    { icon: Sparkles, label: 'AI Powered', desc: 'Smart insights' },
                                    { icon: Terminal, label: 'CLI Available', desc: 'Developer friendly' },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 flex items-center justify-center">
                                            <item.icon className="w-6 h-6 text-neon-blue" />
                                        </div>
                                        <div>
                                            <div className="font-semibold">{item.label}</div>
                                            <div className="text-sm text-slate-400">{item.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute -inset-4 bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 rounded-3xl blur-2xl"></div>
                            <div className="relative p-8 bg-black/80 backdrop-blur-xl rounded-2xl border border-glass-border/50">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center">
                                            <span className="font-orbitron font-bold">EM</span>
                                        </div>
                                        <div>
                                            <div className="font-bold">Emre M.</div>
                                            <div className="text-sm text-slate-400">Lead Developer</div>
                                        </div>
                                    </div>
                                    <Github className="w-6 h-6 text-slate-400" />
                                </div>
                                <p className="text-slate-300 italic mb-6">
                                    "Our goal was to create something that not only looks incredible but actually makes developers' lives easier.
                                    Git Timeline is the result of countless hours of research and development."
                                </p>
                                <div className="flex gap-4">
                                    <a href="#" className="flex-1 py-3 bg-white/5 rounded-lg text-center hover:bg-white/10 transition-colors">
                                        GitHub
                                    </a>
                                    <a href="#" className="flex-1 py-3 bg-gradient-to-r from-neon-blue to-neon-purple rounded-lg text-center font-semibold">
                                        Documentation
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Auth Section */}
            <section id="auth" className="min-h-screen flex items-center justify-center py-20">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="w-full max-w-md mx-6"
                >
                    <div className="relative">
                        {/* Glowing orb effect */}
                        <div className="absolute -inset-4 bg-gradient-to-r from-neon-blue/30 via-neon-purple/30 to-neon-blue/30 rounded-3xl blur-2xl"></div>

                        <div className="relative p-10 bg-black/90 backdrop-blur-xl rounded-2xl border border-glass-border/50">
                            {/* Header */}
                            <div className="text-center mb-10">
                                <motion.div
                                    animate={{ rotate: [0, 360] }}
                                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                    className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-neon-blue via-neon-purple to-neon-blue bg-[length:400%] animate-gradient"
                                >
                                    <div className="w-full h-full rounded-full bg-black/80 flex items-center justify-center">
                                        {isRegistering ? (
                                            <Lock className="w-8 h-8 text-neon-green" />
                                        ) : (
                                            <Unlock className="w-8 h-8 text-neon-blue" />
                                        )}
                                    </div>
                                </motion.div>

                                <h2 className="text-3xl font-orbitron font-bold mb-2">
                                    {isRegistering ? 'CREATE ACCOUNT' : 'WELCOME BACK'}
                                </h2>
                                <p className="text-slate-400">
                                    {isRegistering ? 'Join thousands of developers' : 'Continue your journey'}
                                </p>
                            </div>

                            {/* Toggle */}
                            <div className="flex bg-white/5 rounded-xl p-1 mb-8">
                                {['Login', 'Register'].map((mode, i) => (
                                    <button
                                        key={mode}
                                        onClick={() => {
                                            setIsRegistering(mode === 'Register');
                                            setError('');
                                            setSuccessMsg('');
                                        }}
                                        className={`flex-1 py-3 rounded-lg font-semibold transition-all ${(mode === 'Register' && isRegistering) || (mode === 'Login' && !isRegistering)
                                            ? 'bg-gradient-to-r from-neon-blue to-neon-purple'
                                            : 'hover:bg-white/5'
                                            }`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>

                            {/* Form */}
                            <form onSubmit={handleAuthSubmit} className="space-y-6">
                                <AnimatePresence mode="wait">
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                                <span className="text-sm">{error}</span>
                                            </div>
                                        </motion.div>
                                    )}

                                    {successMsg && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-4 bg-green-500/10 border border-neon-green/30 rounded-xl"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
                                                <span className="text-sm font-mono">{successMsg}</span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {!successMsg && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-sm text-slate-400">Email</label>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full p-4 bg-white/5 border border-glass-border/50 rounded-xl focus:outline-none focus:border-neon-blue transition-colors"
                                                placeholder="developer@example.com"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm text-slate-400">Password</label>
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full p-4 bg-white/5 border border-glass-border/50 rounded-xl focus:outline-none focus:border-neon-blue transition-colors"
                                                placeholder="••••••••"
                                                required
                                            />
                                        </div>

                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            type="submit"
                                            disabled={loading}
                                            className="w-full py-4 bg-gradient-to-r from-neon-blue to-neon-purple rounded-xl font-semibold relative overflow-hidden group"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-neon-blue to-neon-purple blur-xl group-hover:opacity-100 opacity-0 transition-opacity"></div>
                                            <span className="relative">
                                                {loading ? 'PROCESSING...' : (isRegistering ? 'CREATE ACCOUNT' : 'SIGN IN')}
                                            </span>
                                        </motion.button>
                                    </>
                                )}
                            </form>

                            <div className="mt-8 pt-8 border-t border-glass-border/30 text-center">
                                <p className="text-sm text-slate-500">
                                    By continuing, you agree to our Terms and Privacy Policy
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-glass-border/30">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-neon-blue to-neon-purple rounded-lg flex items-center justify-center">
                                <GitBranch className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <div className="font-orbitron font-bold">GIT TIMELINE</div>
                                <div className="text-sm text-slate-400">Visualize. Analyze. Understand.</div>
                            </div>
                        </div>

                        <div className="flex gap-8">
                            {['Twitter', 'GitHub', 'Discord', 'Blog'].map((item) => (
                                <a key={item} href="#" className="text-slate-400 hover:text-white transition-colors">
                                    {item}
                                </a>
                            ))}
                        </div>

                        <div className="text-sm text-slate-500">
                            © 2024 Git Timeline. All rights reserved.
                        </div>
                    </div>
                </div>
            </footer>

            {/* CRT Effect */}
            <div className="fixed inset-0 pointer-events-none z-50">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20"></div>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.03)_50%)] bg-[length:100%_4px]"></div>
            </div>


        </div>
    );
};

export default EnhancedLandingPage;