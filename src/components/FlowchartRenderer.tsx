"use client";

import { useEffect, useRef, useState } from "react";

interface FlowchartRendererProps {
  dotCode: string;
}

export default function FlowchartRenderer({ dotCode }: FlowchartRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (collapsed || !containerRef.current) return;

    let cancelled = false;
    (async () => {
      try {
        const { instance } = await import("@viz-js/viz");
        const viz = await instance();
        const svg = viz.renderSVGElement(dotCode);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = "";
          svg.style.maxWidth = "100%";
          svg.style.height = "auto";
          containerRef.current.appendChild(svg);
        }
      } catch (e) {
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = `<pre class="text-red-500 text-sm">${String(e)}</pre>`;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dotCode, collapsed]);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full text-left px-4 py-2 bg-gray-50 text-sm text-gray-600 hover:bg-gray-100 flex items-center gap-2"
      >
        <span>{collapsed ? "\u25B6" : "\u25BC"}</span>
        Flowchart
      </button>
      {!collapsed && (
        <div
          ref={containerRef}
          className="p-4 overflow-x-auto bg-white flex justify-center"
        />
      )}
    </div>
  );
}
