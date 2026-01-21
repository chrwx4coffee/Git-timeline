import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Clock,
    GitBranch,
    GitCommit,
    TrendingUp,
    Calendar,
    Activity,
    LogOut,
    ExternalLink
} from 'lucide-react';

const UserDashboard = () => {
    const [stats, setStats] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };

                // Fetch User Info
                const meRes = await axios.get('http://localhost:3001/me', { headers });
                setUser(meRes.data);

                // Fetch Stats
                const statsRes = await axios.get('http://localhost:3001/user/stats', { headers });
                setStats(statsRes.data);

                // Fetch History
                const historyRes = await axios.get('http://localhost:3001/user/history', { headers });
                setHistory(historyRes.data);

            } catch (err) {
                console.error('Failed to fetch dashboard data', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-blue"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white p-6 pt-24">
            <div className="container mx-auto max-w-6xl">
                {/* Header */}
                <header className="mb-12">
                    <h1 className="text-3xl font-orbitron font-bold mb-2">
                        Welcome back, <span className="text-neon-blue">{user?.email?.split('@')[0]}</span>
                    </h1>
                    <p className="text-slate-400">Here's what you've been up to lately.</p>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                                <GitBranch size={24} />
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm">Total Repos Analyzed</p>
                                <h3 className="text-2xl font-bold">{stats?.totalAnalyzed || 0}</h3>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                                <Activity size={24} />
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm">Activity Streak</p>
                                <h3 className="text-2xl font-bold">{stats?.dailyActivity?.length || 0} Days</h3>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm">Account Age</p>
                                <h3 className="text-2xl font-bold">
                                    {user ? Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24)) : 0} Days
                                </h3>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Daily Activity Graph (Simple Bar Chart) */}
                <div className="mb-12">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <TrendingUp className="text-neon-blue" /> Daily Usage
                    </h2>
                    <div className="h-64 rounded-2xl bg-black/40 border border-white/10 p-6 flex items-end gap-2">
                        {stats?.dailyActivity?.length > 0 ? stats.dailyActivity.map((day, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                <div
                                    className="w-full bg-gradient-to-t from-neon-blue to-purple-500 rounded-t opacity-60 group-hover:opacity-100 transition-opacity relative"
                                    style={{ height: `${Math.max((day.count / 10) * 100, 5)}%` }} // Scale roughly
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                        {day.count}
                                    </div>
                                </div>
                                <span className="text-xs text-slate-500 truncate w-full text-center">
                                    {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
                                </span>
                            </div>
                        )) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500">
                                No activity data available yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent History Table */}
                <div>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Clock className="text-neon-purple" /> Analysis History
                    </h2>
                    <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/20">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 border-b border-white/10">
                                <tr>
                                    <th className="p-4 text-sm font-medium text-slate-400">Repository</th>
                                    <th className="p-4 text-sm font-medium text-slate-400">Date Analyzed</th>
                                    <th className="p-4 text-sm font-medium text-slate-400 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.length > 0 ? history.map((item, i) => (
                                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center">
                                                    <GitCommit size={16} />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-white">{item.name}</div>
                                                    <div className="text-xs text-slate-500">{item.owner}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-400">
                                            {new Date(item.analyzed_at).toLocaleString()}
                                        </td>
                                        <td className="p-4 text-right">
                                            <a
                                                href={item.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                                            >
                                                View on GitHub <ExternalLink size={12} />
                                            </a>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="3" className="p-8 text-center text-slate-500">
                                            No history found. Start analyzing repositories!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
