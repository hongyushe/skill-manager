import SkillList from "@/components/SkillList";
import { listSkills } from "@/lib/storage";
import SettingsForm from "@/components/SettingsForm";

export default async function SettingsPage() {
  const skills = await listSkills();
  return (
    <div className="flex min-h-screen">
      <SkillList skills={skills} />
      <main className="flex-1 p-8">
        <SettingsForm />
      </main>
    </div>
  );
}
