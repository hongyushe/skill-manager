import SkillList from "@/components/SkillList";
import { listSkills, listSkillsOverview } from "@/lib/storage";
import DashboardView from "@/components/DashboardView";

export default async function Home() {
  const skills = await listSkills();
  const overviews = await listSkillsOverview();

  return (
    <div className="flex min-h-screen">
      <SkillList skills={skills} />
      <main className="flex-1 p-8">
        <DashboardView overviews={overviews} />
      </main>
    </div>
  );
}
