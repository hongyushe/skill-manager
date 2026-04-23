"use client";

import { useEffect, useState } from "react";

interface Settings {
  base_url: string;
  api_key: string;
  model: string;
  skills_dir: string;
  zai_api_key: string;
  lobster_enabled: boolean;
  lobster_path: string;
  lobster_pipeline: string;
  _has_key?: boolean;
  _has_zai_key?: boolean;
}

export default function SettingsForm() {
  const [settings, setSettings] = useState<Settings>({
    base_url: "",
    api_key: "",
    model: "",
    skills_dir: "",
    zai_api_key: "",
    lobster_enabled: false,
    lobster_path: "lobster",
    lobster_pipeline: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setSettings);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            API Base URL
          </label>
          <input
            type="text"
            value={settings.base_url}
            onChange={(e) =>
              setSettings({ ...settings, base_url: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://api.openai.com/v1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            API Key
          </label>
          <input
            type="password"
            value={settings.api_key}
            onChange={(e) =>
              setSettings({ ...settings, api_key: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={settings._has_key ? "Saved (hidden)" : "sk-..."}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Model
          </label>
          <input
            type="text"
            value={settings.model}
            onChange={(e) =>
              setSettings({ ...settings, model: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="gpt-4o"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Skills Directory
          </label>
          <input
            type="text"
            value={settings.skills_dir}
            onChange={(e) =>
              setSettings({ ...settings, skills_dir: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="/Users/you/.claude/skills"
          />
        </div>
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">Z.AI Web Search</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Z.AI API Key
          </label>
          <input
            type="password"
            value={settings.zai_api_key}
            onChange={(e) =>
              setSettings({ ...settings, zai_api_key: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={settings._has_zai_key ? "Saved (hidden)" : "zai-..."}
          />
          <p className="text-xs text-gray-500 mt-1">
            Used for web search via Z.AI MCP. Get your key from{" "}
            <a href="https://z.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
              z.ai
            </a>
          </p>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">Lobster CLI Integration</h2>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="lobster_enabled"
            checked={settings.lobster_enabled}
            onChange={(e) =>
              setSettings({ ...settings, lobster_enabled: e.target.checked })
            }
            className="h-4 w-4 text-blue-600 rounded border-gray-300"
          />
          <label htmlFor="lobster_enabled" className="text-sm font-medium text-gray-700">
            Enable Lobster CLI notifications
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lobster CLI Path
          </label>
          <input
            type="text"
            value={settings.lobster_path}
            onChange={(e) =>
              setSettings({ ...settings, lobster_path: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="lobster"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Default Pipeline
          </label>
          <input
            type="text"
            value={settings.lobster_pipeline}
            onChange={(e) =>
              setSettings({ ...settings, lobster_pipeline: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="exec echo '{{result}}'"
          />
          <p className="text-xs text-gray-500 mt-1">
            Pipeline template. Use {"{{result}}"} as placeholder for execution output.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : saved ? "Saved!" : "Save"}
        </button>
      </div>
    </div>
  );
}
