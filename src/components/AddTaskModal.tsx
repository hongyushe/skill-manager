"use client";

import { useState } from "react";

interface AddTaskModalProps {
  skillName: string;
  existingTasks: { id: string }[];
  onClose: () => void;
  onSaved: () => void;
}

interface ParsedTask {
  name: string;
  triggerType: "cron" | "webhook" | "manual";
  triggerConfig: string;
  instruction: string;
  explanation: string;
}

export default function AddTaskModal({
  skillName,
  existingTasks,
  onClose,
  onSaved,
}: AddTaskModalProps) {
  const [input, setInput] = useState("");
  const [parsed, setParsed] = useState<ParsedTask | null>(null);
  const [interpreting, setInterpreting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInterpret = async () => {
    if (!input.trim()) return;
    setInterpreting(true);
    setError(null);
    setParsed(null);
    try {
      const res = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "解析失败");
        return;
      }
      setParsed(data);
    } catch {
      setError("解析失败，请检查 API 配置");
    } finally {
      setInterpreting(false);
    }
  };

  const handleConfirm = async () => {
    if (!parsed) return;
    setSaving(true);
    setError(null);
    const nextNum = existingTasks.length + 1;
    const taskId = `TASK-${String(nextNum).padStart(3, "0")}`;

    try {
      const res = await fetch(`/api/skills/${skillName}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_task",
          task: {
            id: taskId,
            name: parsed.name,
            triggerType: parsed.triggerType,
            triggerConfig: parsed.triggerConfig,
            instruction: parsed.instruction,
            status: "active",
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "保存失败");
        return;
      }
      onSaved();
      onClose();
    } catch {
      setError("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const updateParsed = (field: keyof ParsedTask, value: string) => {
    if (!parsed) return;
    setParsed({ ...parsed, [field]: value });
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Task</h2>

        {/* Step 1: Natural language input */}
        {!parsed && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Describe what you want
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder='e.g. "每天早上9:30帮我搜trump的最新发言，有新的就通知我"'
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleInterpret();
                }
              }}
            />
            <p className="text-xs text-gray-400 mt-1">
              Cmd+Enter to submit
            </p>

            {error && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{error}</p>
                {error.includes("API Key") && (
                  <a href="/settings" className="text-xs text-red-600 underline">
                    Go to Settings
                  </a>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleInterpret}
                disabled={interpreting || !input.trim()}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {interpreting ? "Analyzing..." : "Analyze"}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Editable parsed result */}
        {parsed && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Name
              </label>
              <input
                type="text"
                value={parsed.name}
                onChange={(e) => updateParsed("name", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trigger Type
              </label>
              <select
                value={parsed.triggerType}
                onChange={(e) => updateParsed("triggerType", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cron">Cron (scheduled)</option>
                <option value="webhook">Webhook (HTTP)</option>
                <option value="manual">Manual only</option>
              </select>
            </div>

            {parsed.triggerType !== "manual" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {parsed.triggerType === "cron" ? "Cron Expression" : "Webhook Path"}
                </label>
                <input
                  type="text"
                  value={parsed.triggerConfig}
                  onChange={(e) => updateParsed("triggerConfig", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instruction
              </label>
              <textarea
                value={parsed.instruction}
                onChange={(e) => updateParsed("instruction", e.target.value)}
                rows={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <p className="text-xs text-gray-400">{parsed.explanation}</p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setParsed(null);
                  setError(null);
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Confirm & Save"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
