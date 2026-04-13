import SkillList from "@/components/SkillList";
import { listSkills } from "@/lib/storage";

export default async function Home() {
  const skills = await listSkills();

  return (
    <div className="flex min-h-screen">
      <SkillList skills={skills} />
      <main className="flex-1 p-8">
        <div className="max-w-4xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Skill Manager
          </h1>
          <p className="text-gray-500 mb-8">
            Visualize, edit, and schedule your Claude Code skills.
          </p>
          {skills.length === 0 ? (
            <p className="text-gray-400">
              No skills found. Check your SKILLS_DIR setting.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {skills.map((name) => (
                <a
                  key={name}
                  href={`/skills/${name}`}
                  className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <h3 className="font-medium text-gray-900">{name}</h3>
                </a>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
