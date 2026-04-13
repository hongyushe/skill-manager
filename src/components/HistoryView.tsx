"use client";

import { useState } from "react";
import { HistoryData } from "@/lib/types";

type SubTab = "executions" | "edits";

interface HistoryViewProps {
  history: HistoryData;
}

export default function HistoryView({ history }: HistoryViewProps) {
  const [subTab, setSubTab] = useState<SubTab>("executions");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSubTab("executions")}
          className={`px-3 py-1.5 text-sm rounded-lg ${
            subTab === "executions"
              ? "bg-blue-100 text-blue-700"
              : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          Execution Logs ({history.execution_logs.length})
        </button>
        <button
          onClick={() => setSubTab("edits")}
          className={`px-3 py-1.5 text-sm rounded-lg ${
            subTab === "edits"
              ? "bg-purple-100 text-purple-700"
              : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          Edit History ({history.edit_logs.length})
        </button>
      </div>

      {subTab === "executions" && (
        <div className="space-y-3">
          {history.execution_logs.length === 0 && (
            <p className="text-gray-400 text-sm">No execution logs yet.</p>
          )}
          {history.execution_logs.map((log) => {
            const expanded = expandedId === log.id;
            const statusColor =
              log.status === "success"
                ? "bg-green-50 text-green-600"
                : log.status === "failed"
                ? "bg-red-50 text-red-600"
                : "bg-yellow-50 text-yellow-600";
            return (
              <div key={log.id} className="border border-gray-200 rounded-lg bg-white">
                <button
                  onClick={() => setExpandedId(expanded ? null : log.id)}
                  className="w-full text-left p-4 flex items-center gap-3"
                >
                  <span className={`text-xs px-2 py-0.5 rounded ${statusColor}`}>
                    {log.status}
                  </span>
                  <span className="text-sm text-gray-600">
                    {log.triggered_by}
                  </span>
                  <span className="text-xs text-gray-400 ml-auto">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                  <span className="text-gray-300">{expanded ? "\u25BC" : "\u25B6"}</span>
                </button>
                {expanded && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Model:</span>{" "}
                        {log.model}
                      </div>
                      <div>
                        <span className="text-gray-500">Duration:</span>{" "}
                        {log.duration_ms}ms
                      </div>
                      <div>
                        <span className="text-gray-500">Tokens:</span>{" "}
                        {log.token_usage.prompt}+{log.token_usage.completion}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Input Prompt:</p>
                      <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {log.input_prompt}
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Output:</p>
                      <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto whitespace-pre-wrap max-h-60 overflow-y-auto">
                        {log.output}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {subTab === "edits" && (
        <div className="space-y-3">
          {history.edit_logs.length === 0 && (
            <p className="text-gray-400 text-sm">No edit history yet.</p>
          )}
          {history.edit_logs.map((log) => (
            <div
              key={log.id}
              className="border border-gray-200 rounded-lg p-4 bg-white"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded">
                  {log.action}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-700">{log.detail}</p>
              {log.before && log.after && (
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Before:</p>
                    <pre className="text-xs bg-red-50 p-2 rounded overflow-x-auto whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {log.before}
                    </pre>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">After:</p>
                    <pre className="text-xs bg-green-50 p-2 rounded overflow-x-auto whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {log.after}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
