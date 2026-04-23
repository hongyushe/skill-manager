"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import SummarySection from "@/components/SummarySection";
import TaskCard from "@/components/TaskCard";
import AddTaskModal from "@/components/AddTaskModal";
import HistoryTimeline from "@/components/HistoryTimeline";
import { SkillDetail } from "@/lib/types";

export default function SkillDetailPage() {
  const params = useParams();
  const name = params.name as string;
  const [skill, setSkill] = useState<SkillDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null); // task_id or "general"
  const [showAddModal, setShowAddModal] = useState(false);
  const [processSteps, setProcessSteps] = useState<{ toolName: string; display: string }[] | null>(null);
  const [reasoningTurns, setReasoningTurns] = useState(0);
  const [processExpanded, setProcessExpanded] = useState(false);
  const load = async () => {
    const res = await fetch(`/api/skills/${name}`);
    const data = await res.json();
    setSkill(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [name]);

  const handleExecuteTask = async (taskId: string) => {
    setExecuting(taskId);
    try {
      const res = await fetch(`/api/execute/${name}?trigger=manual&task_id=${taskId}`, {
        method: "POST",
      });
      const data = await res.json();
      setProcessSteps(data.process?.length > 0 ? data.process : null);
      setReasoningTurns(data.reasoningTurns || 0);
      setProcessExpanded(false);
      await load();
    } finally {
      setExecuting(null);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    await fetch(`/api/skills/${name}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_task", task_id: taskId }),
    });
    await load();
  };

  const handleGeneralExecute = async () => {
    setExecuting("general");
    try {
      const res = await fetch(`/api/execute/${name}?trigger=manual`, { method: "POST" });
      const data = await res.json();
      setProcessSteps(data.process?.length > 0 ? data.process : null);
      setReasoningTurns(data.reasoningTurns || 0);
      setProcessExpanded(false);
      await load();
    } finally {
      setExecuting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Loading...
      </div>
    );
  }

  if (!skill) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-500">
        Skill not found
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
        </div>
        <button
          onClick={handleGeneralExecute}
          disabled={executing === "general"}
          className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {executing === "general" ? "Running..." : "▶ Execute"}
        </button>
      </div>

      {/* Summary */}
      <section className="mb-8">
        <SummarySection skillName={name} summary={skill.summary} />
      </section>

      {/* Tasks */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Tasks
          </h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            + Add Task
          </button>
        </div>
        {skill.custom.tasks.length === 0 ? (
          <p className="text-sm text-gray-400">No tasks configured</p>
        ) : (
          <div className="space-y-3">
            {skill.custom.tasks.map((task) => (
              <TaskCard
                key={task.id}
                skillName={name}
                task={task}
                onExecute={handleExecuteTask}
                onDelete={handleDeleteTask}
              />
            ))}
          </div>
        )}
      </section>

      {/* Latest Result */}
      {skill.history.execution_logs.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Latest Result
          </h2>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2 text-xs text-gray-400">
              <span>
                {new Date(skill.history.execution_logs[0].timestamp).toLocaleString("zh-CN")}
              </span>
              <span
                className={
                  skill.history.execution_logs[0].status === "success"
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {skill.history.execution_logs[0].status}
              </span>
              {skill.history.execution_logs[0].task_name && (
                <span>{skill.history.execution_logs[0].task_name}</span>
              )}
              <span>{skill.history.execution_logs[0].duration_ms}ms</span>
            </div>
            {processSteps && processSteps.length > 0 && (
              <div className="mb-3">
                <button
                  onClick={() => setProcessExpanded(!processExpanded)}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <span>{processExpanded ? "▾" : "▸"}</span>
                  <span>
                    过程 ({reasoningTurns}轮推理 · {processSteps.length}次工具调用)
                  </span>
                </button>
                {processExpanded && (
                  <div className="mt-2 pl-3 border-l-2 border-blue-200 space-y-1">
                    {processSteps.map((step, i) => (
                      <div key={i} className="text-xs text-gray-500 font-mono">
                        {i + 1}. {step.toolName}("{step.display}")
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="text-sm text-gray-800 whitespace-pre-wrap">
              {skill.history.execution_logs[0].output}
            </div>
          </div>
        </section>
      )}

      {/* History */}
      <section>
        <HistoryTimeline history={skill.history} />
      </section>

      {/* Add Task Modal */}
      {showAddModal && (
        <AddTaskModal
          skillName={name}
          existingTasks={skill.custom.tasks}
          onClose={() => setShowAddModal(false)}
          onSaved={load}
        />
      )}
    </div>
  );
}
