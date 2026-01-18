import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, GitCommit, GitBranch, ExternalLink, X, Info, Filter, Download,
    Activity, Calendar, Clock, User, MessageSquare, Hash, TrendingUp, Zap,
    Eye, EyeOff, Maximize2, Minimize2, Crown, Sun, Moon, CheckCircle2, AlertCircle
} from 'lucide-react';

const TimelineGraph = ({ data, repoInfo }) => {
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [hoveredNode, setHoveredNode] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    // View State
    const [viewMode, setViewMode] = useState('timeline'); // 'timeline', 'network', 'heatmap'
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [isAnimating, setIsAnimating] = useState(true);
    const [selectedBranch, setSelectedBranch] = useState(null);

    // UI State
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showBranches, setShowBranches] = useState(true);
    const [showDates, setShowDates] = useState(true);
    const [stats, setStats] = useState(null);

    // Color Palette - Cyberpunk Theme (from ornek1/ornek3 mix)
    const colors = ["#00f3ff", "#ff0055", "#9d00ff", "#00ff41", "#ffff00", "#ff8000", "#00ff9d", "#ff00ff", "#0080ff"];

    // --- Statistics Calculation ---
    useEffect(() => {
        if (!data || data.length === 0) return;

        const branches = Array.from(new Set(data.map(e => e.payload.branch || 'main')));
        const authors = Array.from(new Set(data.map(e => e.payload.author)));

        // Commits by day
        const commitsByDay = {};
        data.forEach(e => {
            const date = new Date(e.event_time).toDateString();
            commitsByDay[date] = (commitsByDay[date] || 0) + 1;
        });

        // Most active author
        const mostActiveAuthor = authors.reduce((best, author) => {
            const count = data.filter(e => e.payload.author === author).length;
            return count > best.count ? { author, count } : best;
        }, { author: '', count: 0 });

        const dates = data.map(e => new Date(e.event_time));

        setStats({
            totalCommits: data.length,
            branches: branches.length,
            authors: authors.length,
            firstCommit: new Date(Math.min(...dates)),
            lastCommit: new Date(Math.max(...dates)),
            mostActiveAuthor
        });
    }, [data]);

    // --- Data Processing & Layout ---
    const { events, branches, colorScale, nodeMap } = useMemo(() => {
        if (!data) return { events: [], branches: [], colorScale: () => '#fff', nodeMap: {} };

        // Sort events by time
        const sortedEvents = [...data].sort((a, b) => new Date(a.event_time) - new Date(b.event_time));
        const uniqueBranches = Array.from(new Set(sortedEvents.map(e => e.payload.branch || 'main')));
        const scale = d3.scaleOrdinal().domain(uniqueBranches).range(colors);

        // Dimensions
        const LANE_HEIGHT = 160;
        const TIME_SPACING = selectedBranch ? 220 : 180;

        // Filter events based on selection
        let filteredEvents = sortedEvents;
        if (selectedBranch) {
            filteredEvents = sortedEvents.filter(e => e.payload.branch === selectedBranch);
        }
        if (searchQuery) {
            filteredEvents = filteredEvents.filter(e =>
                e.payload.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                e.payload.commit_hash.includes(searchQuery) ||
                e.payload.author.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Calculate positions
        const map = {};
        filteredEvents.forEach((e, i) => {
            map[e.payload.commit_hash] = {
                ...e,
                timelineX: i * TIME_SPACING + 200,
                timelineY: uniqueBranches.indexOf(e.payload.branch || 'main') * LANE_HEIGHT + 200, // +200 for top margin
                x: i * TIME_SPACING + 200,
                y: uniqueBranches.indexOf(e.payload.branch || 'main') * LANE_HEIGHT + 200,
                id: e.payload.commit_hash,
                laneIndex: uniqueBranches.indexOf(e.payload.branch || 'main')
            };
        });

        return { events: filteredEvents, branches: uniqueBranches, colorScale: scale, nodeMap: map };
    }, [data, selectedBranch, searchQuery]);

    // --- D3 Rendering ---
    useEffect(() => {
        if (!data || !svgRef.current) return;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;
        const svg = d3.select(svgRef.current);

        svg.selectAll("*").interrupt();
        svg.selectAll("*").remove();

        // 0. RESET POSITIONS
        if (viewMode === 'timeline' || viewMode === 'heatmap') {
            events.forEach(e => {
                const n = nodeMap[e.payload.commit_hash];
                if (n) {
                    n.x = n.timelineX;
                    n.y = n.timelineY;
                }
            });
        }

        // 1. Defs & Filters
        const defs = svg.append("defs");

        // Neon Glow 
        const glowFilter = defs.append("filter").attr("id", "neonGlow").attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%");
        glowFilter.append("feGaussianBlur").attr("stdDeviation", "2.5").attr("result", "blur");
        glowFilter.append("feComposite").attr("in", "SourceGraphic").attr("in2", "blur").attr("operator", "over");

        // Hover Glow
        const hoverFilter = defs.append("filter").attr("id", "hoverGlow").attr("x", "-100%").attr("y", "-100%").attr("width", "300%").attr("height", "300%");
        hoverFilter.append("feGaussianBlur").attr("stdDeviation", "6").attr("result", "blur2");
        hoverFilter.append("feComposite").attr("in", "SourceGraphic").attr("in2", "blur2").attr("operator", "over");

        // 2. Main Zoom Group
        const zoomGroup = svg.append("g").attr("class", "zoom-layer");

        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on("zoom", (event) => {
                zoomGroup.attr("transform", event.transform);

                const k = event.transform.k;

                // Sticky Branch Labels (Left side)
                svg.selectAll(".branch-label").attr("transform", function () {
                    const y = d3.select(this).attr("data-y");
                    // Keep Y moving with pan, but sticky X
                    return `translate(20, ${parseFloat(y) * k + event.transform.y})`;
                });

                // Sticky Date Labels (Top side - new logic)
                svg.selectAll(".date-label").attr("transform", function () {
                    const x = d3.select(this).attr("data-x");
                    // Keep X moving with pan, but sticky Y
                    return `translate(${parseFloat(x) * k + event.transform.x}, 120)`; // Fixed Top Position
                });
            });

        svg.call(zoom);

        // 3. Decorations (Grid/Paper)
        const decoGroup = zoomGroup.append("g");

        // Horizontal Lane Lines
        if (showBranches && viewMode !== 'network') {
            branches.forEach((b, i) => {
                const y = i * 160 + 200;
                decoGroup.append("line")
                    .attr("x1", -50000).attr("x2", 50000)
                    .attr("y1", y).attr("y2", y)
                    .attr("stroke", isDarkMode ? "#1e293b" : "#cbd5e1") // Dark: Slate800, Light: Slate300
                    .attr("stroke-width", 1)
                    .attr("stroke-dasharray", "8,8");
            });
        }

        // Vertical Time Lines
        if (showDates && viewMode !== 'network') {
            events.forEach((e) => {
                const node = nodeMap[e.payload.commit_hash];
                if (!node) return;
                decoGroup.append("line")
                    .attr("x1", node.timelineX).attr("x2", node.timelineX)
                    .attr("y1", -50000).attr("y2", 50000)
                    .attr("stroke", isDarkMode ? "#0f172a" : "#e2e8f0") // Dark: Slate900, Light: Slate200
                    .attr("stroke-width", 1);
            });
        }

        // 4. Links
        const links = [];
        events.forEach(e => {
            const current = nodeMap[e.payload.commit_hash];
            if (!current) return;
            (e.payload.parents || []).forEach(pHash => {
                const parent = nodeMap[pHash];
                if (parent) links.push({ source: parent, target: current });
            });
        });

        // Network Mode Force Simulation
        if (viewMode === 'network') {
            const simulation = d3.forceSimulation(events)
                .force("link", d3.forceLink(links).id(d => d.payload.commit_hash).distance(100))
                .force("charge", d3.forceManyBody().strength(-400))
                .force("center", d3.forceCenter(width / 2, height / 2))
                .stop();

            for (let i = 0; i < 300; ++i) simulation.tick();

            events.forEach(d => {
                const node = nodeMap[d.payload.commit_hash];
                if (node) { node.x = d.x; node.y = d.y; }
            });
        }

        const linkGroup = zoomGroup.append("g");
        const linkPathGenerator = (d) => {
            // Timeline: "Subway" / Orthogonal Rounded Style
            if (viewMode === 'timeline' || viewMode === 'heatmap') {
                const sx = d.source.x, sy = d.source.y, tx = d.target.x, ty = d.target.y;

                if (Math.abs(sy - ty) < 1) return `M${sx},${sy} L${tx},${ty}`;

                const radius = 20;
                const midX = sx + 40;
                const dirY = ty > sy ? 1 : -1;

                if (tx - sx < 60) {
                    return `M${sx},${sy} C${sx + 50},${sy} ${tx - 50},${ty} ${tx},${ty}`;
                }

                return `
                      M ${sx},${sy} 
                      L ${midX - radius},${sy} 
                      A ${radius},${radius} 0 0 ${dirY > 0 ? 1 : 0} ${midX},${sy + radius * dirY}
                      L ${midX},${ty - radius * dirY} 
                      A ${radius},${radius} 0 0 ${dirY > 0 ? 0 : 1} ${midX + radius},${ty} 
                      L ${tx},${ty}
                  `;
            }
            return `M${d.source.x},${d.source.y} L${d.target.x},${d.target.y}`;
        };

        const linkPaths = linkGroup.selectAll(".link")
            .data(links)
            .enter().append("path")
            .attr("d", linkPathGenerator)
            .attr("fill", "none")
            .attr("stroke", d => isDarkMode
                ? colorScale(d.target.payload.branch || 'main')
                : d3.color(colorScale(d.target.payload.branch || 'main')).darker(0.5) // Darker lines in light mode
            )
            .attr("stroke-width", 2)
            .attr("opacity", 0.5)
            .attr("stroke-linecap", "round");

        if (isAnimating) {
            linkPaths.attr("class", "link-flow");
        }

        // 5. Nodes
        const nodeGroup = zoomGroup.append("g");
        const nodes = nodeGroup.selectAll(".node")
            .data(events)
            .enter().append("g")
            .attr("transform", d => {
                const n = nodeMap[d.payload.commit_hash];
                return `translate(${n.x}, ${n.y})`;
            })
            .attr("class", "cursor-pointer")
            .on("click", (e, d) => setSelectedNode(d))
            .on("mouseenter", (e, d) => {
                setHoveredNode(d);
                // Highlight Path
                const ancestors = new Set([d.payload.commit_hash]);
                const stack = [d.payload.commit_hash];
                while (stack.length) {
                    const curr = stack.pop();
                    ancestors.add(curr);
                    const n = nodeMap[curr];
                    if (n && n.payload.parents) stack.push(...n.payload.parents);
                }

                linkPaths.transition().duration(200)
                    .style("opacity", l => ancestors.has(l.target.payload.commit_hash) && ancestors.has(l.source.payload.commit_hash) ? 1 : 0.1)
                    .style("stroke-width", l => ancestors.has(l.target.payload.commit_hash) ? 4 : 1);

                nodes.transition().duration(200)
                    .style("opacity", n => ancestors.has(n.payload.commit_hash) ? 1 : 0.2);
            })
            .on("mouseleave", () => {
                setHoveredNode(null);
                linkPaths.transition().duration(200).style("opacity", 0.5).style("stroke-width", 2);
                nodes.transition().duration(200).style("opacity", 1);
            });

        if (viewMode === 'heatmap') {
            nodes.append("rect")
                .attr("x", -15).attr("y", -10)
                .attr("width", 30).attr("height", 20)
                .attr("fill", d => colorScale(d.payload.branch))
                .attr("opacity", 0.8)
                .attr("rx", 4);
        } else {
            // DevOps Status Ring
            nodes.append("circle")
                .attr("r", 18)
                .attr("fill", "none")
                .attr("stroke", d => d.payload.status === 'failed' ? '#ef4444' : '#22c55e') // Red-500/Green-500
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", d => d.payload.status === 'success' ? "0" : "5,3");

            // Main Node Circle
            nodes.append("circle")
                .attr("r", 10)
                .attr("fill", isDarkMode ? "#0f172a" : "#fff")
                .attr("stroke", d => colorScale(d.payload.branch))
                .attr("stroke-width", 2.5)
                .style("filter", isDarkMode ? "url(#neonGlow)" : "none"); // No neon glow in light mode to reduce glare

            // Author Initial
            nodes.append("text")
                .attr("dy", "0.35em")
                .attr("text-anchor", "middle")
                .attr("font-size", "10px")
                .attr("font-weight", "bold")
                .attr("fill", isDarkMode ? "#fff" : "#1e293b") // Dark text in light mode
                .text(d => d.payload.author ? d.payload.author[0].toUpperCase() : "?");
        }

        // 6. Sticky Axes Layer
        const stickyGroup = svg.append("g").attr("class", "sticky-label-group");

        // Sticky Branch Labels
        if (showBranches && viewMode !== 'network') {
            branches.forEach((b, i) => {
                const y = i * 160 + 200;
                const g = stickyGroup.append("g")
                    .attr("class", "sticky-label branch-label")
                    .attr("data-y", y)
                    .attr("transform", `translate(20, ${y})`)
                    .style("cursor", "pointer")
                    .on("click", () => setSelectedBranch(selectedBranch === b ? null : b));

                g.append("rect")
                    .attr("x", 0).attr("y", -14)
                    .attr("width", 110).attr("height", 28)
                    .attr("rx", 14)
                    .attr("fill", isDarkMode ? "rgba(15,23,42,0.95)" : "rgba(255,255,255,0.95)")
                    .attr("stroke", colorScale(b))
                    .attr("stroke-width", 2)
                    .style("filter", "drop-shadow(0 4px 6px rgba(0,0,0,0.3))");

                g.append("text")
                    .attr("x", 14).attr("y", 5)
                    .attr("fill", isDarkMode ? "#fff" : "#0f172a")
                    .attr("font-size", "11px")
                    .attr("font-family", "monospace")
                    .attr("font-weight", "bold")
                    .text(b.length > 12 ? b.substring(0, 12) + "..." : b);
            });
        }

        // Sticky Date Labels (Top)
        if (showDates && viewMode !== 'network') {
            events.forEach(e => {
                const node = nodeMap[e.payload.commit_hash];
                if (!node) return;
                const g = stickyGroup.append("g")
                    .attr("class", "sticky-label date-label")
                    .attr("data-x", node.timelineX)
                    .attr("transform", `translate(${node.timelineX}, 120)`); // Fixed Top

                // Capsule Style similar to branches
                g.append("rect")
                    .attr("x", -25).attr("y", -12)
                    .attr("width", 50).attr("height", 24)
                    .attr("rx", 12)
                    .attr("fill", isDarkMode ? "rgba(2,6,23,0.9)" : "rgba(255,255,255,0.9)")
                    .attr("stroke", isDarkMode ? "#334155" : "#cbd5e1")
                    .attr("stroke-width", 1)
                    .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.1))");

                g.append("text")
                    .attr("text-anchor", "middle")
                    .attr("dominant-baseline", "middle")
                    .attr("dy", 1)
                    .attr("fill", isDarkMode ? "#94a3b8" : "#475569")
                    .attr("font-size", "10px")
                    .attr("font-weight", "bold")
                    .text(new Date(e.event_time).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }));
            });
        }

        const initialScale = 0.7;
        const initialY = height / 2;
        svg.call(zoom.transform, d3.zoomIdentity.translate(50, initialY - 100).scale(initialScale));

        const style = defs.append("style");
        style.text(`
            @keyframes flow { to { stroke-dashoffset: -20; } }
            .link-flow { animation: flow 1s linear infinite; }
        `);

    }, [data, viewMode, isDarkMode, showBranches, showDates, selectedBranch, searchQuery, isAnimating]);

    // --- Helpers ---
    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(console.error);
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    }, []);

    const captureScreenshot = useCallback(() => {
        const svgElement = svgRef.current;
        const width = svgElement.clientWidth;
        const height = svgElement.clientHeight;

        // 1. Serialize SVG
        const serializer = new XMLSerializer();
        let svgString = serializer.serializeToString(svgElement);

        // 2. Prepare Canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // 3. Fill Background (Fix for "wrong place" / transparent bg)
        // We must manually fill the background color because SVG export is transparent
        ctx.fillStyle = isDarkMode ? '#020617' : '#f0f2f5';
        ctx.fillRect(0, 0, width, height);

        // 4. Load Image
        const img = new Image();
        const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
            ctx.drawImage(img, 0, 0);
            const link = document.createElement('a');
            link.download = `timeline-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            URL.revokeObjectURL(url);
        };
        img.src = url;
    }, [isDarkMode]);

    return (
        <div ref={containerRef} className={`w-full h-full relative overflow-hidden font-sans transition-colors duration-500 ${isDarkMode ? 'bg-[#020617]' : 'bg-[#f0f2f5]'}`}>

            {/* Top Bar */}
            <div className={`absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-center backdrop-blur-md border-b ${isDarkMode ? 'border-white/10' : 'bg-white/50 border-slate-200'}`}>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Activity className="text-cyan-400" />
                        <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Git Timeline</h1>
                    </div>
                    <div className={`flex items-center gap-2 rounded-full px-3 py-1 ${isDarkMode ? 'bg-white/5' : 'bg-white border border-slate-200'}`}>
                        <GitCommit size={14} className="text-cyan-400" />
                        <span className={`text-xs font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{stats?.totalCommits || 0} commits</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={() => setIsAnimating(!isAnimating)} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-white/5 hover:text-cyan-400 text-slate-400' : 'bg-white/80 border border-slate-200 hover:text-cyan-600 text-slate-600'}`}>
                        {isAnimating ? <Zap size={18} fill="currentColor" /> : <Zap size={18} />}
                    </button>
                    <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-white/5 hover:text-yellow-400 text-slate-400' : 'bg-white/80 border border-slate-200 hover:text-purple-600 text-slate-600'}`}>
                        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <button onClick={captureScreenshot} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-white/5 hover:text-green-400 text-slate-400' : 'bg-white/80 border border-slate-200 hover:text-green-600 text-slate-600'}`}>
                        <Download size={18} />
                    </button>
                    <button onClick={toggleFullscreen} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-white/5 hover:text-purple-400 text-slate-400' : 'bg-white/80 border border-slate-200 hover:text-purple-600 text-slate-600'}`}>
                        {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>
                </div>
            </div>

            {/* Sidebar Stats */}
            <div className={`absolute top-20 left-4 z-10 w-60 p-4 rounded-2xl backdrop-blur-xl border transition-all ${isDarkMode ? 'bg-slate-900/80 border-white/10' : 'bg-white/80 border-slate-200 shadow-xl'}`}>
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp size={16} className="text-cyan-400" />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Statistics</h3>
                </div>
                {stats && (
                    <div className="space-y-3">
                        <StatItem icon={<GitCommit size={14} />} label="Total Commits" value={stats.totalCommits} color="cyan" isDarkMode={isDarkMode} />
                        <StatItem icon={<GitBranch size={14} />} label="Branches" value={stats.branches} color="purple" isDarkMode={isDarkMode} />
                        <StatItem icon={<User size={14} />} label="Contributors" value={stats.authors} color="green" isDarkMode={isDarkMode} />
                        {stats.mostActiveAuthor.author && (
                            <StatItem icon={<Crown size={14} />} label="Most Active" value={`${stats.mostActiveAuthor.author} (${stats.mostActiveAuthor.count})`} color="yellow" isDarkMode={isDarkMode} />
                        )}
                        <StatItem icon={<Calendar size={14} />} label="Duration" value={`${Math.ceil((stats.lastCommit - stats.firstCommit) / (86400000))} days`} color="pink" isDarkMode={isDarkMode} />
                    </div>
                )}
            </div>

            {/* View Mode Toggle */}
            <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-20 backdrop-blur-md p-1 rounded-full flex gap-1 border ${isDarkMode ? 'bg-black/50 border-white/10' : 'bg-white/80 border-slate-200 shadow-lg'}`}>
                {['timeline', 'network', 'heatmap'].map(mode => (
                    <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition-all ${viewMode === mode ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' : (isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-black')}`}
                    >
                        {mode === 'timeline' ? 'Timeline' : mode === 'network' ? 'Network' : 'Heatmap'}
                    </button>
                ))}
            </div>

            {/* Search Bar */}
            <div className="absolute top-20 right-4 z-10 w-80">
                <div className="relative group">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 group-focus-within:text-cyan-400 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search commit, author..."
                        className={`w-full pl-10 pr-10 py-2 rounded-xl text-sm outline-none border transition-all ${isDarkMode ? 'bg-black/40 border-white/10 focus:border-cyan-500/50 text-slate-200' : 'bg-white border-slate-200 focus:border-cyan-500 text-slate-700 shadow-sm'}`}
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-red-500">
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Extra Controls */}
            <div className="absolute bottom-6 left-6 z-20 flex flex-col gap-2">
                <button onClick={() => setShowBranches(!showBranches)} className={`flex items-center gap-2 text-xs font-mono hover:text-cyan-400 px-3 py-2 rounded-lg border ${isDarkMode ? 'text-slate-400 bg-black/40 border-white/5' : 'text-slate-600 bg-white/80 border-slate-200 shadow-sm'}`}>
                    {showBranches ? <Eye size={12} /> : <EyeOff size={12} />} Branch Names
                </button>
                <button onClick={() => setShowDates(!showDates)} className={`flex items-center gap-2 text-xs font-mono hover:text-cyan-400 px-3 py-2 rounded-lg border ${isDarkMode ? 'text-slate-400 bg-black/40 border-white/5' : 'text-slate-600 bg-white/80 border-slate-200 shadow-sm'}`}>
                    {showDates ? <Eye size={12} /> : <EyeOff size={12} />} Timeline Dates
                </button>
            </div>

            {/* Main Canvas */}
            <svg
                ref={svgRef}
                className="w-full h-full"
                style={{
                    background: isDarkMode
                        ? 'radial-gradient(circle at 50% 50%, #0f172a 0%, #020617 100%)'
                        : '#f0f2f5' // Softer grey for light mode to reduce eye strain
                }}
            />

            {/* Commit Detail Panel */}
            <AnimatePresence>
                {selectedNode && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        className={`absolute top-0 right-0 h-full w-[400px] shadow-2xl z-30 flex flex-col ${isDarkMode ? 'bg-slate-900/95 border-l border-white/10' : 'bg-white/95 border-l border-slate-200'}`}
                    >
                        {/* Header */}
                        <div className={`p-6 border-b flex justify-between items-start ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${isDarkMode ? 'bg-white/5 text-cyan-400' : 'bg-slate-100 text-blue-600'}`}>
                                    {selectedNode.payload.author[0]}
                                </div>
                                <div>
                                    <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{selectedNode.payload.author}</h2>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Clock size={12} /> {new Date(selectedNode.event_time).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedNode(null)} className="p-2 hover:bg-white/5 rounded-full text-slate-400">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Message */}
                            <div>
                                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 block">Commit Message</label>
                                <p className={`p-4 rounded-xl text-sm italic border-l-2 ${isDarkMode ? 'bg-white/5 border-cyan-500 text-slate-300' : 'bg-slate-50 border-blue-500 text-slate-700'}`}>
                                    "{selectedNode.payload.message}"
                                </p>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className={`p-3 rounded-xl border ${isDarkMode ? 'border-white/5 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                                    <label className="text-[10px] text-slate-500 uppercase block mb-1">Status</label>
                                    <div className="flex items-center gap-2 font-bold text-sm">
                                        {selectedNode.payload.status === 'failed' ? <AlertCircle size={14} className="text-red-500" /> : <CheckCircle2 size={14} className="text-green-500" />}
                                        <span className={selectedNode.payload.status === 'failed' ? 'text-red-400' : 'text-green-400'}>{selectedNode.payload.status || 'Success'}</span>
                                    </div>
                                </div>
                                <div className={`p-3 rounded-xl border ${isDarkMode ? 'border-white/5 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                                    <label className="text-[10px] text-slate-500 uppercase block mb-1">Branch</label>
                                    <div className="flex items-center gap-2 font-bold text-sm text-purple-400">
                                        <GitBranch size={14} /> {selectedNode.payload.branch}
                                    </div>
                                </div>
                            </div>

                            {/* Hash */}
                            <div>
                                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 block">Commit Hash</label>
                                <div className="flex items-center gap-2">
                                    <code className={`flex-1 p-3 rounded-lg font-mono text-xs ${isDarkMode ? 'bg-black/50 text-cyan-500' : 'bg-slate-100 text-blue-600'}`}>
                                        {selectedNode.payload.commit_hash}
                                    </code>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(selectedNode.payload.commit_hash)}
                                        className="p-3 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 transition-colors"
                                        title="Copy Hash"
                                    >
                                        <Hash size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Parents */}
                            {selectedNode.payload.parents && (
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 block">Parents</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {selectedNode.payload.parents.map(p => (
                                            <span key={p} className="px-2 py-1 rounded bg-white/5 text-[10px] font-mono text-slate-500 border border-white/5">
                                                {p.substring(0, 8)}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className={`p-6 border-t ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
                            <a
                                href={repoInfo?.url ? `${repoInfo.url.replace('.git', '')}/commit/${selectedNode.payload.commit_hash}` : '#'}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-cyan-500/20"
                            >
                                <ExternalLink size={18} /> OPEN IN GITHUB
                            </a>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hover Tooltip (Quick View) */}
            <AnimatePresence>
                {hoveredNode && !selectedNode && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`absolute bottom-20 left-1/2 -translate-x-1/2 p-4 rounded-xl shadow-2xl border z-40 pointer-events-none ${isDarkMode ? 'bg-slate-900/90 border-white/10' : 'bg-white/95 border-slate-200'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                            <div>
                                <div className={`text-sm font-bold max-w-xs truncate ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{hoveredNode.payload.message}</div>
                                <div className="text-xs text-slate-500 flex gap-2 mt-1">
                                    <span>{hoveredNode.payload.author}</span>
                                    <span>•</span>
                                    <span>{new Date(hoveredNode.event_time).toLocaleTimeString()}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

const StatItem = ({ icon, label, value, color, isDarkMode }) => (
    <div className={`flex items-center justify-between p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-100'}`}>
        <div className="flex items-center gap-3">
            <div className={`text-${color}-500`}>{icon}</div>
            <span className="text-xs text-slate-500 font-medium">{label}</span>
        </div>
        <span className={`text-sm font-mono font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{value}</span>
    </div>
);

export default TimelineGraph;
