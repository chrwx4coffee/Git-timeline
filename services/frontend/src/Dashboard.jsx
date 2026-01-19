import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import TimelineGraph from './TimelineGraph';
import {
    Github,
    Zap,
    Cpu,
    Database,
    Cloud,
    Code,
    Users,
    Rocket,
    AlertCircle,
    TrendingUp,
    Clock,
    GitBranch,
    GitCommit,
    BarChart3,
    Download,
    Share2,
    Settings,
    Menu,
    X,
    ChevronRight,
    RefreshCw,
    Eye,
    Globe,
    Filter,
    Layers,
    Terminal,
    Sparkles,
    Search,
    LogOut,
    LayoutDashboard
} from 'lucide-react';

// Helper Components
const StatCard = ({ icon, label, value, color }) => (
    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
        <div className="flex items-center gap-3">
            <div className={`text-${color}-400`}>{icon}</div>
            <span className="text-sm">{label}</span>
        </div>
        <span className="font-bold">{value}</span>
    </div>
);

const StatusItem = ({ label, status, value }) => (
    <div className="flex items-center justify-between">
        <span className="text-sm">{label}</span>
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-green-500' :
                status === 'optimal' ? 'bg-blue-500' :
                    'bg-yellow-500'
                }`} />
            <span className="text-xs text-white/60">{value}</span>
        </div>
    </div>
);

const MetricBar = ({ label, value, color }) => (
    <div>
        <div className="flex justify-between text-xs mb-1">
            <span>{label}</span>
            <span>{value}%</span>
        </div>
        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
            <div
                className={`h-full rounded-full bg-gradient-to-r from-${color}-500 to-${color}-700`}
                style={{ width: `${value}%` }}
            />
        </div>
    </div>
);

const DataMetric = ({ label, value, trend }) => (
    <div className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors">
        <div>
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-white/60">{value}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded ${trend.startsWith('+')
            ? 'bg-green-500/20 text-green-400'
            : 'bg-red-500/20 text-red-400'
            }`}>
            {trend}
        </span>
    </div>
);

const ActionButton = ({ icon, label, onClick }) => (
    <button
        onClick={onClick}
        className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex flex-col items-center justify-center gap-2"
    >
        {icon}
        <span className="text-xs">{label}</span>
    </button>
);

const InfoRow = ({ label, value }) => (
    <div className="flex justify-between py-1 border-b border-white/5 last:border-0">
        <span className="text-white/60">{label}</span>
        <span className="font-mono">{value}</span>
    </div>
);

