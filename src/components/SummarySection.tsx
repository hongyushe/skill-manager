"use client";

import { useState } from "react";

interface SummarySectionProps {
  skillName: string;
  summary: string | null;
}

export default function SummarySection({ skillName, summary: initialSummary }: SummarySectionProps) {
  const [summary, setSummary] = useState(initialSummary || "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to generate summary");
        return;
      }
      setSummary(data.summary);
    } catch {
      setError("Failed to generate summary");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/skills/${skillName}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_summary", summary }),
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Overview</h2>
        {summary && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Edit
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
          <p className="text-sm text-red-700">{error}</p>
          <a href="/settings" className="text-xs text-red-600 underline">
            Go to Settings
          </a>
        </div>
      )}

      {editing ? (
        <div>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={5}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setSummary(initialSummary || "");
              }}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : summary ? (
        <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
      ) : (
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          {generating ? "Generating summary..." : "Generate Summary"}
        </button>
      )}
    </div>
  );
}
