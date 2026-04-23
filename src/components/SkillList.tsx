"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SkillListProps {
  skills: string[];
}

export default function SkillList({ skills }: SkillListProps) {
  const pathname = usePathname();
  const [hiddenSkills, setHiddenSkills] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/skills/visibility")
      .then((r) => r.json())
      .then((data: Record<string, { visible: boolean; automation_enabled: boolean }>) => {
        const hidden = new Set<string>();
        for (const [name, entry] of Object.entries(data)) {
          if (!entry.visible) hidden.add(name);
        }
        setHiddenSkills(hidden);
      })
      .catch(() => {});
  }, []);

  const visibleSkills = skills.filter((s) => !hiddenSkills.has(s));

  return (
    <aside className="w-64 min-h-screen bg-gray-50 border-r border-gray-200 p-4">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Skills
      </h2>
      <nav className="space-y-1">
        {visibleSkills.map((name) => {
          const href = `/skills/${name}`;
          const active = pathname === href;
          return (
            <Link
              key={name}
              href={href}
              className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? "bg-blue-100 text-blue-700 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {name}
            </Link>
          );
        })}
      </nav>
      <div className="mt-6 pt-4 border-t border-gray-200 space-y-1">
        <Link
          href="/"
          className={`block px-3 py-2 rounded-md text-sm transition-colors ${
            pathname === "/"
              ? "bg-blue-100 text-blue-700 font-medium"
              : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          Dashboard
        </Link>
        <Link
          href="/manage"
          className={`block px-3 py-2 rounded-md text-sm transition-colors ${
            pathname === "/manage"
              ? "bg-blue-100 text-blue-700 font-medium"
              : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          Manage
        </Link>
        <Link
          href="/tools"
          className={`block px-3 py-2 rounded-md text-sm transition-colors ${
            pathname === "/tools"
              ? "bg-blue-100 text-blue-700 font-medium"
              : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          Tools
        </Link>
        <Link
          href="/settings"
          className={`block px-3 py-2 rounded-md text-sm transition-colors ${
            pathname === "/settings"
              ? "bg-blue-100 text-blue-700 font-medium"
              : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          Settings
        </Link>
      </div>
    </aside>
  );
}