const Dashboard = () => {
    // Core State
    const [repoUrl, setRepoUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(''); // 'analyzing', 'generating', 'ready'
    const [timelineData, setTimelineData] = useState([]);
    const [repoInfo, setRepoInfo] = useState(null);
    const [error, setError] = useState('');

    // UI State
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [recentRepos, setRecentRepos] = useState([]);
    const [showStats, setShowStats] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(false);

    // Visual Settings
    const [visualTheme, setVisualTheme] = useState('cyberpunk');
    const [animationSpeed, setAnimationSpeed] = useState(1);

    // Contributor View State
    const [selectedContributor, setSelectedContributor] = useState(null);

    // Persistence
    useEffect(() => {
        const saved = localStorage.getItem('git-timeline-recent-repos');
        if (saved) {
            try {
                setRecentRepos(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse recent repos:', e);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('git-timeline-recent-repos', JSON.stringify(recentRepos));
    }, [recentRepos]);

    // Filter State
    const [showFilters, setShowFilters] = useState(false);
    const [filterConfig, setFilterConfig] = useState({
        branch: 'all',
        author: 'all',
        startDate: '',
        endDate: ''
    });

    const themes = {
        cyberpunk: {
            primary: '#00f3ff',
            secondary: '#ff0055',
            tertiary: '#9d00ff',
            bg: '#020617',
            card: 'rgba(15, 23, 42, 0.7)',
            gradient: 'linear-gradient(135deg, #00f3ff, #9d00ff)'
        },
        matrix: {
            primary: '#00ff41',
            secondary: '#00ff41',
            tertiary: '#00ff41',
            bg: '#000000',
            card: 'rgba(0, 20, 0, 0.7)',
            gradient: 'linear-gradient(135deg, #00ff41, #003b00)'
        },
        sunset: {
            primary: '#ff6b6b',
            secondary: '#ffd166',
            tertiary: '#06d6a0',
            bg: '#1a1a2e',
            card: 'rgba(26, 26, 46, 0.7)',
            gradient: 'linear-gradient(135deg, #ff6b6b, #ffd166)'
        },
        ocean: {
            primary: '#00bbf9',
            secondary: '#00f5d4',
            tertiary: '#9b5de5',
            bg: '#0d1b2a',
            card: 'rgba(13, 27, 42, 0.7)',
            gradient: 'linear-gradient(135deg, #00bbf9, #9b5de5)'
        }
    };

    const currentTheme = themes[visualTheme];

    // Filter Logic
    const availableBranches = useMemo(() =>
        [...new Set(timelineData.map(d => d.branch).filter(Boolean))],
        [timelineData]
    );

    const availableAuthors = useMemo(() =>
        [...new Set(timelineData.map(d => d.author).filter(Boolean))],
        [timelineData]
    );

    const filteredData = useMemo(() => {
        return timelineData.filter(item => {
            const branchMatch = filterConfig.branch === 'all' || item.branch === filterConfig.branch;
            const authorMatch = filterConfig.author === 'all' || item.author === filterConfig.author;
            const dateMatch = (!filterConfig.startDate || new Date(item.date) >= new Date(filterConfig.startDate)) &&
                (!filterConfig.endDate || new Date(item.date) <= new Date(filterConfig.endDate));
            return branchMatch && authorMatch && dateMatch;
        });
    }, [timelineData, filterConfig]);

    // Contributor Stats
    const contributorStats = useMemo(() => {
        if (!timelineData.length) return [];
        const stats = {};

        timelineData.forEach(item => {
            // Fix: Access author from payload
            const payload = item.payload || {};
            const author = payload.author || item.author || 'Unknown';
            const branch = payload.branch || item.branch;
            const itemDate = item.event_time ? new Date(item.event_time) : new Date();

            if (!stats[author]) {
                stats[author] = {
                    name: author,
                    commits: [],
                    branches: new Set(),
                    lastActive: !isNaN(itemDate.getTime()) ? itemDate.toISOString() : new Date().toISOString()
                };
            }

            stats[author].commits.push({
                message: payload.message || 'No message',
                date: itemDate,
                branch: branch,
                hash: payload.commit_hash
            });

            if (branch) {
                stats[author].branches.add(branch);
            }

            const currentLastActive = new Date(stats[author].lastActive);
            if (!isNaN(itemDate.getTime()) && itemDate > currentLastActive) {
                stats[author].lastActive = itemDate.toISOString();
            }
        });

        return Object.values(stats)
            .map(stat => ({
                ...stat,
                commitCount: stat.commits.length,
                branchCount: stat.branches.size,
                // Sort commits by date desc for the detail view
                commits: stat.commits.sort((a, b) => b.date - a.date)
            }))
            .sort((a, b) => b.commitCount - a.commitCount);
    }, [timelineData]);

    const handleAnalyze = async (e) => {
        if (e) e.preventDefault();
        if (!repoUrl) return;

        setLoading(true);
        setStatus('analyzing');
        setError('');
        setTimelineData([]);

        try {
            // 1. Analyze Repo
            const analyzeRes = await axios.post('http://localhost:3002/analyze-repo', { repoUrl });
            const { repoId } = analyzeRes.data;
            setRepoInfo({ id: repoId, url: repoUrl });

            // 2. Generate Timeline
            setStatus('generating');
            await axios.post('http://localhost:3003/generate-timeline', { repoId });

            // 3. Fetch Data
            const timelineRes = await axios.get(`http://localhost:3003/timeline/${repoId}`);
            setTimelineData(timelineRes.data);
            setStatus('ready');

            // Add to recent repos
            const newRepo = {
                url: repoUrl,
                name: repoUrl.split('/').pop(),
                commitCount: timelineRes.data.length,
                timestamp: new Date().toISOString()
            };
            setRecentRepos(prev => {
                const filtered = prev.filter(r => r.url !== repoUrl);
                return [newRepo, ...filtered].slice(0, 5);
            });

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to analyze repository. Make sure it is public.');
            setStatus('');
        } finally {
            setLoading(false);
        }
    };

    const exportData = (format) => {
        const dataStr = JSON.stringify(timelineData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = `git-timeline-${repoInfo?.id || 'data'}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen text-white relative overflow-hidden" style={{ backgroundColor: currentTheme.bg }}>
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute inset-0 bg-[url('/grid.png')] opacity-10 bg-repeat"></div>
                </div>
                {/* Grid Pattern */}
                <div
                    className="absolute inset-0 opacity-5"
                    style={{
                        backgroundImage: `linear-gradient(${currentTheme.primary}20 1px, transparent 1px), linear-gradient(90deg, ${currentTheme.primary}20 1px, transparent 1px)`,
                        backgroundSize: '50px 50px'
                    }}
                />
            </div>

            {/* Top Navigation */}
            <nav className="relative z-50 border-b border-white/10 backdrop-blur-xl">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                            >
                                <Menu size={20} />
                            </button>

                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                        style={{ background: currentTheme.gradient }}>
                                        <GitCommit size={16} className="text-white" />
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px]">
                                        <Sparkles size={8} />
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold tracking-tighter">Git Timeline Pro</h1>
                                    <p className="text-xs text-white/60">Visualize your development journey</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowStats(!showStats)}
                                className={`p-2 rounded-lg transition-all ${showStats ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white/40'}`}
                                title={showStats ? "Hide Stats" : "Show Stats"}
                            >
                                <BarChart3 size={18} />
                            </button>

                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`p-2 rounded-lg transition-all ${showFilters ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-white/40'}`}
                                title="Filters"
                            >
                                <Filter size={18} />
                            </button>

                            <button
                                onClick={() => setShowInfoModal(true)}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                title="System Info"
                            >
                                <Settings size={18} />
                            </button>

                            <div className="h-6 w-px bg-white/10 mx-2" />

                            <a href="/" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/60 hover:text-white" title="Dashboard">
                                <LayoutDashboard size={18} />
                            </a>

                            <button
                                onClick={handleLogout}
                                className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition-colors text-white/60"
                                title="Logout"
                            >
                                <LogOut size={18} />
                            </button>

                            <button
                                onClick={() => handleAnalyze()}
                                disabled={loading || !repoUrl}
                                className={`ml-2 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${loading ? 'bg-gray-500/20 cursor-not-allowed' : `bg-gradient-to-r ${currentTheme.primary} ${currentTheme.secondary} hover:opacity-90`}`}
                            >
                                {loading ? (
                                    <><RefreshCw size={16} className="animate-spin" /> {status === 'analyzing' ? 'Analyzing...' : 'Generating...'}</>
                                ) : (
                                    <><Rocket size={16} /> Analyze</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="container mx-auto px-6 py-8 relative z-10 flex gap-6">
                {/* Sidebar */}
                <AnimatePresence>
                    {isSidebarOpen && (
                        <motion.aside
                            initial={{ x: -300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -300, opacity: 0 }}
                            className="w-80 flex-shrink-0"
                        >
                            <div className="rounded-2xl p-6 backdrop-blur-xl border border-white/10 mb-6" style={{ backgroundColor: currentTheme.card }}>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-bold flex items-center gap-2">
                                        <Search size={18} /> Repository
                                    </h2>
                                    <button onClick={() => setRepoUrl('')} className="p-1 rounded hover:bg-white/5">
                                        <X size={16} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="relative">
                                        <Github className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                                        <input
                                            type="text"
                                            value={repoUrl}
                                            onChange={(e) => setRepoUrl(e.target.value)}
                                            placeholder="https://github.com/username/repo"
                                            className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-white/30 transition-colors"
                                            onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                                        />
                                    </div>

                                    <button
                                        onClick={handleAnalyze}
                                        disabled={loading || !repoUrl}
                                        className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${loading ? 'bg-gray-500/20 cursor-not-allowed' : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90'}`}
                                    >
                                        {loading ? 'Processing...' : 'Analyze Repository'}
                                    </button>
                                </div>
                            </div>

                            {/* Recent Repos */}
                            {recentRepos.length > 0 && (
                                <div className="rounded-2xl p-6 backdrop-blur-xl border border-white/10 mb-6" style={{ backgroundColor: currentTheme.card }}>
                                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                                        <Clock size={16} /> Recent Repositories
                                    </h3>
                                    <div className="space-y-2">
                                        {recentRepos.map((repo, index) => (
                                            <button
                                                key={index}
                                                onClick={() => { setRepoUrl(repo.url); setTimeout(() => handleAnalyze(), 100); }}
                                                className="w-full p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left group"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">{repo.name}</p>
                                                        <p className="text-xs text-white/40 truncate">{repo.url}</p>
                                                    </div>
                                                    <ChevronRight size={16} className="text-white/40 group-hover:text-white" />
                                                </div>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-white/60">
                                                    <span className="flex items-center gap-1"><GitCommit size={12} /> {repo.commitCount} commits</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Quick Stats */}
                            {showStats && timelineData.length > 0 && (
                                <div className="rounded-2xl p-6 backdrop-blur-xl border border-white/10" style={{ backgroundColor: currentTheme.card }}>
                                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                                        <TrendingUp size={16} /> Quick Stats
                                    </h3>
                                    <div className="space-y-3">
                                        <StatCard icon={<GitCommit size={14} />} label="Total Commits" value={timelineData.length} color="blue" />
                                        <StatCard icon={<GitBranch size={14} />} label="Branches" value={new Set(timelineData.map(d => d.payload.branch)).size} color="purple" />
                                        <StatCard icon={<Users size={14} />} label="Contributors" value={new Set(timelineData.map(d => d.payload.author)).size} color="green" />
                                        <StatCard icon={<Clock size={14} />} label="Time Span" value={`${Math.floor((new Date(timelineData[timelineData.length - 1]?.event_time) - new Date(timelineData[0]?.event_time)) / (1000 * 60 * 60 * 24))} days`} color="orange" />
                                    </div>
                                </div>
                            )}
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* Main Content */}
                <main className="flex-1 min-w-0">
                    {/* Status Bar */}
                    {status && (
                        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                            <div className="rounded-xl p-4 backdrop-blur-xl border border-white/10" style={{ backgroundColor: currentTheme.card }}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full animate-pulse ${status === 'analyzing' ? 'bg-yellow-500' : status === 'generating' ? 'bg-blue-500' : 'bg-green-500'}`} />
                                        <div>
                                            <p className="font-medium">
                                                {status === 'analyzing' && 'Analyzing repository structure...'}
                                                {status === 'generating' && 'Generating timeline visualization...'}
                                                {status === 'ready' && 'Timeline ready!'}
                                            </p>
                                        </div>
                                    </div>
                                    {status === 'ready' && (
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => exportData('json')} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-2">
                                                <Download size={16} /> Export
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Error */}
                    {error && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mb-6">
                            <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/50 backdrop-blur-xl">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="text-red-400 mt-0.5" size={20} />
                                    <div className="flex-1">
                                        <h4 className="font-bold text-red-400">Analysis Failed</h4>
                                        <p className="text-sm text-red-300/80 mt-1">{error}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Visualization */}
                    <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative">
                        {timelineData.length > 0 ? (
                            <div className="h-[600px] relative">
                                <TimelineGraph
                                    data={filteredData}
                                    repoInfo={repoInfo}
                                    theme={currentTheme}
                                    speed={animationSpeed}
                                />

                                {/* Overlay Controls */}
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg p-2">
                                        <span className="text-xs">Theme:</span>
                                        <select
                                            value={visualTheme}
                                            onChange={(e) => setVisualTheme(e.target.value)}
                                            className="bg-transparent text-xs focus:outline-none"
                                        >
                                            <option value="cyberpunk">Cyberpunk</option>
                                            <option value="matrix">Matrix</option>
                                            <option value="sunset">Sunset</option>
                                            <option value="ocean">Ocean</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-[500px] flex flex-col items-center justify-center p-8 text-center bg-black/40">
                                <div className="relative mb-8">
                                    <div className="w-32 h-32 rounded-full flex items-center justify-center" style={{ background: `radial-gradient(circle, ${currentTheme.primary}20, transparent 70%)`, border: `2px dashed ${currentTheme.primary}40` }}>
                                        <Code size={48} className="opacity-20" />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold mb-4">Visualize Your Git History</h3>
                                <p className="text-white/60 mb-8 max-w-md">
                                    Enter a GitHub repository URL to generate an interactive timeline.
                                </p>
                            </div>
                        )}

                    </div>

                    {/* Contributors Section */}
                    {timelineData.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 rounded-2xl p-6 border border-white/10 backdrop-blur-xl"
                            style={{ backgroundColor: currentTheme.card }}
                        >
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Users className="text-purple-400" /> Top Contributors
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {contributorStats.map((contributor, index) => (
                                    <div key={index} className="flex flex-col p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all hover:bg-white/10 group">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center font-bold text-xl shadow-lg shadow-purple-500/20">
                                                {contributor.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold truncate text-lg">{contributor.name}</p>
                                                <p className="text-xs text-white/50">Active: {new Date(contributor.lastActive).toLocaleDateString()}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 mb-4">
                                            <div className="bg-black/20 rounded-lg p-2 text-center">
                                                <p className="text-xl font-bold text-blue-400">{contributor.commitCount}</p>
                                                <p className="text-[10px] uppercase tracking-wider text-white/40">Commits</p>
                                            </div>
                                            <div className="bg-black/20 rounded-lg p-2 text-center">
                                                <p className="text-xl font-bold text-purple-400">{contributor.branchCount}</p>
                                                <p className="text-[10px] uppercase tracking-wider text-white/40">Branches</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setSelectedContributor(contributor)}
                                            className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 group-hover:bg-blue-500/20 group-hover:text-blue-300"
                                        >
                                            <GitCommit size={14} /> View Commits
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </main>
            </div>

            {/* Enhanced Info Modal */}
            <AnimatePresence>
                {showInfoModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowInfoModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/20 backdrop-blur-xl"
                            style={{ backgroundColor: currentTheme.card, borderColor: `${currentTheme.primary}40` }}
                        >
                            <div className="p-8 overflow-y-auto max-h-[90vh]">
                                <div className="flex items-start justify-between mb-8">
                                    <div>
                                        <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">System Intelligence Dashboard</h2>
                                        <p className="text-white/60 mt-2">Advanced analytics and system monitoring</p>
                                    </div>
                                    <button onClick={() => setShowInfoModal(false)} className="p-2 rounded-lg hover:bg-white/5 transition-colors"><X size={24} /></button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {/* System Status */}
                                    <div className="rounded-xl p-6 border border-white/10 bg-white/5">
                                        <h3 className="font-bold mb-4 flex items-center gap-2"><Cpu size={18} /> System Status</h3>
                                        <div className="space-y-3">
                                            <StatusItem label="API Server" status="online" value="20ms" />
                                            <StatusItem label="Database" status="online" value="Connected" />
                                            <StatusItem label="Worker Nodes" status="optimal" value="Active" />
                                        </div>
                                    </div>

                                    {/* Tech Stack */}
                                    <div className="rounded-xl p-6 border border-white/10 bg-white/5">
                                        <h3 className="font-bold mb-4 flex items-center gap-2"><Code size={18} /> Core Stack</h3>
                                        <div className="space-y-3 text-sm">
                                            <InfoRow label="Frontend" value="React + Vite" />
                                            <InfoRow label="Visualization" value="D3.js" />
                                            <InfoRow label="Backend" value="Node.js" />
                                            <InfoRow label="Container" value="Docker" />
                                        </div>
                                    </div>

                                    {/* Team */}
                                    <div className="rounded-xl p-6 border border-white/10 bg-white/5">
                                        <h3 className="font-bold mb-4 flex items-center gap-2"><Users size={18} /> Contributors</h3>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex items-center justify-between">
                                                <span>Emre</span>
                                                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs">Architect</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>Antigravity</span>
                                                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 text-xs">AI Core</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Filter Panel */}
                {showFilters && (
                    <motion.div
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 300, opacity: 0 }}
                        className="fixed right-0 top-0 bottom-0 w-80 bg-slate-900/95 backdrop-blur-xl border-l border-white/10 p-6 z-50 shadow-2xl"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                                <Filter className="text-cyan-400" /> Filters
                            </h2>
                            <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-white/10 rounded-full text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm text-white/60">Branch</label>
                                <select
                                    value={filterConfig.branch}
                                    onChange={(e) => setFilterConfig({ ...filterConfig, branch: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-cyan-500 outline-none"
                                >
                                    <option value="all">All Branches</option>
                                    {availableBranches.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-white/60">Author</label>
                                <select
                                    value={filterConfig.author}
                                    onChange={(e) => setFilterConfig({ ...filterConfig, author: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-cyan-500 outline-none"
                                >
                                    <option value="all">All Authors</option>
                                    {availableAuthors.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-white/60">Date Range</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="date"
                                        value={filterConfig.startDate}
                                        onChange={(e) => setFilterConfig({ ...filterConfig, startDate: e.target.value })}
                                        className="bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white outline-none"
                                    />
                                    <input
                                        type="date"
                                        value={filterConfig.endDate}
                                        onChange={(e) => setFilterConfig({ ...filterConfig, endDate: e.target.value })}
                                        className="bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white outline-none"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/10">
                                <div className="flex justify-between text-sm text-white/60 mb-2">
                                    <span>Active Filters</span>
                                    <span className="text-white">{(filterConfig.branch !== 'all' || filterConfig.author !== 'all' || filterConfig.startDate || filterConfig.endDate) ? 'Active' : 'None'}</span>
                                </div>
                                <div className="flex justify-between text-sm text-white/60">
                                    <span>Items Scanned</span>
                                    <span className="text-white">{filteredData.length} / {timelineData.length}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => setFilterConfig({ branch: 'all', author: 'all', startDate: '', endDate: '' })}
                                className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors mt-4 text-white"
                            >
                                Reset Filters
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Contributor Details Modal */}
            <AnimatePresence>
                {selectedContributor && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedContributor(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl border border-white/20 backdrop-blur-xl flex flex-col"
                            style={{ backgroundColor: currentTheme.card, borderColor: `${currentTheme.primary}40` }}
                        >
                            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center font-bold text-xl shadow-lg">
                                        {selectedContributor.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">{selectedContributor.name}</h3>
                                        <p className="text-sm text-white/60">
                                            {selectedContributor.commitCount} commits across {selectedContributor.branchCount} branches
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedContributor(null)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="overflow-y-auto p-6 space-y-3 custom-scrollbar">
                                {selectedContributor.commits.map((commit, idx) => (
                                    <div key={idx} className="group p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2 text-xs font-mono text-white/40">
                                                <GitCommit size={12} />
                                                <span className="bg-white/10 px-1.5 py-0.5 rounded">{commit.hash?.substring(0, 7) || '.......'}</span>
                                            </div>
                                            <span className="text-xs text-white/40">{new Date(commit.date).toLocaleString()}</span>
                                        </div>
                                        <p className="font-medium text-white/90 mb-2">{commit.message}</p>
                                        <div className="flex items-center gap-2">
                                            {commit.branch && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                                                    <GitBranch size={10} /> {commit.branch}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Dashboard;
