"use client";

import { SkillSection, DotBlock } from "@/lib/types";
import FlowchartRenderer from "./FlowchartRenderer";

interface SkillViewerProps {
  meta: { name: string; description: string };
  sections: SkillSection[];
  dotBlocks: DotBlock[];
}

function MarkdownContent({ content }: { content: string }) {
  // Simple markdown-like rendering for lists, code blocks, tables
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let codeIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${codeIndex}`}
            className="bg-gray-900 text-green-400 rounded-lg p-4 overflow-x-auto text-sm my-2"
          >
            <code>{codeBuffer.join("\n")}</code>
          </pre>
        );
        codeBuffer = [];
        codeIndex++;
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Tables
    if (line.includes("|") && line.trim().startsWith("|")) {
      const tableLines: string[] = [];
      let j = i;
      while (j < lines.length && lines[j].includes("|") && lines[j].trim().startsWith("|")) {
        tableLines.push(lines[j]);
        j++;
      }
      const rows = tableLines
        .filter((l) => !l.match(/^\|[\s-|]+\|$/))
        .map((l) =>
          l
            .split("|")
            .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
            .map((c) => c.trim())
        );
      if (rows.length > 0) {
        elements.push(
          <div key={`table-${i}`} className="overflow-x-auto my-3">
            <table className="min-w-full text-sm border border-gray-200 rounded">
              <thead>
                <tr className="bg-gray-50">
                  {rows[0].map((cell, ci) => (
                    <th
                      key={ci}
                      className="px-3 py-2 text-left font-medium text-gray-600 border-b"
                    >
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(1).map((row, ri) => (
                  <tr key={ri} className="border-b last:border-0">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-3 py-2 text-gray-700">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        i = j - 1;
        continue;
      }
    }

    // Bullet lists
    if (line.match(/^[-*]\s/)) {
      elements.push(
        <li key={`li-${i}`} className="ml-4 text-gray-700 text-sm">
          {line.replace(/^[-*]\s/, "")}
        </li>
      );
      continue;
    }

    // Numbered lists
    if (line.match(/^\d+\.\s/)) {
      elements.push(
        <li key={`oli-${i}`} className="ml-4 text-gray-700 text-sm list-decimal">
          {line.replace(/^\d+\.\s/, "")}
        </li>
      );
      continue;
    }

    // Bold headers (### inside section content)
    if (line.startsWith("### ")) {
      elements.push(
        <h4 key={`h4-${i}`} className="font-semibold text-gray-800 mt-3 mb-1">
          {line.replace(/^###\s/, "")}
        </h4>
      );
      continue;
    }

    // Horizontal rules
    if (line.match(/^---+$/)) {
      elements.push(<hr key={`hr-${i}`} className="my-3 border-gray-200" />);
      continue;
    }

    // Empty lines
    if (!line.trim()) {
      continue;
    }

    // Regular text
    elements.push(
      <p key={`p-${i}`} className="text-gray-700 text-sm leading-relaxed">
        {line}
      </p>
    );
  }

  return <div className="space-y-1">{elements}</div>;
}

const SECTION_LABELS: Record<string, string> = {
  Overview: "Overview",
  "When to Use": "When to Use",
  "Core Pattern": "Core Pattern",
  "Quick Reference": "Quick Reference",
  Implementation: "Implementation",
  "Common Mistakes": "Common Mistakes",
  "Real-World Impact": "Real-World Impact",
  "The Bottom Line": "The Bottom Line",
};

export default function SkillViewer({
  meta,
  sections,
  dotBlocks,
}: SkillViewerProps) {
  return (
    <div>
      {/* Meta card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-100">
        <h1 className="text-2xl font-bold text-gray-900">{meta.name}</h1>
        <p className="text-gray-600 mt-2">{meta.description}</p>
      </div>

      {/* Flowcharts */}
      {dotBlocks.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Flowcharts
          </h2>
          <div className="space-y-4">
            {dotBlocks.map((block) => (
              <FlowchartRenderer key={block.index} dotCode={block.code} />
            ))}
          </div>
        </div>
      )}

      {/* Sections */}
      {sections.map((section, i) => {
        const label =
          SECTION_LABELS[section.heading] || section.heading;
        return (
          <div key={i} className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2 border-b border-gray-100 pb-1">
              {label}
            </h2>
            <MarkdownContent content={section.content} />
          </div>
        );
      })}
    </div>
  );
}
