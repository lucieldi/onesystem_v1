import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { IshikawaData } from '../types';

interface Props {
  data: IshikawaData;
}

const IshikawaDiagram: React.FC<Props> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 500;
    const margin = { top: 50, right: 150, bottom: 50, left: 50 };

    // Set SVG dimensions
    svg.attr("viewBox", `0 0 ${width} ${height}`)
       .attr("width", "100%")
       .attr("height", "100%");

    const mainLineY = height / 2;
    const endX = width - margin.right;
    const startX = margin.left;

    // Draw Main Spine
    svg.append("line")
      .attr("x1", startX)
      .attr("y1", mainLineY)
      .attr("x2", endX)
      .attr("y2", mainLineY)
      .attr("stroke", "#D4D4D4")
      .attr("stroke-width", 3)
      .attr("marker-end", "url(#arrow)");

    // Define arrowhead
    svg.append("defs").append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 8)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#D4D4D4");

    // Draw Head (Effect)
    svg.append("rect")
      .attr("x", endX + 10)
      .attr("y", mainLineY - 30)
      .attr("width", 130)
      .attr("height", 60)
      .attr("rx", 5)
      .attr("fill", "#2C2C2C")
      .attr("stroke", "#2383E2")
      .attr("stroke-width", 2);

    svg.append("text")
      .attr("x", endX + 75)
      .attr("y", mainLineY)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .attr("fill", "#fff")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text(data.effect.length > 15 ? data.effect.substring(0, 15) + '...' : data.effect);

    // Draw Categories (Ribs)
    const numCategories = data.categories.length;
    const spacing = (endX - startX) / (numCategories + 1);

    data.categories.forEach((cat, i) => {
      const xPos = endX - ((i + 1) * spacing);
      const isTop = i % 2 === 0;
      const yEnd = isTop ? mainLineY - 120 : mainLineY + 120;
      const textY = isTop ? yEnd - 10 : yEnd + 20;

      // Diagonal line
      svg.append("line")
        .attr("x1", xPos)
        .attr("y1", mainLineY)
        .attr("x2", xPos + 40) // Angle it slightly right
        .attr("y2", yEnd)
        .attr("stroke", "#A3A3A3")
        .attr("stroke-width", 2);

      // Category Label
      svg.append("text")
        .attr("x", xPos + 40)
        .attr("y", textY)
        .attr("text-anchor", "middle")
        .attr("fill", "#2383E2")
        .style("font-weight", "bold")
        .text(cat.name);

      // Causes (Bones)
      cat.causes.forEach((cause, cIndex) => {
        const causeY = isTop 
          ? yEnd + 25 + (cIndex * 20) 
          : yEnd - 25 - (cIndex * 20);
        
        // Limit number of displayed causes to avoid clutter
        if ((isTop && causeY < mainLineY - 10) || (!isTop && causeY > mainLineY + 10)) {
           // Horizontal line for cause
          svg.append("line")
            .attr("x1", xPos + 20 + (cIndex * 5)) // Slanted offset
            .attr("y1", causeY)
            .attr("x2", xPos + 120)
            .attr("y2", causeY)
            .attr("stroke", "#555")
            .attr("stroke-width", 1);

          svg.append("text")
            .attr("x", xPos + 125)
            .attr("y", causeY)
            .attr("dy", "0.3em")
            .attr("fill", "#D4D4D4")
            .style("font-size", "10px")
            .text(cause);
        }
      });
    });

  }, [data]);

  return (
    <div className="w-full h-full bg-[#1e1e1e] rounded-lg overflow-hidden border border-[#333] shadow-lg">
      <svg ref={svgRef} className="w-full h-full"></svg>
    </div>
  );
};

export default IshikawaDiagram;