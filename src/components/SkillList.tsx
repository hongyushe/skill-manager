"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SkillListProps {
  skills: string[];
}

export default function SkillList({ skills }: SkillListProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-gray-50 border-r border-gray-200 p-4">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Skills
      </h2>
      <nav className="space-y-1">
        {skills.map((name) => {
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
      <div className="mt-6 pt-4 border-t border-gray-200">
        <Link
          href="/settings"
          className="block px-3 py-2 rounded-md text-sm text-gray-500 hover:bg-gray-100"
        >
          Settings
        </Link>
      </div>
    </aside>
  );
}
