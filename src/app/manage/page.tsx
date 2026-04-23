"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface VisibilityEntry {
  visible: boolean;
  automation_enabled: boolean;
}

export default function ManagePage() {
  const [visibility, setVisibility] = useState<Record<string, VisibilityEntry>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await fetch("/api/skills/visibility");
      const data = await res.json();
      setVisibility(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (skillName: string, field: "visible" | "automation_enabled") => {
    const current = visibility[skillName] || { visible: true, automation_enabled: true };
    const newValue = !current[field];
    setVisibility((prev) => ({
      ...prev,
      [skillName]: { ...current, [field]: newValue },
    }));
    await fetch("/api/skills/visibility", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skillName, [field]: newValue }),
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Loading...
      </div>
    );
  }

  const skills = Object.entries(visibility);

  return (
    <div className="flex-1 p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Skills 管理</h1>
      <p className="text-sm text-gray-500 mb-6">
        控制哪些 Skills 显示在侧边栏，以及哪些允许被定时任务或 Webhook 自动触发。
      </p>

      <div className="space-y-3">
        {skills.map(([name, entry]) => (
          <div
            key={name}
            className="border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Link
                  href={`/skills/${name}`}
                  className="font-medium text-gray-900 hover:text-blue-600"
                >
                  {name}
                </Link>
                {!entry.visible && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                    已隐藏
                  </span>
                )}
                {!entry.automation_enabled && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                    自动化关闭
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6 shrink-0">
              {/* Visible toggle */}
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <span className="whitespace-nowrap">侧边栏可见</span>
                <button
                  onClick={() => toggle(name, "visible")}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    entry.visible ? "bg-blue-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      entry.visible ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </label>

              {/* Automation toggle */}
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <span className="whitespace-nowrap">允许自动化</span>
                <button
                  onClick={() => toggle(name, "automation_enabled")}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    entry.automation_enabled ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      entry.automation_enabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </label>
            </div>
          </div>
        ))}
      </div>

      {skills.length === 0 && (
        <p className="text-sm text-gray-400 text-center mt-8">No skills found</p>
      )}
    </div>
  );
}
