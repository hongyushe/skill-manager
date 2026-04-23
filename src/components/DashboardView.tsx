"use client";

import { useEffect } from "react";
import Link from "next/link";
import { SkillOverview } from "@/lib/types";

interface DashboardViewProps {
  overviews: SkillOverview[];
}

export default function DashboardView({ overviews }: DashboardViewProps) {
  // Sync summaries on mount — checks SKILL.md hashes and regenerates stale ones
  useEffect(() => {
    fetch("/api/summary", { method: "GET" }).catch(() => {});
  }, []);

  const withTasks = overviews.filter((s) => s.tasks.length > 0);
  const withoutTasks = overviews.filter((s) => s.tasks.length === 0);
  const allTasks = overviews.flatMap((s) =>
    s.tasks.map((t) => ({ ...t, skillName: s.name, skillSummary: s.summary }))
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Active Tasks */}
      {allTasks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Active Tasks</h2>
          <div className="space-y-3">
            {allTasks.map((task) => (
              <Link
                key={`${task.skillName}-${task.id}`}
                href={`/skills/${task.skillName}`}
                className="block border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {task.triggerType === "cron" ? "🔵" : task.triggerType === "webhook" ? "🟢" : "⚪"}
                    </span>
                    <span className="font-medium text-gray-900">{task.name}</span>
                    <span className="text-xs text-gray-400">/ {task.skillName}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {task.triggerType === "cron" ? task.triggerConfig : task.triggerType}
                  </span>
                </div>
                {task.instruction && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                    {task.instruction}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Skills with tasks */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Skills</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {withTasks.map((skill) => (
            <Link
              key={skill.name}
              href={`/skills/${skill.name}`}
              className="block border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{skill.name}</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {skill.tasks.length} task{skill.tasks.length > 1 ? "s" : ""}
                </span>
              </div>
              {skill.summary ? (
                <p className="text-sm text-gray-500 line-clamp-2">{skill.summary}</p>
              ) : (
                <p className="text-sm text-gray-300 italic">No summary yet</p>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Skills without tasks */}
      {withoutTasks.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray-500 mb-2">No tasks configured</h2>
          <div className="flex flex-wrap gap-2">
            {withoutTasks.map((skill) => (
              <Link
                key={skill.name}
                href={`/skills/${skill.name}`}
                className="text-sm text-gray-400 hover:text-gray-600 hover:underline"
              >
                {skill.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
