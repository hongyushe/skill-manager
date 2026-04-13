"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import SkillViewer from "@/components/SkillViewer";
import CustomEditor from "@/components/CustomEditor";
import HistoryView from "@/components/HistoryView";
import { SkillDetail } from "@/lib/types";

type Tab = "view" | "custom" | "history";

export default function SkillDetailPage() {
  const params = useParams();
  const name = params.name as string;
  const [skill, setSkill] = useState<SkillDetail | null>(null);
  const [tab, setTab] = useState<Tab>("view");
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);

  const load = async () => {
    const res = await fetch(`/api/skills/${name}`);
    const data = await res.json();
    setSkill(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [name]);

  const handleExecute = async () => {
    setExecuting(true);
    try {
      await fetch(`/api/execute/${name}?trigger=manual`, { method: "POST" });
      await load();
    } finally {
      setExecuting(false);
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
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-gray-200">
        {(["view", "custom", "history"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "view"
              ? "View"
              : t === "custom"
              ? "Custom"
              : "History"}
          </button>
        ))}
        <div className="ml-auto">
          <button
            onClick={handleExecute}
            disabled={executing}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {executing ? "Running..." : "Execute"}
          </button>
        </div>
      </div>

      {/* Tab content */}
      {tab === "view" && (
        <SkillViewer
          meta={skill.parsed.meta}
          sections={skill.parsed.sections}
          dotBlocks={skill.parsed.dotBlocks}
        />
      )}
      {tab === "custom" && (
        <CustomEditor
          skillName={name}
          custom={skill.custom}
          onRefresh={load}
        />
      )}
      {tab === "history" && (
        <HistoryView history={skill.history} />
      )}
    </div>
  );
}
