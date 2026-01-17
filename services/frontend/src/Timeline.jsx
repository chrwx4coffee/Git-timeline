import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const Timeline = ({ events }) => {
    const svgRef = useRef(null);

    useEffect(() => {
        if (!events || events.length === 0) return;

        const width = 1000;
        const height = 600;
        const margin = { top: 50, right: 50, bottom: 50, left: 50 };

        // Clear previous
        d3.select(svgRef.current).selectAll("*").remove();

        const svg = d3.select(svgRef.current)
            .attr("viewBox", `0 0 ${width} ${height}`)
            .classed("w-full h-full", true);

        // Scales
        const timeExtent = d3.extent(events, d => new Date(d.event_time));
        const xScale = d3.scaleTime()
            .domain(timeExtent)
            .range([margin.left, width - margin.right]);

        // Branch Y scale (assign distinct Y for each branch)
        const branches = Array.from(new Set(events.map(e => e.payload.branch || e.payload.target_branch || 'master')));
        const yScale = d3.scalePoint()
            .domain(branches)
            .range([height - margin.bottom, margin.top])
            .padding(0.5);

        // Draw Axis
        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(xScale).ticks(5))
            .attr("color", "#cbd5e1"); // Slate-300

        // Draw Branches Lines
        // Connect events of same branch? Or just draw horizontal lines for branches?
        // Let's draw horizontal tracks
        branches.forEach(branch => {
            svg.append("line")
                .attr("x1", margin.left)
                .attr("x2", width - margin.right)
                .attr("y1", yScale(branch))
                .attr("y2", yScale(branch))
                .attr("stroke", "#475569") // Slate-600
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "5,5"); // Dashed guide

            // Label
            svg.append("text")
                .attr("x", margin.left)
                .attr("y", yScale(branch) - 10)
                .text(branch)
                .attr("fill", "#94a3b8")
                .attr("font-size", "12px");
        });

        // Draw Events
        svg.selectAll(".event-node")
            .data(events)
            .enter()
            .append("circle")
            .attr("cx", d => xScale(new Date(d.event_time)))
            .attr("cy", d => {
                const branch = d.payload.branch || d.payload.target_branch || 'master';
                return yScale(branch);
            })
            .attr("r", 6)
            .attr("fill", d => {
                if (d.event_type === 'BRANCH_CREATED') return '#10b981'; // Green
                if (d.event_type === 'MERGE') return '#bc13fe'; // Purple
                return '#3b82f6'; // Blue
            })
            .attr("stroke", "#fff")
            .attr("stroke-width", 2)
            .append("title") // Tooltip
            .text(d => `${d.event_type}: ${d.payload.message || d.payload.commit_hash}`);

    }, [events]);

    return (
        <div className="w-full h-[600px] glass-panel p-4 overflow-x-auto">
            <svg ref={svgRef} className="w-full h-full"></svg>
        </div>
    );
};

export default Timeline;
