"use client";

import { TaskEntry } from "@/lib/types";

interface TaskCardProps {
  skillName: string;
  task: TaskEntry;
  onExecute: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

export default function TaskCard({ skillName, task, onExecute, onDelete }: TaskCardProps) {
  const typeIcon = task.triggerType === "cron" ? "🔵" : task.triggerType === "webhook" ? "🟢" : "⚪";
  const typeLabel =
    task.triggerType === "cron"
      ? `Cron: ${task.triggerConfig}`
      : task.triggerType === "webhook"
        ? `Webhook: POST /api/hooks/${task.triggerConfig}`
        : "Manual only";

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span>{typeIcon}</span>
          <h3 className="font-medium text-gray-900">{task.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onExecute(task.id)}
            className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100"
          >
            Execute
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="px-2 py-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
          >
            Delete
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-1">{typeLabel}</p>
      {task.instruction && (
        <p className="text-sm text-gray-600 mt-2 line-clamp-3">{task.instruction}</p>
      )}
    </div>
  );
}
