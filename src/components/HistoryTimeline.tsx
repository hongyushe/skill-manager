"use client";

import { useState } from "react";
import { HistoryData } from "@/lib/types";

interface HistoryTimelineProps {
  history: HistoryData;
}

export default function HistoryTimeline({ history }: HistoryTimelineProps) {
  const [expanded, setExpanded] = useState(false);
  const logs = expanded ? history.execution_logs : history.execution_logs.slice(0, 10);

  if (history.execution_logs.length === 0) {
    return (
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Execution History
        </h2>
        <p className="text-sm text-gray-400">No executions yet</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
        Execution History
      </h2>
      <div className="space-y-1">
        {logs.map((log) => {
          const time = new Date(log.timestamp).toLocaleTimeString("zh-CN", {
            hour: "2-digit",
            minute: "2-digit",
          });
          const date = new Date(log.timestamp).toLocaleDateString("zh-CN", {
            month: "short",
            day: "numeric",
          });
          const isToday =
            new Date(log.timestamp).toDateString() === new Date().toDateString();
          const timeLabel = isToday ? time : `${date} ${time}`;

          const statusColor =
            log.status === "success"
              ? "text-green-600"
              : log.status === "failed"
                ? "text-red-600"
                : "text-yellow-600";

          const snippet =
            log.output.length > 80 ? log.output.slice(0, 80) + "..." : log.output;

          return (
            <div key={log.id} className="flex items-start gap-3 text-sm py-1">
              <span className="text-gray-400 shrink-0 w-20 text-right">
                {timeLabel}
              </span>
              <span className="text-gray-400 shrink-0 w-16">
                {log.task_name || log.triggered_by}
              </span>
              <span className={`shrink-0 w-12 font-medium ${statusColor}`}>
                {log.status}
              </span>
              <span className="text-gray-600 line-clamp-1">{snippet}</span>
            </div>
          );
        })}
      </div>
      {history.execution_logs.length > 10 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="text-xs text-blue-600 hover:text-blue-800 mt-2"
        >
          View all ({history.execution_logs.length} entries)
        </button>
      )}
    </div>
  );
}
