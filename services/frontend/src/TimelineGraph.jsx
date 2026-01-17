import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, GitCommit, GitBranch, ExternalLink, X, Info } from 'lucide-react';

const TimelineGraph = ({ data, repoInfo }) => {
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [hoveredNode, setHoveredNode] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Renk Paleti - Cyberpunk Theme
    const colors = ["#00f3ff", "#ff0055", "#9d00ff", "#00ff41", "#ffff00", "#ff8000"];

    useEffect(() => {
        if (!data || !svgRef.current) return;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        // --- 1. DEFS (Filtreler ve Gradyanlar) ---
        const defs = svg.append("defs");

        // Glow Filtresi
        const glow = defs.append("filter").attr("id", "neonGlow").attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%");
        glow.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "blur");
        glow.append("feComposite").attr("in", "SourceGraphic").attr("in2", "blur").attr("operator", "over");

        // Arka Plan Izgarası (Grid)
        const pattern = defs.append("pattern")
            .attr("id", "grid")
            .attr("width", 40)
            .attr("height", 40)
            .attr("patternUnits", "userSpaceOnUse");
        pattern.append("path")
            .attr("d", "M 40 0 L 0 0 0 40")
            .attr("fill", "none")
            .attr("stroke", "rgba(0, 243, 255, 0.05)")
            .attr("stroke-width", 1);

        // --- 2. DATA PROCESSING ---
        const events = [...data].sort((a, b) => new Date(a.event_time) - new Date(b.event_time));
        const branches = Array.from(new Set(events.map(e => e.payload.branch || 'main')));
        const colorScale = d3.scaleOrdinal().domain(branches).range(colors);

        const LANE_HEIGHT = 120;
        const TIME_SPACING = 150;

        // Date Grid Helper
        const dates = events.map(e => new Date(e.event_time));
        const dateExtent = d3.extent(dates);

        // Time Scale (Real Time vs Index) - User wants "Lined paper with dates"
        // Let's us Index for X to keep nodes distinct, but project Dates onto the grid.

        const nodeMap = {};
        events.forEach((e, i) => {
            nodeMap[e.payload.commit_hash] = {
                ...e,
                x: i * TIME_SPACING + 100, // Offset for start
                y: branches.indexOf(e.payload.branch || 'main') * LANE_HEIGHT + 50,
                id: e.payload.commit_hash
            };
        });

        const totalWidth = events.length * TIME_SPACING + 200;
        const totalHeight = branches.length * LANE_HEIGHT + 100;

        // --- 3. ZOOM & LAYERS ---
        const zoomGroup = svg.append("g");

        // "Lined Paper" Background
        // Horizontal lines for lanes
        const paperGroup = zoomGroup.append("g").attr("class", "paper-bg");

        branches.forEach((b, i) => {
            const y = i * LANE_HEIGHT + 50;
            // Lane Line
            paperGroup.append("line")
                .attr("x1", -5000).attr("x2", 50000) // Infinite-ish
                .attr("y1", y).attr("y2", y)
                .attr("stroke", "#1e293b") // Slate-800
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "5,5");

            // Lane Label
            paperGroup.append("text")
                .attr("x", 20)
                .attr("y", y - 10)
                .attr("class", "fill-slate-600 font-mono text-xs uppercase")
                .text(b);
        });

        // Vertical Date Lines
        events.forEach((e, i) => {
            const x = i * TIME_SPACING + 100;
            const dateStr = new Date(e.event_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

            paperGroup.append("line")
                .attr("x1", x).attr("x2", x)
                .attr("y1", -5000).attr("y2", 50000)
                .attr("stroke", "#0f172a") // Darker Slate
                .attr("stroke-width", 2);

            paperGroup.append("text")
                .attr("x", x + 5)
                .attr("y", 20)
                .attr("class", "fill-slate-700 font-mono text-[10px] -rotate-45 origin-left")
                .text(dateStr);
        });

        const mainG = zoomGroup.append("g");

        // Zoom Behavior
        const zoom = d3.zoom()
            .scaleExtent([0.1, 3])
            .on("zoom", (event) => {
                zoomGroup.attr("transform", event.transform);
            });

        svg.call(zoom);

        // --- 4. LINKS (New Logic: Vertical Step First) ---
        const links = [];
        events.forEach(e => {
            const current = nodeMap[e.payload.commit_hash];
            (e.payload.parents || []).forEach(pHash => {
                const parent = nodeMap[pHash];
                if (parent) links.push({ source: parent, target: current });
            });
        });

        // User Quest: "First 90 deg (Vertical) then -90 deg (Horizontal)"
        // Path: Parent(sx,sy) -> Vertical to TargetY -> Horizontal to TargetX
        // But we need a bit of initial horizontal to clear the node?
        // Let's try: dx/2 horizontal -> vertical -> dx/2 horizontal (standard step)
        // User said: "Önce 90 derece dönsün... main le branch karışmaz"
        // Interpretation: Leave parent, go VERTICAL immediately (or shortly), then Horizontal.

        const drawVerticalFirst = (d) => {
            const { x: sx, y: sy } = d.source;
            const { x: tx, y: ty } = d.target;
            const r = 15; // Radius

            // If straight line
            if (Math.abs(sy - ty) < 1) return `M${sx},${sy} L${tx},${ty}`;

            // Branch separation point. 
            // If we go vertical immediately: M sx,sy -> L sx, ty. This overlaps nodes if they are vertically aligned (they aren't, X increases).
            // But we should move a LITTLE X first to leave the circle.
            const paddingX = 20;

            const dirY = ty > sy ? 1 : -1;

            // M sx,sy -> L sx+p, sy -> Q sx+p+r, sy ... NO.
            // 90 deg turn means corner.

            // Path:
            // 1. Start at Source
            // 2. Move Horizontal small amount (padding)
            // 3. Curve Vertical towards Target Y
            // 4. Move Vertical to Target Y (minus radius)
            // 5. Curve Horizontal towards Target X
            // 6. Move Horizontal to Target

            // Check space
            const dx = tx - sx;
            const dy = ty - sy;

            // If target is very close x-wise but far y-wise, standard step might look bad.
            // But here X always increases by TIME_SPACING (150px). Plenty of space.

            // Corner 1
            // Line to sx + 20
            // Curve to sx + 20 + r, sy + r*dirY

            // Wait, "First 90 deg" relative to what?
            // Usually Git graphs go Right. 
            // Turning 90 deg means going Down/Up. 
            // So: Leave Node -> Down/Up -> Right -> Node.

            return `M${sx},${sy} 
                    L${sx + paddingX},${sy} 
                    Q${sx + paddingX + r},${sy} ${sx + paddingX + r},${sy + r * dirY}
                    L${sx + paddingX + r},${ty - r * dirY}
                    Q${sx + paddingX + r},${ty} ${sx + paddingX + r + r},${ty}
                    L${tx},${ty}`;
        };

        const linkPaths = mainG.selectAll(".link")
            .data(links)
            .enter()
            .append("path")
            .attr("d", drawVerticalFirst)
            .attr("fill", "none")
            .attr("stroke", d => colorScale(d.target.payload.branch))
            .attr("stroke-width", 2)
            .attr("opacity", 0.5)
            .attr("class", "transition-all duration-300 pointer-events-none") // Ensure clicks pass through to nodes
            .attr("stroke-dasharray", "5,5") // Dashed line
            .style("stroke-dashoffset", "0");

        // Animate Flow (Data flowing towards newest commit)
        // We use a GSAP-like or simple interval to animate dashoffset
        const animateFlow = () => {
            linkPaths.transition()
                .duration(1000)
                .ease(d3.easeLinear)
                .style("stroke-dashoffset", "-10")
                .on("end", animateFlow);
        };
        // Note: D3 loop might be heavy. CSS animation is better.
        // Let's use CSS class for animation instead of JS loop!
        linkPaths.attr("class", "link-flow"); // Add class

        // Add CSS style for flow in a style tag or rely on global css. 
        // We will inject a style tag for the component specific animation.
        const style = svg.append("defs").append("style");
        style.text(`
            @keyframes flow {
                to { stroke-dashoffset: -20; }
            }
            .link-flow {
                animation: flow 1s linear infinite;
                opacity: 0.5;
                transition: opacity 0.3s, stroke-width 0.3s;
            }
        `);

        // --- 5. NODES ---
        const nodeGroups = mainG.selectAll(".node")
            .data(events)
            .enter()
            .append("g")
            .attr("transform", d => `translate(${nodeMap[d.payload.commit_hash].x}, ${nodeMap[d.payload.commit_hash].y})`)
            .attr("class", "cursor-pointer group")
            .on("click", (e, d) => setSelectedNode(d))
            .on("mouseenter", (e, d) => {
                setHoveredNode(d);
                highlightPath(d);
            })
            .on("mouseleave", () => {
                setHoveredNode(null);
                resetHighlight();
            });

        // Node Glow Effect (Hover) - Improved with CSS group-hover
        nodeGroups.append("circle")
            .attr("r", 12)
            .attr("fill", d => colorScale(d.payload.branch))
            .attr("opacity", 0)
            .attr("class", "transition-all duration-300 group-hover:opacity-60")
            .style("filter", "url(#neonGlow)");

        // Main Node Circle
        nodeGroups.append("circle")
            .attr("r", 6)
            .attr("fill", "#0f172a")
            .attr("stroke", d => colorScale(d.payload.branch))
            .attr("stroke-width", 2)
            .attr("class", "transition-all duration-300 group-hover:scale-125 group-hover:fill-white");

        // Branch Labels (Only for first node of branch)
        nodeGroups.each(function (d) {
            const isFirst = events.find(e => e.payload.branch === d.payload.branch) === d;
            if (isFirst) {
                d3.select(this).append("text")
                    .attr("y", -20)
                    .attr("class", "fill-slate-400 font-mono text-[10px] uppercase tracking-widest")
                    .text(d.payload.branch);
            }
        });

        // --- 6. INTERACTION LOGIC ---
        function highlightPath(d) {
            const ancestors = new Set();
            const stack = [d.payload.commit_hash];
            while (stack.length > 0) {
                const curr = stack.pop();
                ancestors.add(curr);
                const node = nodeMap[curr];
                if (node && node.payload.parents) stack.push(...node.payload.parents);
            }

            linkPaths.style("opacity", l => ancestors.has(l.target.payload.commit_hash) && ancestors.has(l.source.payload.commit_hash) ? 1 : 0.1)
                .style("stroke-width", l => ancestors.has(l.target.payload.commit_hash) ? 4 : 2);

            nodeGroups.style("opacity", n => ancestors.has(n.payload.commit_hash) ? 1 : 0.3);
        }

        function resetHighlight() {
            linkPaths.style("opacity", 0.4).style("stroke-width", 2);
            nodeGroups.style("opacity", 1);
        }

        // Initial View positioning
        svg.transition().duration(1000).call(zoom.transform, d3.zoomIdentity.translate(50, height / 2).scale(0.8));

    }, [data]);

    // Arama Filtreleme
    const filteredNodes = useMemo(() => {
        if (!searchQuery) return [];
        return data.filter(n =>
            n.payload.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.payload.commit_hash.includes(searchQuery)
        );
    }, [searchQuery, data]);

    return (
        <div ref={containerRef} className="w-full h-full relative bg-[#020617] overflow-hidden font-sans">
            {/* UI - Üst Panel (Search) */}
            <div className="absolute top-6 left-6 z-10 flex gap-4">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/50 group-focus-within:text-cyan-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="SEARCH COMMITS..."
                        className="bg-black/40 border border-cyan-500/30 backdrop-blur-md pl-10 pr-4 py-2 rounded-full text-xs text-cyan-100 focus:outline-none focus:border-cyan-400 w-64 transition-all"
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* SVG Canvas */}
            <svg ref={svgRef} className="w-full h-full transition-opacity duration-500"></svg>

            {/* Hover Tooltip */}
            <AnimatePresence>
                {hoveredNode && !selectedNode && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-none bg-slate-900/90 border border-white/10 p-3 rounded-lg backdrop-blur-xl flex items-center gap-3 shadow-2xl"
                    >
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-xs font-mono text-slate-300">{hoveredNode.payload.message.substring(0, 50)}...</span>
                        <span className="text-[10px] bg-white/5 px-2 py-1 rounded text-slate-500 uppercase">{hoveredNode.payload.branch}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Detail Panel */}
            <AnimatePresence>
                {selectedNode && (
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        className="absolute top-0 right-0 w-[400px] h-full bg-slate-950/95 backdrop-blur-2xl border-l border-cyan-500/20 z-30 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] flex flex-col"
                    >
                        {/* Panel Header */}
                        <div className="p-6 border-b border-white/5 flex justify-between items-center">
                            <div className="flex items-center gap-2 text-cyan-400">
                                <GitCommit size={20} />
                                <h3 className="font-bold tracking-tighter text-lg uppercase">Commit Details</h3>
                            </div>
                            <button onClick={() => setSelectedNode(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        {/* Panel Content */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            <section>
                                <label className="text-[10px] text-slate-500 uppercase tracking-[0.2em] mb-2 block">Message</label>
                                <p className="text-lg text-slate-100 font-medium leading-relaxed italic text-cyan-50/90">
                                    "{selectedNode.payload.message}"
                                </p>
                            </section>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <label className="text-[10px] text-slate-500 block mb-1 uppercase">Branch</label>
                                    <div className="flex items-center gap-2 text-cyan-400 font-mono text-sm">
                                        <GitBranch size={14} /> {selectedNode.payload.branch}
                                    </div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <label className="text-[10px] text-slate-500 block mb-1 uppercase">Author</label>
                                    <div className="text-slate-200 text-sm font-semibold">{selectedNode.payload.author}</div>
                                </div>
                            </div>

                            <section>
                                <label className="text-[10px] text-slate-500 uppercase tracking-[0.2em] mb-2 block">Hash & Signature</label>
                                <div className="bg-black/40 p-3 rounded-lg border border-white/5 font-mono text-[11px] text-cyan-500/80 break-all leading-relaxed">
                                    {selectedNode.payload.commit_hash}
                                </div>
                            </section>
                        </div>

                        {/* Panel Footer */}
                        <div className="p-6 bg-black/20 border-t border-white/5">
                            <a
                                href={`${repoInfo?.url?.replace('.git', '')}/commit/${selectedNode.payload.commit_hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-center justify-center gap-3 w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(8,145,178,0.3)]"
                            >
                                <ExternalLink size={18} />
                                OPEN ON GITHUB
                            </a>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Visual Decorative Overlay */}
            <div className="absolute inset-0 pointer-events-none border-[20px] border-cyan-500/5 opacity-50 z-0"></div>
        </div>
    );
};

export default TimelineGraph;