import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import TimelineGraph from './TimelineGraph';

const Dashboard = () => {
    const [repoUrl, setRepoUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(''); // 'analyzing', 'generating', 'ready'
    const [timelineData, setTimelineData] = useState([]);
    const [repoInfo, setRepoInfo] = useState(null);
    const [error, setError] = useState('');

    const handleAnalyze = async (e) => {
        e.preventDefault();
        if (!repoUrl) return;

        setLoading(true);
        setStatus('analyzing');
        setError('');
        setTimelineData([]);

        try {
            // 1. Analyze Repo to fetch metadata, branches, commits
            const analyzeRes = await axios.post('http://localhost:3002/analyze-repo', { repoUrl });
            const { repoId } = analyzeRes.data;
            setRepoInfo({ id: repoId, url: repoUrl });

            // 2. Generate Timeline Events
            setStatus('generating');
            await axios.post('http://localhost:3003/generate-timeline', { repoId });

            // 3. Fetch Timeline Data
            const timelineRes = await axios.get(`http://localhost:3003/timeline/${repoId}`);
            setTimelineData(timelineRes.data);
            setStatus('ready');

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to analyze repository. Make sure it is public.');
            setStatus('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 pt-24 px-4 pb-12 relative overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[url('/grid.png')] opacity-5 pointer-events-none"></div>

            <div className="container mx-auto max-w-7xl relative z-10">
                {/* HEADLINE */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-4xl md:text-5xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple tracking-widest drop-shadow-[0_0_10px_rgba(0,243,255,0.3)]">
                        VISUALIZE YOUR REPOSITORY
                    </h2>
                    <p className="mt-4 text-slate-400 font-rajdhani text-lg">
                        Enter a public GitHub repository URL to decode its development history.
                    </p>
                </motion.div>

                {/* INPUT SECTION */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="max-w-3xl mx-auto mb-16"
                >
                    <div className="glass-panel p-2 flex flex-col md:flex-row gap-2 border border-neon-blue/30 shadow-[0_0_30px_rgba(0,243,255,0.1)] backdrop-blur-md rounded-lg">
                        <input
                            type="text"
                            value={repoUrl}
                            onChange={(e) => setRepoUrl(e.target.value)}
                            placeholder="https://github.com/facebook/react"
                            className="flex-1 bg-black/50 border border-slate-700 rounded px-6 py-4 text-white focus:outline-none focus:border-neon-blue transition-colors font-mono text-sm placeholder:text-slate-600"
                        />
                        <button
                            onClick={handleAnalyze}
                            disabled={loading || !repoUrl}
                            className={`px-8 py-4 bg-neon-blue/10 border border-neon-blue text-neon-blue font-bold font-orbitron tracking-wider hover:bg-neon-blue hover:text-black transition-all rounded ${loading ? 'opacity-50 cursor-not-allowed animate-pulse' : ''}`}
                        >
                            {loading ? (status === 'analyzing' ? 'ANALYZING...' : 'GENERATING...') : 'ANALYZE'}
                        </button>
                    </div>
                    {error && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-4 border border-red-500/50 bg-red-500/10 text-red-400 font-mono text-sm text-center">
                            [ERROR]: {error}
                        </motion.div>
                    )}
                </motion.div>

                {/* VISUALIZATION AREA */}
                <AnimatePresence mode="wait">
                    {timelineData.length > 0 && status === 'ready' ? (
                        <motion.div
                            key="graph"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full h-[600px] border border-glass-border bg-black/40 backdrop-blur-sm rounded-lg relative overflow-hidden shadow-2xl"
                        >
                            <TimelineGraph data={timelineData} repoInfo={repoInfo} />
                        </motion.div>
                    ) : (
                        !loading && !error && (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="w-full h-[400px] border border-dashed border-slate-800 rounded-lg flex flex-col items-center justify-center text-slate-600 font-mono"
                            >
                                <div className="w-16 h-16 border-2 border-slate-700 rounded-full flex items-center justify-center mb-4">
                                    <span className="text-2xl">?</span>
                                </div>
                                <p>Awaiting Data Input...</p>
                            </motion.div>
                        )
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Dashboard;
