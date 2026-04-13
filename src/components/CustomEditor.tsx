"use client";

import { useState } from "react";
import { CustomData, TriggerEntry, ExecDetailEntry } from "@/lib/types";

interface CustomEditorProps {
  skillName: string;
  custom: CustomData;
  onRefresh: () => void;
}

type EntryType = "trigger" | "exec";

interface PreviewData {
  trigger?: {
    cron?: string;
    type: string;
    endpoint?: string;
    chain_target?: string;
    explanation: string;
  };
  execDetail?: {
    prompt: string;
    explanation: string;
  };
}

export default function CustomEditor({
  skillName,
  custom,
  onRefresh,
}: CustomEditorProps) {
  const [subTab, setSubTab] = useState<EntryType>("trigger");
  const [showModal, setShowModal] = useState(false);
  const [inputText, setInputText] = useState("");
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleInterpret = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: subTab, text: inputText }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setPreview(
          subTab === "trigger"
            ? { trigger: data }
            : { execDetail: data }
        );
      }
    } catch (e) {
      alert(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!preview) return;
    setSaving(true);
    try {
      const updated: CustomData = {
        triggers: [...custom.triggers],
        execDetails: [...custom.execDetails],
      };

      if (subTab === "trigger" && preview.trigger) {
        const t = preview.trigger;
        const count = updated.triggers.length + 1;
        const entry: TriggerEntry = {
          id: `TRG-${String(count).padStart(3, "0")}`,
          intent: inputText,
          type: t.type as TriggerEntry["type"],
          cron: t.cron || undefined,
          endpoint: t.endpoint || undefined,
          chainTarget: t.chain_target || undefined,
          status: "active",
        };
        updated.triggers.push(entry);

        // Register cron if applicable
        if (t.type === "cron" && t.cron) {
          await fetch("/api/cron", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              cron: t.cron,
              skillName,
              action: "register",
            }),
          });
        }
      } else if (subTab === "exec" && preview.execDetail) {
        const count = updated.execDetails.length + 1;
        const entry: ExecDetailEntry = {
          id: `EXEC-${String(count).padStart(3, "0")}`,
          intent: inputText,
          prompt: preview.execDetail.prompt,
        };
        updated.execDetails.push(entry);
      }

      await fetch(`/api/skills/${skillName}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          custom: updated,
          editDetail: `Added ${subTab} entry: ${inputText}`,
        }),
      });

      setShowModal(false);
      setInputText("");
      setPreview(null);
      onRefresh();
    } catch (e) {
      alert(String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entryType: EntryType, entryId: string) => {
    if (!confirm(`Delete ${entryId}?`)) return;
    await fetch(`/api/skills/${skillName}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entryType, entryId }),
    });
    onRefresh();
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setSubTab("trigger")}
          className={`px-3 py-1.5 text-sm rounded-lg ${
            subTab === "trigger"
              ? "bg-blue-100 text-blue-700"
              : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          Triggers ({custom.triggers.length})
        </button>
        <button
          onClick={() => setSubTab("exec")}
          className={`px-3 py-1.5 text-sm rounded-lg ${
            subTab === "exec"
              ? "bg-green-100 text-green-700"
              : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          Execution Details ({custom.execDetails.length})
        </button>
        <button
          onClick={() => {
            setShowModal(true);
            setPreview(null);
            setInputText("");
          }}
          className="ml-auto px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          + Add Entry
        </button>
      </div>

      {/* Entries list */}
      {subTab === "trigger" && (
        <div className="space-y-3">
          {custom.triggers.length === 0 && (
            <p className="text-gray-400 text-sm">No triggers yet.</p>
          )}
          {custom.triggers.map((t) => (
            <div
              key={t.id}
              className="border border-gray-200 rounded-lg p-4 bg-white"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-mono bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                    {t.id}
                  </span>
                  <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    {t.type}
                  </span>
                  <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    {t.status}
                  </span>
                  <p className="text-sm text-gray-700 mt-2">{t.intent}</p>
                  {t.cron && (
                    <p className="text-xs text-gray-500 mt-1 font-mono">
                      cron: {t.cron}
                    </p>
                  )}
                  {t.endpoint && (
                    <p className="text-xs text-gray-500 mt-1 font-mono">
                      endpoint: {t.endpoint}
                    </p>
                  )}
                  {t.chainTarget && (
                    <p className="text-xs text-gray-500 mt-1 font-mono">
                      chain: {t.chainTarget}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete("trigger", t.id)}
                  className="text-red-400 hover:text-red-600 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {subTab === "exec" && (
        <div className="space-y-3">
          {custom.execDetails.length === 0 && (
            <p className="text-gray-400 text-sm">
              No execution details yet.
            </p>
          )}
          {custom.execDetails.map((e) => (
            <div
              key={e.id}
              className="border border-gray-200 rounded-lg p-4 bg-white"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <span className="text-xs font-mono bg-green-50 text-green-600 px-2 py-0.5 rounded">
                    {e.id}
                  </span>
                  <p className="text-sm text-gray-700 mt-2">{e.intent}</p>
                  <pre className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded whitespace-pre-wrap">
                    {e.prompt}
                  </pre>
                </div>
                <button
                  onClick={() => handleDelete("exec", e.id)}
                  className="text-red-400 hover:text-red-600 text-sm ml-4"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add entry modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <h3 className="text-lg font-semibold mb-4">
              Add {subTab === "trigger" ? "Trigger" : "Execution Detail"}
            </h3>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                subTab === "trigger"
                  ? "e.g. 每天早上9点执行..."
                  : "e.g. 检查代码时重点关注安全问题..."
              }
              className="w-full border border-gray-300 rounded-lg p-3 text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleInterpret}
                disabled={loading || !inputText.trim()}
                className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Interpreting..." : "Interpret"}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-500 text-sm hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
            </div>

            {/* Preview */}
            {preview && (
              <div className="mt-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Preview
                </h4>
                {preview.trigger && (
                  <div className="text-sm space-y-1">
                    <p>
                      <span className="text-gray-500">Type:</span>{" "}
                      {preview.trigger.type}
                    </p>
                    {preview.trigger.cron && (
                      <p>
                        <span className="text-gray-500">Cron:</span>{" "}
                        <code className="bg-white px-1 rounded">
                          {preview.trigger.cron}
                        </code>
                      </p>
                    )}
                    {preview.trigger.endpoint && (
                      <p>
                        <span className="text-gray-500">Endpoint:</span>{" "}
                        <code className="bg-white px-1 rounded">
                          {preview.trigger.endpoint}
                        </code>
                      </p>
                    )}
                    {preview.trigger.chain_target && (
                      <p>
                        <span className="text-gray-500">Chain to:</span>{" "}
                        {preview.trigger.chain_target}
                      </p>
                    )}
                    <p className="text-gray-600">
                      {preview.trigger.explanation}
                    </p>
                  </div>
                )}
                {preview.execDetail && (
                  <div className="text-sm space-y-1">
                    <pre className="bg-white p-2 rounded whitespace-pre-wrap">
                      {preview.execDetail.prompt}
                    </pre>
                    <p className="text-gray-600">
                      {preview.execDetail.explanation}
                    </p>
                  </div>
                )}
                <button
                  onClick={handleConfirm}
                  disabled={saving}
                  className="mt-3 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Confirm & Save"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
